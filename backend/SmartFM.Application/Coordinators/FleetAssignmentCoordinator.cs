using SmartFM.Application.Abstractions;
using SmartFM.Domain.Entities;
using SmartFM.Domain.Records;
using SmartFM.Domain.ValueObjects;

namespace SmartFM.Application.Coordinators;

public record RouteData(string OriginAddress, string DestinationAddress, IReadOnlyList<string>? Waypoints, double? DistanceKm, int? EstimatedDurationMinutes);

public record AssignmentShipmentData(Shipment Shipment, string CustomerName, string CustomerPhone);

public class FleetAssignmentCoordinator
{
    private readonly IRepository<Route> _routes;
    private readonly IRepository<Assignment> _assignments;
    private readonly IRepository<Driver> _drivers;
    private readonly IRepository<Vehicle> _vehicles;
    private readonly IRepository<Shipment> _shipments;
    private readonly IRepository<Order> _orders;
    private readonly IRepository<Customer> _customers;
    private readonly IRepository<Warehouse> _warehouses;
    private readonly IRepository<MaintenanceRecord> _maintenanceRecords;
    private readonly IRepository<DeliveryConfirmation> _deliveryConfirmations;
    private readonly IRepository<LoadManifest> _loadManifests;
    private readonly IRepository<Cargo> _cargoes;
    private readonly OrderFulfilmentCoordinator _orderFulfilmentCoordinator;
    private readonly TrackingCoordinator _trackingCoordinator;
    private readonly IUnitOfWork _unitOfWork;

    public FleetAssignmentCoordinator(
        IRepository<Route> routes,
        IRepository<Assignment> assignments,
        IRepository<Driver> drivers,
        IRepository<Vehicle> vehicles,
        IRepository<Shipment> shipments,
        IRepository<Order> orders,
        IRepository<Customer> customers,
        IRepository<Warehouse> warehouses,
        IRepository<MaintenanceRecord> maintenanceRecords,
        IRepository<DeliveryConfirmation> deliveryConfirmations,
        IRepository<LoadManifest> loadManifests,
        IRepository<Cargo> cargoes,
        OrderFulfilmentCoordinator orderFulfilmentCoordinator,
        TrackingCoordinator trackingCoordinator,
        IUnitOfWork unitOfWork)
    {
        _routes = routes;
        _assignments = assignments;
        _drivers = drivers;
        _vehicles = vehicles;
        _shipments = shipments;
        _orders = orders;
        _customers = customers;
        _warehouses = warehouses;
        _maintenanceRecords = maintenanceRecords;
        _deliveryConfirmations = deliveryConfirmations;
        _loadManifests = loadManifests;
        _cargoes = cargoes;
        _orderFulfilmentCoordinator = orderFulfilmentCoordinator;
        _trackingCoordinator = trackingCoordinator;
        _unitOfWork = unitOfWork;
    }

    public Task InitializeFleetSubsystem()
    {
        Console.WriteLine("FleetAssignmentCoordinator initialized");
        return Task.CompletedTask;
    }

    public async Task<Route?> GetRouteByIdAsync(Guid id) => await _routes.GetByIdAsync(id);

    public async Task<Assignment> CreateAssignmentAsync(IReadOnlyList<Guid> shipmentIds, Guid driverId, Guid vehicleId, RouteData? routeData = null, Guid? warehouseId = null)
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

        Route? route = null;
        if (routeData is not null)
        {
            var waypointsJson = routeData.Waypoints is { Count: > 0 }
                ? System.Text.Json.JsonSerializer.Serialize(routeData.Waypoints)
                : null;
            route = new Route(routeData.OriginAddress, routeData.DestinationAddress, waypointsJson, routeData.DistanceKm, routeData.EstimatedDurationMinutes);
            await _routes.AddAsync(route);
        }

        Warehouse? warehouse = null;
        if (warehouseId is not null)
        {
            warehouse = await _warehouses.GetByIdAsync(warehouseId.Value)
                ?? throw new InvalidOperationException($"Warehouse {warehouseId} not found.");
            await EnsureWarehouseCapacityAsync(warehouse, shipments);
        }

        await EnsureNotDoubleBookedAsync(driverId, vehicleId);

        var assignment = new Assignment(shipments, driver, vehicle, route);
        await _assignments.AddAsync(assignment);

