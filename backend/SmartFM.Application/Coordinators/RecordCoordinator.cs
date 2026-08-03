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
