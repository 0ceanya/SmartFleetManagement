using SmartFM.Application.Abstractions;
using SmartFM.Domain.Entities;
using SmartFM.Domain.Records;
using SmartFM.Domain.ValueObjects;

namespace SmartFM.Application.Coordinators;

/// <summary>
/// Unified coordinator for all Record types: AuditRecords (status-change log) and IncidentRecords.
/// FleetAssignmentCoordinator is resolved lazily via a factory func to avoid a circular DI dependency.
/// </summary>
public class RecordCoordinator
{
    private readonly IRepository<AuditRecord> _auditRecords;
    private readonly IRepository<Notification> _notifications;
    private readonly IRepository<IncidentRecord> _incidentRecords;
    private readonly IRepository<Assignment> _assignments;
    private readonly IRepository<Shipment> _shipments;
    private readonly Func<FleetAssignmentCoordinator> _getFleetCoordinator;
    private readonly IUnitOfWork _unitOfWork;

    public RecordCoordinator(
        IRepository<AuditRecord> auditRecords,
        IRepository<Notification> notifications,
        IRepository<IncidentRecord> incidentRecords,
        IRepository<Assignment> assignments,
        IRepository<Shipment> shipments,
        Func<FleetAssignmentCoordinator> getFleetCoordinator,
        IUnitOfWork unitOfWork)
    {
        _auditRecords = auditRecords;
        _notifications = notifications;
        _incidentRecords = incidentRecords;
        _assignments = assignments;
        _shipments = shipments;
        _getFleetCoordinator = getFleetCoordinator;
        _unitOfWork = unitOfWork;
    }

    public Task InitializeRecordSubsystem()
    {
        Console.WriteLine("RecordCoordinator initialized");
        return Task.CompletedTask;
    }

    // ── Audit ────────────────────────────────────────────────────────────────

    public Task<IEnumerable<AuditRecord>> GetAuditRecordsAsync() => _auditRecords.GetAllAsync();

    public async Task<IEnumerable<AuditRecord>> GetAuditRecordsByEntityAsync(string entityType, Guid entityId)
    {
        var all = await _auditRecords.GetAllAsync();
        return all.Where(r => r.EntityType == entityType && r.EntityId == entityId)
                  .OrderBy(r => r.CreatedAt);
    }

    public Task<IEnumerable<Notification>> GetNotificationsAsync() => _notifications.GetAllAsync();

    public async Task<(IReadOnlyList<AuditRecord> Records, int TotalCount)> QueryAuditRecordsAsync(
        string? entityType, Guid? entityId, string? eventType,
        DateTime? from, DateTime? to, DateTime? after,
        int page = 1, int pageSize = 50)
    {
        var all = await _auditRecords.GetAllAsync();
        var query = all.AsEnumerable();

        if (entityType is not null)
            query = query.Where(r => r.EntityType == entityType);
        if (entityId is not null)
            query = query.Where(r => r.EntityId == entityId);
        if (from is not null)
            query = query.Where(r => r.CreatedAt >= from);
        if (to is not null)
            query = query.Where(r => r.CreatedAt <= to);
        if (after is not null)
            query = query.Where(r => r.CreatedAt > after);
        if (eventType is not null)
            query = query.Where(r => DescribeEvent(r).EventType == eventType);

        var ordered = query.OrderByDescending(r => r.CreatedAt).ToList();
        var paged = ordered.Skip((page - 1) * pageSize).Take(pageSize).ToList();
        return (paged, ordered.Count);
    }

