using SmartFM.Application.Abstractions;
using SmartFM.Domain.Entities;
using SmartFM.Domain.Interfaces;
using SmartFM.Domain.Records;
using SmartFM.Domain.ValueObjects;

namespace SmartFM.Application.Coordinators;

public class IncidentCoordinator : ITelemetryObserver
{
    private readonly IRepository<IncidentRecord> _incidentRecords;
    private readonly IRepository<LoadManifest> _loadManifests;
    private readonly IRepository<Assignment> _assignments;
    private readonly IRepository<Shipment> _shipments;
    private readonly FleetAssignmentCoordinator _fleetAssignmentCoordinator;
    private readonly IUnitOfWork _unitOfWork;

    public IncidentCoordinator(
        IRepository<IncidentRecord> incidentRecords,
        IRepository<LoadManifest> loadManifests,
        IRepository<Assignment> assignments,
        IRepository<Shipment> shipments,
        FleetAssignmentCoordinator fleetAssignmentCoordinator,
        IUnitOfWork unitOfWork)
    {
        _incidentRecords = incidentRecords;
        _loadManifests = loadManifests;
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

    public async Task<IncidentRecord> ReportIncidentAsync(Guid vehicleId, string description, string severity)
    {
        var assignments = await _assignments.GetAllAsync();
        var activeAssignment = assignments.FirstOrDefault(a => a.VehicleId == vehicleId && a.Status == AssignmentStatus.Active);

        var incident = new IncidentRecord
        {
            VehicleId = vehicleId,
            ShipmentId = activeAssignment?.ShipmentId,
            Description = description,
            Severity = severity
        };
        await _incidentRecords.AddAsync(incident);

        if (activeAssignment is not null)
        {
            await CreateLoadManifestAsync(activeAssignment.ShipmentId);
            await _fleetAssignmentCoordinator.RequestReallocationAsync(activeAssignment.Id);
        }

        await _unitOfWork.SaveChangesAsync();
        return incident;
    }

    public async Task<IncidentRecord> ReportIncidentForShipmentAsync(Guid shipmentId, string description, string severity)
    {
        var assignments = await _assignments.GetAllAsync();
        var activeAssignment = assignments.FirstOrDefault(a => a.ShipmentId == shipmentId && a.Status == AssignmentStatus.Active)
            ?? throw new InvalidOperationException($"No active assignment found for shipment {shipmentId}.");

        return await ReportIncidentAsync(activeAssignment.VehicleId, description, severity);
    }

    private async Task HandleIncidentAsync(Vehicle vehicle)
    {
        await ReportIncidentAsync(vehicle.Id, "Telemetry anomaly detected", "Medium");
    }

    private async Task CreateLoadManifestAsync(Guid shipmentId)
    {
        var shipment = await _shipments.GetByIdAsync(shipmentId);
        if (shipment is null)
            return;

        var manifest = new LoadManifest(
            shipment.Id,
            shipment.Cargoes.Select(c => c.Description).ToList(),
            shipment.Cargoes.Sum(c => c.WeightKg),
            shipment.Cargoes.Any(c => c.IsHazardous),
            DateTime.UtcNow);
        await _loadManifests.AddAsync(manifest);
    }
}
