using SmartFM.Application.Abstractions;
using SmartFM.Domain.Entities;
using SmartFM.Domain.Interfaces;
using SmartFM.Domain.Records;
using SmartFM.Domain.ValueObjects;

namespace SmartFM.Application.Coordinators;

public class IncidentCoordinator : ITelemetryObserver
{
    private readonly IRepository<IncidentRecord> _incidentRecords;
    private readonly IRepository<Assignment> _assignments;
    private readonly IRepository<Shipment> _shipments;
    private readonly FleetAssignmentCoordinator _fleetAssignmentCoordinator;
    private readonly IUnitOfWork _unitOfWork;

    public IncidentCoordinator(
        IRepository<IncidentRecord> incidentRecords,
        IRepository<Assignment> assignments,
        IRepository<Shipment> shipments,
        FleetAssignmentCoordinator fleetAssignmentCoordinator,
        IUnitOfWork unitOfWork)
    {
        _incidentRecords = incidentRecords;
        _assignments = assignments;
        _shipments = shipments;
        _fleetAssignmentCoordinator = fleetAssignmentCoordinator;
        _unitOfWork = unitOfWork;
    }

    public Task InitializeIncidentSubsystem()
    {
        Console.WriteLine("IncidentCoordinator initialized");
        return Task.CompletedTask;
    }

    public void OnTelemetryReceived(Vehicle vehicle, TelemetryData data)
    {
        if (!data.IsAnomaly)
            return;

        // ITelemetryObserver is synchronous; the async write is awaited before returning.
        HandleIncidentAsync(vehicle).GetAwaiter().GetResult();
    }

    public Task<IEnumerable<IncidentRecord>> GetIncidentRecordsAsync() => _incidentRecords.GetAllAsync();

    public async Task<IncidentRecord?> GetIncidentRecordByIdAsync(Guid id) => await _incidentRecords.GetByIdAsync(id);

    public async Task<IncidentRecord> ReportIncidentAsync(Guid vehicleId, string description, string severity)
    {
        var assignments = await _assignments.GetAllAsync();
        var activeAssignment = assignments.FirstOrDefault(a => a.VehicleId == vehicleId && a.Status == AssignmentStatus.Active);

        var affectedShipmentIds = activeAssignment is null
            ? new List<Guid>()
            : (await _shipments.GetAllAsync()).Where(s => s.AssignmentId == activeAssignment.Id).Select(s => s.Id).ToList();

        var incident = new IncidentRecord
        {
            VehicleId = vehicleId,
            ShipmentId = affectedShipmentIds.Count > 0 ? affectedShipmentIds[0] : null,
            Description = description,
            Severity = severity
        };
        await _incidentRecords.AddAsync(incident);

        if (activeAssignment is not null)
        {
            foreach (var shipmentId in affectedShipmentIds)
                await _fleetAssignmentCoordinator.GetOrCreateLoadManifestAsync(shipmentId);

            await _fleetAssignmentCoordinator.RequestReallocationAsync(activeAssignment.Id);
        }

        await _unitOfWork.SaveChangesAsync();
        return incident;
    }

    public async Task<IncidentRecord> ReportIncidentForShipmentAsync(Guid shipmentId, string description, string severity)
    {
        var shipment = await _shipments.GetByIdAsync(shipmentId)
            ?? throw new InvalidOperationException($"Shipment {shipmentId} not found.");
        var assignment = shipment.AssignmentId is null
            ? null
            : await _assignments.GetByIdAsync(shipment.AssignmentId.Value);

        if (assignment is null || assignment.Status != AssignmentStatus.Active)
            throw new InvalidOperationException($"No active assignment found for shipment {shipmentId}.");

        return await ReportIncidentAsync(assignment.VehicleId, description, severity);
    }

    private async Task HandleIncidentAsync(Vehicle vehicle)
    {
        await ReportIncidentAsync(vehicle.Id, "Telemetry anomaly detected", "Medium");
    }
}
