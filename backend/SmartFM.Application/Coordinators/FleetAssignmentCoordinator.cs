using SmartFM.Application.Abstractions;
using SmartFM.Domain.Entities;
using SmartFM.Domain.Records;
using SmartFM.Domain.ValueObjects;

namespace SmartFM.Application.Coordinators;

public class FleetAssignmentCoordinator
{
    private readonly IRepository<Route> _routes;
    private readonly IRepository<Assignment> _assignments;
    private readonly IRepository<Driver> _drivers;
    private readonly IRepository<Vehicle> _vehicles;
    private readonly IRepository<Shipment> _shipments;
    private readonly IRepository<MaintenanceRecord> _maintenanceRecords;
    private readonly IRepository<DeliveryConfirmation> _deliveryConfirmations;
    private readonly IUnitOfWork _unitOfWork;

    public FleetAssignmentCoordinator(
        IRepository<Route> routes,
        IRepository<Assignment> assignments,
        IRepository<Driver> drivers,
        IRepository<Vehicle> vehicles,
        IRepository<Shipment> shipments,
        IRepository<MaintenanceRecord> maintenanceRecords,
        IRepository<DeliveryConfirmation> deliveryConfirmations,
        IUnitOfWork unitOfWork)
    {
        _routes = routes;
        _assignments = assignments;
        _drivers = drivers;
        _vehicles = vehicles;
        _shipments = shipments;
        _maintenanceRecords = maintenanceRecords;
        _deliveryConfirmations = deliveryConfirmations;
        _unitOfWork = unitOfWork;
    }

    public Task InitializeFleetSubsystem()
    {
        Console.WriteLine("FleetAssignmentCoordinator initialized");
        return Task.CompletedTask;
    }

    public async Task<Route> CreateRouteAsync(Guid originWarehouseId, Guid destinationWarehouseId, decimal estimatedDistanceKm)
    {
        var route = new Route(originWarehouseId, destinationWarehouseId, estimatedDistanceKm);
        await _routes.AddAsync(route);
        await _unitOfWork.SaveChangesAsync();
        return route;
    }

    public Task<IEnumerable<Route>> GetRoutesAsync() => _routes.GetAllAsync();

    public async Task<Route?> GetRouteByIdAsync(Guid id) => await _routes.GetByIdAsync(id);

    public async Task<Assignment> CreateAssignmentAsync(IReadOnlyList<Guid> shipmentIds, Guid driverId, Guid vehicleId, Guid routeId)
    {
        if (shipmentIds is null || shipmentIds.Count == 0)
            throw new ArgumentException("At least one shipment is required.", nameof(shipmentIds));

        var shipments = new List<Shipment>();
        foreach (var shipmentId in shipmentIds)
        {
            var shipment = await _shipments.GetByIdAsync(shipmentId)
                ?? throw new InvalidOperationException($"Shipment {shipmentId} not found.");
            if (shipment.AssignmentId is not null)
                throw new InvalidOperationException($"Shipment {shipmentId} is already assigned.");
            shipments.Add(shipment);
        }

        var driver = await _drivers.GetByIdAsync(driverId)
            ?? throw new InvalidOperationException($"Driver {driverId} not found.");
        var vehicle = await _vehicles.GetByIdAsync(vehicleId)
            ?? throw new InvalidOperationException($"Vehicle {vehicleId} not found.");
        var route = await _routes.GetByIdAsync(routeId)
            ?? throw new InvalidOperationException($"Route {routeId} not found.");

        await EnsureNotDoubleBookedAsync(driverId, vehicleId);

        var assignment = new Assignment(shipments, driver, vehicle, route);
        await _assignments.AddAsync(assignment);

        foreach (var shipment in shipments)
        {
            shipment.AssignTo(assignment.Id);
            shipment.SetStatus(ShipmentStatus.Assigned);
            _shipments.Update(shipment);
        }

        driver.SetAvailability(false);
        _drivers.Update(driver);

        vehicle.SetStatus(VehicleStatus.Assigned);
        _vehicles.Update(vehicle);

        await _unitOfWork.SaveChangesAsync();
        return assignment;
    }

    public async Task<Assignment> ApproveAssignmentAsync(Guid assignmentId)
    {
        var assignment = await _assignments.GetByIdAsync(assignmentId)
            ?? throw new InvalidOperationException($"Assignment {assignmentId} not found.");

        assignment.Approve();
        _assignments.Update(assignment);

        await _unitOfWork.SaveChangesAsync();
        return assignment;
    }

    public async Task<Assignment> CompleteAssignmentAsync(Guid assignmentId)
    {
        var assignment = await _assignments.GetByIdAsync(assignmentId)
            ?? throw new InvalidOperationException($"Assignment {assignmentId} not found.");

        assignment.Complete();
        _assignments.Update(assignment);

        await ReleaseDriverAndVehicleAsync(assignment);

        await _unitOfWork.SaveChangesAsync();
        return assignment;
    }