    public static (string EventType, string Description) DescribeEvent(AuditRecord r) => (r.EntityType, r.FromStatus, r.ToStatus) switch
    {
        (AuditEntityType.Order, null, OrderStatus.Pending) => ("OrderCreated", $"Order {r.EntityId} created"),
        (AuditEntityType.Order, OrderStatus.Pending, OrderStatus.Approved) => ("OrderApproved", $"Order {r.EntityId} approved"),
        (AuditEntityType.Order, OrderStatus.Approved, OrderStatus.Active) => ("OrderActivated", $"Order {r.EntityId} activated"),
        (AuditEntityType.Order, OrderStatus.Active, OrderStatus.Fulfilled) => ("OrderFulfilled", $"Order {r.EntityId} fulfilled"),
        (AuditEntityType.Order, _, OrderStatus.Cancelled) => ("OrderCancelled", $"Order {r.EntityId} cancelled"),
        (AuditEntityType.Assignment, null, AssignmentStatus.Pending) => ("AssignmentCreated", $"Assignment {r.EntityId} created"),
        (AuditEntityType.Assignment, AssignmentStatus.Pending, AssignmentStatus.Assigned) => ("AssignmentApproved", $"Assignment {r.EntityId} approved"),
        (AuditEntityType.Assignment, AssignmentStatus.Assigned, AssignmentStatus.Loaded) => ("AssignmentLoaded", $"Assignment {r.EntityId} loaded"),
        (AuditEntityType.Assignment, AssignmentStatus.Loaded, AssignmentStatus.Delivering) => ("AssignmentInTransit", $"Assignment {r.EntityId} in transit"),
        (AuditEntityType.Assignment, _, AssignmentStatus.Delivered) => ("AssignmentCompleted", $"Assignment {r.EntityId} completed"),
        (AuditEntityType.Assignment, _, AssignmentStatus.Rejected) => ("AssignmentRejected", $"Assignment {r.EntityId} rejected"),
        (AuditEntityType.Invoice, InvoiceStatus.Unpaid, InvoiceStatus.Paid) => ("PaymentCaptured", $"Invoice {r.EntityId} paid"),
        (AuditEntityType.Invoice, null, InvoiceStatus.Unpaid) => ("InvoiceGenerated", $"Invoice {r.EntityId} generated"),
        (AuditEntityType.Vehicle, null, "IncidentReported") => ("IncidentRaised", $"Incident reported for vehicle {r.EntityId}"),
        (AuditEntityType.Vehicle, null, _) => ("VehicleCreated", $"Vehicle {r.EntityId} created"),
        (AuditEntityType.Vehicle, _, "Deleted") => ("VehicleDeleted", $"Vehicle {r.EntityId} deleted"),
        (AuditEntityType.Vehicle, _, _) => ("VehicleStatusChanged", $"Vehicle {r.EntityId} status changed to {r.ToStatus}"),
        (AuditEntityType.Driver or AuditEntityType.Staff, null, "Created") => ($"{r.EntityType}Created", $"{r.EntityType} {r.EntityId} created"),
        (AuditEntityType.Driver or AuditEntityType.Staff, null, "Updated") => ($"{r.EntityType}Updated", $"{r.EntityType} {r.EntityId} updated"),
        (AuditEntityType.Driver or AuditEntityType.Staff, null, "Deleted") => ($"{r.EntityType}Deleted", $"{r.EntityType} {r.EntityId} deleted"),
        _ => ($"{r.EntityType}{r.ToStatus}", $"{r.EntityType} {r.EntityId} changed to {r.ToStatus}")
    };

    public async Task RecordStatusChangeAsync(
        string entityType, Guid entityId,
        string? fromStatus, string toStatus,
        string? changedBy = null)
    {
        var record = new AuditRecord
        {
            EntityType = entityType,
            EntityId = entityId,
            FromStatus = fromStatus,
            ToStatus = toStatus,
            ChangedBy = changedBy
        };
        await _auditRecords.AddAsync(record);
        await _unitOfWork.SaveChangesAsync();
    }

    // ── Incidents ────────────────────────────────────────────────────────────

    public Task<IEnumerable<IncidentRecord>> GetIncidentRecordsAsync() => _incidentRecords.GetAllAsync();

    public async Task<IncidentRecord?> GetIncidentRecordByIdAsync(Guid id) => await _incidentRecords.GetByIdAsync(id);

    public async Task<IncidentRecord> ReportIncidentAsync(Guid vehicleId, string description, string severity, string category)
    {
        var assignments = await _assignments.GetAllAsync();
        var activeAssignment = assignments.FirstOrDefault(a =>
            a.VehicleId == vehicleId &&
            a.Status is AssignmentStatus.Assigned or AssignmentStatus.Loaded or AssignmentStatus.Delivering);

        var affectedShipmentIds = activeAssignment is null
            ? new List<Guid>()
            : (await _shipments.GetAllAsync()).Where(s => s.AssignmentId == activeAssignment.Id).Select(s => s.Id).ToList();

        var incident = new IncidentRecord
        {
            VehicleId = vehicleId,
            ShipmentId = affectedShipmentIds.Count > 0 ? affectedShipmentIds[0] : null,
            Description = description,
            Severity = severity,
            Category = category
        };
        await _incidentRecords.AddAsync(incident);

        if (activeAssignment is not null)
        {
            var fleet = _getFleetCoordinator();
            foreach (var shipmentId in affectedShipmentIds)
                await fleet.GetOrCreateLoadManifestAsync(shipmentId);
            await fleet.RequestReallocationAsync(activeAssignment.Id);
        }

        await _unitOfWork.SaveChangesAsync();

        await RecordStatusChangeAsync(AuditEntityType.Vehicle, vehicleId, null, "IncidentReported", "Staff");

        return incident;
    }

    public async Task<IncidentRecord> ReportIncidentForShipmentAsync(Guid shipmentId, string description, string severity, string category)
    {
        var shipment = await _shipments.GetByIdAsync(shipmentId)
            ?? throw new InvalidOperationException($"Shipment {shipmentId} not found.");
        var assignment = shipment.AssignmentId is null
            ? null
            : await _assignments.GetByIdAsync(shipment.AssignmentId.Value);

        if (assignment is null || assignment.Status is not (AssignmentStatus.Assigned or AssignmentStatus.Loaded or AssignmentStatus.Delivering))
            throw new InvalidOperationException($"No active assignment found for shipment {shipmentId}.");

        return await ReportIncidentAsync(assignment.VehicleId, description, severity, category);
    }
}