        foreach (var shipment in shipments)
        {
            shipment.AssignTo(assignment.Id);
            shipment.SetStatus(ShipmentStatus.Assigned);
            if (warehouse is not null)
                shipment.SetWarehouse(warehouse.Id);
            _shipments.Update(shipment);

            var shipmentOrder = await _orders.GetByIdAsync(shipment.OrderId);
            if (shipmentOrder is not null)
            {
                shipmentOrder.SetStatus(OrderStatus.Approved);
                _orders.Update(shipmentOrder);
            }
        }

        driver.SetAvailability(false);
        _drivers.Update(driver);

        vehicle.SetStatus(VehicleStatus.Assigned);
        _vehicles.Update(vehicle);

        await _unitOfWork.SaveChangesAsync();

        await _trackingCoordinator.RecordStatusChangeAsync(TrackingEntityType.Assignment, assignment.Id, null, AssignmentStatus.Pending, "FleetAssignmentCoordinator");
        await _trackingCoordinator.RecordStatusChangeAsync(TrackingEntityType.Driver, driver.Id, "Available", "Unavailable", "FleetAssignmentCoordinator");

        return assignment;
    }

    public async Task<Assignment> ApproveAssignmentAsync(Guid assignmentId)
    {
        var assignment = await _assignments.GetByIdAsync(assignmentId)
            ?? throw new InvalidOperationException($"Assignment {assignmentId} not found.");

        assignment.Approve();
        _assignments.Update(assignment);

        var shipments = (await _shipments.GetAllAsync()).Where(s => s.AssignmentId == assignment.Id).ToList();
        var activatedOrderIds = new List<Guid>();
        foreach (var shipment in shipments)
        {
            var order = await _orders.GetByIdAsync(shipment.OrderId);
            if (order is not null)
            {
                order.Activate();
                _orders.Update(order);
                activatedOrderIds.Add(order.Id);
            }
        }

        await _unitOfWork.SaveChangesAsync();

        await _trackingCoordinator.RecordStatusChangeAsync(TrackingEntityType.Assignment, assignment.Id, AssignmentStatus.Pending, AssignmentStatus.Assigned, "FleetAssignmentCoordinator");
        foreach (var orderId in activatedOrderIds)
            await _trackingCoordinator.RecordStatusChangeAsync(TrackingEntityType.Order, orderId, OrderStatus.Approved, OrderStatus.Active, "FleetAssignmentCoordinator");

        return assignment;
    }

    public async Task<Assignment> DeliverAssignmentAsync(Guid assignmentId)
    {
        var assignment = await _assignments.GetByIdAsync(assignmentId)
            ?? throw new InvalidOperationException($"Assignment {assignmentId} not found.");

        var prevStatusDeliver = assignment.Status;
        assignment.Deliver();
        _assignments.Update(assignment);

        var (driverIdDeliver, _) = await ReleaseDriverAndVehicleAsync(assignment);

        await _unitOfWork.SaveChangesAsync();

        await _trackingCoordinator.RecordStatusChangeAsync(TrackingEntityType.Assignment, assignment.Id, prevStatusDeliver, AssignmentStatus.Delivered, "FleetAssignmentCoordinator");
        if (driverIdDeliver != Guid.Empty)
            await _trackingCoordinator.RecordStatusChangeAsync(TrackingEntityType.Driver, driverIdDeliver, "Unavailable", "Available", "FleetAssignmentCoordinator");

        return assignment;
    }

    public async Task RequestReallocationAsync(Guid assignmentId)
    {
        var assignment = await _assignments.GetByIdAsync(assignmentId)
            ?? throw new InvalidOperationException($"Assignment {assignmentId} not found.");

        var prevStatusRealloc = assignment.Status;
        assignment.Reject();
        _assignments.Update(assignment);

        var shipmentsRealloc = (await _shipments.GetAllAsync()).Where(s => s.AssignmentId == assignment.Id).ToList();
        foreach (var shipment in shipmentsRealloc)
        {
            shipment.Unassign();
            shipment.SetStatus(ShipmentStatus.Created);
            _shipments.Update(shipment);
        }

        var (driverIdRealloc, _) = await ReleaseDriverAndVehicleAsync(assignment);

        await _unitOfWork.SaveChangesAsync();

        await _trackingCoordinator.RecordStatusChangeAsync(TrackingEntityType.Assignment, assignment.Id, prevStatusRealloc, AssignmentStatus.Rejected, "FleetAssignmentCoordinator");
        if (driverIdRealloc != Guid.Empty)
            await _trackingCoordinator.RecordStatusChangeAsync(TrackingEntityType.Driver, driverIdRealloc, "Unavailable", "Available", "FleetAssignmentCoordinator");

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
        Guid shipmentId, Guid driverId, string recipientName, string proofSignature, double? gpsLatitude, double? gpsLongitude)
    {
        var shipment = await _shipments.GetByIdAsync(shipmentId)
            ?? throw new InvalidOperationException($"Shipment {shipmentId} not found.");
        if (shipment.AssignmentId is null)
            throw new InvalidOperationException($"Shipment {shipmentId} has no assignment.");

        var assignment = await _assignments.GetByIdAsync(shipment.AssignmentId.Value)
            ?? throw new InvalidOperationException($"Assignment {shipment.AssignmentId} not found.");
        if (assignment.DriverId != driverId)
            throw new ArgumentException("Driver is not assigned to this shipment.", nameof(driverId));

        var manifests = await _loadManifests.GetAllAsync();
        var manifest = manifests.FirstOrDefault(m => m.ShipmentId == shipmentId);
        
        var damagedOrMissingItems = manifest?.DamagedOrMissingItems;

        var confirmation = new DeliveryConfirmation(
            shipmentId, driverId, recipientName, proofSignature, gpsLatitude, gpsLongitude, DateTime.UtcNow, damagedOrMissingItems);
        
        await _deliveryConfirmations.AddAsync(confirmation);

        shipment.SetStatus(ShipmentStatus.Delivered);
        _shipments.Update(shipment);

        var prevStatusConfirm = assignment.Status;
        assignment.Deliver();
        _assignments.Update(assignment);
        var (driverIdConfirm, _) = await ReleaseDriverAndVehicleAsync(assignment);

        await _unitOfWork.SaveChangesAsync();

        await _trackingCoordinator.RecordStatusChangeAsync(TrackingEntityType.Assignment, assignment.Id, prevStatusConfirm, AssignmentStatus.Delivered, "FleetAssignmentCoordinator");
        if (driverIdConfirm != Guid.Empty)
            await _trackingCoordinator.RecordStatusChangeAsync(TrackingEntityType.Driver, driverIdConfirm, "Unavailable", "Available", "FleetAssignmentCoordinator");

        await _orderFulfilmentCoordinator.MarkOrderFulfilledAsync(shipment.OrderId);

        return confirmation;
    }

    public async Task<LoadManifest> GetOrCreateLoadManifestAsync(Guid shipmentId)
    {
        var shipment = await _shipments.GetByIdAsync(shipmentId)
            ?? throw new InvalidOperationException($"Shipment {shipmentId} not found.");

        var manifests = await _loadManifests.GetAllAsync();
        var existing = manifests.FirstOrDefault(m => m.ShipmentId == shipmentId);
        if (existing is not null)
            return existing;

        var order = await _orders.GetByIdAsync(shipment.OrderId)
            ?? throw new InvalidOperationException($"Order {shipment.OrderId} not found.");

        var cargoes = await _cargoes.GetAllAsync();
        var shipmentCargoes = cargoes.Where(c => c.OrderId == shipment.OrderId).ToList();

        var manifest = new LoadManifest(
            shipmentId,
            shipmentCargoes.Select(c => c.Id).ToList(),
            shipmentCargoes.Select(c => c.Description).ToList(),
            shipmentCargoes.Sum(c => c.WeightKg),
            shipmentCargoes.Any(c => c.IsHazardous),
            DateTime.UtcNow,
            LoadedCargoIds: new List<Guid>(),
            IsPickupResolved: false);

        await _loadManifests.AddAsync(manifest);
        await _unitOfWork.SaveChangesAsync();

        return manifest;
    }

    public async Task<LoadManifest> UpdateLoadedCargoItemsAsync(Guid shipmentId, IReadOnlyList<Guid> loadedCargoIds)
    {
        var manifests = await _loadManifests.GetAllAsync();
        var manifest = manifests.FirstOrDefault(m => m.ShipmentId == shipmentId)
            ?? throw new InvalidOperationException($"LoadManifest for shipment {shipmentId} not found.");

        if (loadedCargoIds.Any(id => !manifest.CargoIds.Contains(id)))
            throw new ArgumentException("loadedCargoIds contains an id not present on this manifest.", nameof(loadedCargoIds));

        var updatedValues = manifest with { LoadedCargoIds = loadedCargoIds };
        _loadManifests.UpdateValues(manifest, updatedValues);
        await _unitOfWork.SaveChangesAsync();

        return manifest;
    }

    public async Task<LoadManifest> MarkLoadingCompleteAsync(Guid shipmentId)
    {
        var manifests = await _loadManifests.GetAllAsync();
        var manifest = manifests.FirstOrDefault(m => m.ShipmentId == shipmentId)
            ?? throw new InvalidOperationException($"LoadManifest for shipment {shipmentId} not found.");

        if (!manifest.CargoIds.All(id => manifest.LoadedCargoIds.Contains(id)))
            throw new InvalidOperationException("All cargo items must be checked as loaded before starting.");

        var updatedValues = manifest with { IsPickupResolved = true };
        _loadManifests.UpdateValues(manifest, updatedValues);

        var shipment = await _shipments.GetByIdAsync(shipmentId);
        Assignment? loadedAssignment = null;
        if (shipment?.AssignmentId is not null)
        {
            loadedAssignment = await _assignments.GetByIdAsync(shipment.AssignmentId.Value);
            if (loadedAssignment is not null)
            {
                loadedAssignment.MarkLoaded();
                _assignments.Update(loadedAssignment);
            }
        }

        await _unitOfWork.SaveChangesAsync();

        if (loadedAssignment is not null)
            await _trackingCoordinator.RecordStatusChangeAsync(TrackingEntityType.Assignment, loadedAssignment.Id, AssignmentStatus.Assigned, AssignmentStatus.Loaded, "FleetAssignmentCoordinator");

        return manifest;
    }

    public async Task<Shipment> MarkShipmentInTransitAsync(Guid shipmentId)
    {
        var shipment = await _shipments.GetByIdAsync(shipmentId)
            ?? throw new InvalidOperationException($"Shipment {shipmentId} not found.");

        var manifests = await _loadManifests.GetAllAsync();
        var manifest = manifests.FirstOrDefault(m => m.ShipmentId == shipmentId);
        if (manifest is null || !manifest.IsPickupResolved)
            throw new InvalidOperationException("Cannot start trip before loading is confirmed.");

        shipment.SetStatus(ShipmentStatus.InTransit);
        _shipments.Update(shipment);

        Assignment? deliveringAssignment = null;
        if (shipment.AssignmentId is not null)
        {
            deliveringAssignment = await _assignments.GetByIdAsync(shipment.AssignmentId.Value);
            if (deliveringAssignment is not null)
            {
                deliveringAssignment.MarkDelivering();
                _assignments.Update(deliveringAssignment);
            }
        }

        await _unitOfWork.SaveChangesAsync();

        if (deliveringAssignment is not null)
            await _trackingCoordinator.RecordStatusChangeAsync(TrackingEntityType.Assignment, deliveringAssignment.Id, AssignmentStatus.Loaded, AssignmentStatus.Delivering, "FleetAssignmentCoordinator");

        return shipment;
    }

    public async Task<LoadManifest> ResolveLoadManifestAtDropoffAsync(Guid shipmentId, IReadOnlyList<string>? damagedOrMissingItems)
    {
        var manifests = await _loadManifests.GetAllAsync();
        var manifest = manifests.FirstOrDefault(m => m.ShipmentId == shipmentId)
            ?? throw new InvalidOperationException($"LoadManifest for shipment {shipmentId} not found.");

        var updatedValues = manifest with
        {
            IsDropoffResolved = true,
            DamagedOrMissingItems = damagedOrMissingItems
        };

        _loadManifests.UpdateValues(manifest, updatedValues);
        await _unitOfWork.SaveChangesAsync();

        return manifest;
    }

    public async Task<DeliveryConfirmation?> GetDeliveryConfirmationByShipmentIdAsync(Guid shipmentId)
    {
        var confirmations = await _deliveryConfirmations.GetAllAsync();
        return confirmations.FirstOrDefault(c => c.ShipmentId == shipmentId);
    }

    public async Task<IEnumerable<(Assignment Assignment, IReadOnlyList<AssignmentShipmentData> Shipments, Route? Route)>> GetAssignmentsAsync(string? status = null, Guid? driverId = null)
    {
        var assignments = await _assignments.GetAllAsync();
        if (status is not null)
            assignments = assignments.Where(a => a.Status == status);
        if (driverId is not null)
            assignments = assignments.Where(a => a.DriverId == driverId);

        var shipments = await _shipments.GetAllAsync();
        var routes = await _routes.GetAllAsync();
        var orders = await _orders.GetAllAsync();
        var customers = await _customers.GetAllAsync();
        var orderMap = orders.ToDictionary(o => o.Id);
        var customerMap = customers.ToDictionary(c => c.Id);

        return assignments
            .Select(a => (
                a,
                BuildShipmentData(shipments.Where(s => s.AssignmentId == a.Id).ToList(), orderMap, customerMap),
                a.RouteId is null ? null : routes.FirstOrDefault(r => r.Id == a.RouteId.Value)))
            .ToList();
    }

    public async Task<Assignment?> GetAssignmentByIdAsync(Guid id) => await _assignments.GetByIdAsync(id);

    public async Task<(Assignment Assignment, IReadOnlyList<AssignmentShipmentData> Shipments, Route? Route)?> GetAssignmentDetailsAsync(Guid id)
    {
        var assignment = await _assignments.GetByIdAsync(id);
        if (assignment is null)
            return null;

        var shipments = (await _shipments.GetAllAsync()).Where(s => s.AssignmentId == assignment.Id).ToList();
        var orders = await _orders.GetAllAsync();
        var customers = await _customers.GetAllAsync();
        var orderMap = orders.ToDictionary(o => o.Id);
        var customerMap = customers.ToDictionary(c => c.Id);
        var route = assignment.RouteId is null ? null : await _routes.GetByIdAsync(assignment.RouteId.Value);
        return (assignment, BuildShipmentData(shipments, orderMap, customerMap), route);
    }

    private static IReadOnlyList<AssignmentShipmentData> BuildShipmentData(
        IReadOnlyList<Shipment> shipments, IReadOnlyDictionary<Guid, Order> orderMap, IReadOnlyDictionary<Guid, Customer> customerMap)
    {
        return shipments.Select(s =>
        {
            var customerName = string.Empty;
            var customerPhone = string.Empty;
            if (orderMap.TryGetValue(s.OrderId, out var order) && customerMap.TryGetValue(order.CustomerId, out var customer))
            {
                customerName = customer.Name;
                customerPhone = customer.Phone;
            }
            return new AssignmentShipmentData(s, customerName, customerPhone);
        }).ToList();
    }

    private async Task EnsureWarehouseCapacityAsync(Warehouse warehouse, IReadOnlyList<Shipment> shipments)
    {
        decimal totalWeightKg = 0;
        foreach (var shipment in shipments)
        {
            var order = await _orders.GetByIdAsync(shipment.OrderId)
                ?? throw new InvalidOperationException($"Order {shipment.OrderId} not found.");
            totalWeightKg += order.OrderWeightKg;
        }

        if (totalWeightKg > warehouse.CapacityKg)
            throw new InvalidOperationException(
                $"Shipment weight {totalWeightKg}kg exceeds warehouse '{warehouse.Name}' capacity of {warehouse.CapacityKg}kg.");
    }

    private async Task EnsureNotDoubleBookedAsync(Guid driverId, Guid vehicleId)
    {
        var assignments = await _assignments.GetAllAsync();
        var driverBooked = assignments.Any(a => a.DriverId == driverId && a.Status is not (AssignmentStatus.Delivered or AssignmentStatus.Rejected));
        if (driverBooked)
            throw new InvalidOperationException($"Driver {driverId} already has an active assignment.");

        var vehicleBooked = assignments.Any(a => a.VehicleId == vehicleId && a.Status is not (AssignmentStatus.Delivered or AssignmentStatus.Rejected));
        if (vehicleBooked)
            throw new InvalidOperationException($"Vehicle {vehicleId} already has an active assignment.");
    }

    private async Task<(Guid DriverId, Guid VehicleId)> ReleaseDriverAndVehicleAsync(Assignment assignment)
    {
        var releasedDriverId = Guid.Empty;
        var driver = await _drivers.GetByIdAsync(assignment.DriverId);
        if (driver is not null)
        {
            driver.SetAvailability(true);
            _drivers.Update(driver);
            releasedDriverId = driver.Id;
        }

        var vehicle = await _vehicles.GetByIdAsync(assignment.VehicleId);
        if (vehicle is not null)
        {
            vehicle.SetStatus(VehicleStatus.Available);
            _vehicles.Update(vehicle);
        }

        return (releasedDriverId, assignment.VehicleId);
    }
}