    public async Task RequestReallocationAsync(Guid assignmentId)
    {
        var assignment = await _assignments.GetByIdAsync(assignmentId)
            ?? throw new InvalidOperationException($"Assignment {assignmentId} not found.");

        assignment.Complete();
        _assignments.Update(assignment);

        await ReleaseDriverAndVehicleAsync(assignment);

        await _unitOfWork.SaveChangesAsync();
        Console.WriteLine($"Reallocation requested for assignment {assignmentId}");
    }

    public async Task<MaintenanceRecord> CreateMaintenanceRecordAsync(Guid vehicleId, string description, DateTime scheduledAt)
    {
        var vehicle = await _vehicles.GetByIdAsync(vehicleId)
            ?? throw new InvalidOperationException($"Vehicle {vehicleId} not found.");

        var record = new MaintenanceRecord
        {
            VehicleId = vehicle.Id,
            Description = description,
            ScheduledAt = scheduledAt
        };
        await _maintenanceRecords.AddAsync(record);
        await _unitOfWork.SaveChangesAsync();
        return record;
    }

    public async Task<DeliveryConfirmation> CreateDeliveryConfirmationAsync(
        Guid shipmentId, Guid driverId, string recipientName, string proofSignature, double gpsLatitude, double gpsLongitude)
    {
        var shipment = await _shipments.GetByIdAsync(shipmentId)
            ?? throw new InvalidOperationException($"Shipment {shipmentId} not found.");
        if (shipment.AssignmentId is null)
            throw new InvalidOperationException($"Shipment {shipmentId} has no assignment.");

        var assignment = await _assignments.GetByIdAsync(shipment.AssignmentId.Value)
            ?? throw new InvalidOperationException($"Assignment {shipment.AssignmentId} not found.");
        if (assignment.DriverId != driverId)
            throw new ArgumentException("Driver is not assigned to this shipment.", nameof(driverId));

        var confirmation = new DeliveryConfirmation(shipmentId, driverId, recipientName, proofSignature, gpsLatitude, gpsLongitude, DateTime.UtcNow);
        await _deliveryConfirmations.AddAsync(confirmation);

        shipment.SetStatus(ShipmentStatus.Delivered);
        _shipments.Update(shipment);

        await _unitOfWork.SaveChangesAsync();
        return confirmation;
    }

    public async Task<DeliveryConfirmation?> GetDeliveryConfirmationByShipmentIdAsync(Guid shipmentId)
    {
        var confirmations = await _deliveryConfirmations.GetAllAsync();
        return confirmations.FirstOrDefault(c => c.ShipmentId == shipmentId);
    }

    public async Task<IEnumerable<(Assignment Assignment, IReadOnlyList<Guid> ShipmentIds)>> GetAssignmentsAsync(string? status = null, Guid? driverId = null)
    {
        var assignments = await _assignments.GetAllAsync();
        if (status is not null)
            assignments = assignments.Where(a => a.Status == status);
        if (driverId is not null)
            assignments = assignments.Where(a => a.DriverId == driverId);

        var shipments = await _shipments.GetAllAsync();
        return assignments
            .Select(a => (a, (IReadOnlyList<Guid>)shipments.Where(s => s.AssignmentId == a.Id).Select(s => s.Id).ToList()))
            .ToList();
    }

    public async Task<Assignment?> GetAssignmentByIdAsync(Guid id) => await _assignments.GetByIdAsync(id);

    public async Task<(Assignment Assignment, IReadOnlyList<Guid> ShipmentIds)?> GetAssignmentDetailsAsync(Guid id)
    {
        var assignment = await _assignments.GetByIdAsync(id);
        if (assignment is null)
            return null;

        var shipments = await _shipments.GetAllAsync();
        var shipmentIds = shipments.Where(s => s.AssignmentId == assignment.Id).Select(s => s.Id).ToList();
        return (assignment, shipmentIds);
    }

    private async Task EnsureNotDoubleBookedAsync(Guid driverId, Guid vehicleId)
    {
        var assignments = await _assignments.GetAllAsync();
        var driverBooked = assignments.Any(a => a.DriverId == driverId && a.Status is AssignmentStatus.Active or AssignmentStatus.Pending);
        if (driverBooked)
            throw new InvalidOperationException($"Driver {driverId} already has an active assignment.");

        var vehicleBooked = assignments.Any(a => a.VehicleId == vehicleId && a.Status is AssignmentStatus.Active or AssignmentStatus.Pending);
        if (vehicleBooked)
            throw new InvalidOperationException($"Vehicle {vehicleId} already has an active assignment.");
    }

    private async Task ReleaseDriverAndVehicleAsync(Assignment assignment)
    {
        var driver = await _drivers.GetByIdAsync(assignment.DriverId);
        if (driver is not null)
        {
            driver.SetAvailability(true);
            _drivers.Update(driver);
        }

        var vehicle = await _vehicles.GetByIdAsync(assignment.VehicleId);
        if (vehicle is not null)
        {
            vehicle.SetStatus(VehicleStatus.Available);
            _vehicles.Update(vehicle);
        }
    }
}
