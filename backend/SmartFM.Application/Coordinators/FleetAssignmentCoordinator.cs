using SmartFM.Application.Abstractions;
using SmartFM.Domain.Entities;
using SmartFM.Domain.Records;

namespace SmartFM.Application.Coordinators;

public class FleetAssignmentCoordinator
{
    private readonly IRepository<Route> _routes;
    private readonly IRepository<Assignment> _assignments;
    private readonly IRepository<Driver> _drivers;
    private readonly IRepository<Vehicle> _vehicles;
    private readonly IRepository<Shipment> _shipments;
    private readonly IRepository<MaintenanceRecord> _maintenanceRecords;
    private readonly IUnitOfWork _unitOfWork;

    public FleetAssignmentCoordinator(
        IRepository<Route> routes,
        IRepository<Assignment> assignments,
        IRepository<Driver> drivers,
        IRepository<Vehicle> vehicles,
        IRepository<Shipment> shipments,
        IRepository<MaintenanceRecord> maintenanceRecords,
        IUnitOfWork unitOfWork)
    {
        _routes = routes;
        _assignments = assignments;
        _drivers = drivers;
        _vehicles = vehicles;
        _shipments = shipments;
        _maintenanceRecords = maintenanceRecords;
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

    public async Task<Assignment> CreateAssignmentAsync(Guid shipmentId, Guid driverId, Guid vehicleId, Guid routeId)
    {
        var shipment = await _shipments.GetByIdAsync(shipmentId)
            ?? throw new InvalidOperationException($"Shipment {shipmentId} not found.");
        var driver = await _drivers.GetByIdAsync(driverId)
            ?? throw new InvalidOperationException($"Driver {driverId} not found.");
        var vehicle = await _vehicles.GetByIdAsync(vehicleId)
            ?? throw new InvalidOperationException($"Vehicle {vehicleId} not found.");
        var route = await _routes.GetByIdAsync(routeId)
            ?? throw new InvalidOperationException($"Route {routeId} not found.");

        await EnsureNotDoubleBookedAsync(driverId, vehicleId);

        var assignment = new Assignment(shipment, driver, vehicle, route);
        await _assignments.AddAsync(assignment);

        driver.SetAvailability(false);
        _drivers.Update(driver);

        vehicle.SetStatus(VehicleStatus.Assigned);
        _vehicles.Update(vehicle);

        shipment.SetStatus(ShipmentStatus.Assigned);
        _shipments.Update(shipment);

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

    public async Task<IEnumerable<Assignment>> GetAssignmentsAsync(string? status = null)
    {
        var assignments = await _assignments.GetAllAsync();
        return status is null ? assignments : assignments.Where(a => a.Status == status);
    }

    public async Task<Assignment?> GetAssignmentByIdAsync(Guid id) => await _assignments.GetByIdAsync(id);

    private async Task EnsureNotDoubleBookedAsync(Guid driverId, Guid vehicleId)
    {
        var assignments = await _assignments.GetAllAsync();
        var driverBooked = assignments.Any(a => a.DriverId == driverId && a.Status == AssignmentStatus.Active);
        if (driverBooked)
            throw new InvalidOperationException($"Driver {driverId} already has an active assignment.");

        var vehicleBooked = assignments.Any(a => a.VehicleId == vehicleId && a.Status == AssignmentStatus.Active);
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
