using SmartFM.Application.Coordinators;
using SmartFM.Domain.Entities;
using SmartFM.Domain.ValueObjects;
using SmartFM.Infrastructure.Persistence;
using SmartFM.Infrastructure.Persistence.Repositories;
using SmartFM.Tests.TestSupport;
using Xunit;

namespace SmartFM.Tests.Coordinators;

public class FleetAssignmentCoordinatorTests : IDisposable
{
    private readonly InMemoryDbContextFactory _factory = new();
    private readonly SmartFMDbContext _context;
    private readonly FleetAssignmentCoordinator _coordinator;
    private readonly Repository<Branch> _branches;
    private readonly Repository<Warehouse> _warehouses;
    private readonly Repository<Driver> _drivers;
    private readonly Repository<Vehicle> _vehicles;
    private readonly Repository<Customer> _customers;
    private readonly Repository<Offering> _offerings;
    private readonly Repository<Order> _orders;
    private readonly Repository<Shipment> _shipments;

    public FleetAssignmentCoordinatorTests()
    {
        _context = _factory.CreateContext();
        _branches = new Repository<Branch>(_context);
        _warehouses = new Repository<Warehouse>(_context);
        _drivers = new Repository<Driver>(_context);
        _vehicles = new Repository<Vehicle>(_context);
        _customers = new Repository<Customer>(_context);
        _offerings = new Repository<Offering>(_context);
        _orders = new Repository<Order>(_context);
        _shipments = new Repository<Shipment>(_context);

        _coordinator = new FleetAssignmentCoordinator(
            new Repository<Route>(_context),
            new Repository<Assignment>(_context),
            _drivers,
            _vehicles,
            _shipments,
            new Repository<Domain.Records.MaintenanceRecord>(_context),
            new Repository<DeliveryConfirmation>(_context),
            new UnitOfWork(_context));
    }

    private async Task<(Warehouse origin, Warehouse destination)> SeedWarehousesAsync()
    {
        var branch = new Branch("Hanoi Branch", "Hanoi");
        await _branches.AddAsync(branch);
        var origin = new Warehouse("Origin Warehouse", "1 Origin Street", branch.Id, 5000m);
        var destination = new Warehouse("Destination Warehouse", "1 Destination Street", branch.Id, 5000m);
        await _warehouses.AddAsync(origin);
        await _warehouses.AddAsync(destination);
        await _context.SaveChangesAsync();
        return (origin, destination);
    }

    private async Task<Shipment> SeedShipmentAsync(Guid warehouseId)
    {
        var customer = new Customer("Nguyen Van Khach", "khach@example.com", "0900000000");
        await _customers.AddAsync(customer);
        var offering = new Offering("Light Delivery", "Small parcels", 150000m, 1000m, 3m, "Light");
        await _offerings.AddAsync(offering);
        var order = new Order(customer, offering);
        var shipment = new Shipment(order, warehouseId);
        order.AttachShipment(shipment);
        await _orders.AddAsync(order);
        await _shipments.AddAsync(shipment);
        await _context.SaveChangesAsync();
        return shipment;
    }

    private async Task<Driver> SeedDriverAsync()
    {
        var branch = new Branch("Driver Branch", "Hanoi");
        await _branches.AddAsync(branch);
        var driver = new Driver("Nguyen Van Tai Xe", "driver@example.com", branch.Id, "D-0001");
        await _drivers.AddAsync(driver);
        await _context.SaveChangesAsync();
        return driver;
    }

    private async Task<Vehicle> SeedVehicleAsync()
    {
        var branch = new Branch("Vehicle Branch", "Hanoi");
        await _branches.AddAsync(branch);
        var vehicle = new LightVehicle("29A-00001", branch.Id);
        await _vehicles.AddAsync(vehicle);
        await _context.SaveChangesAsync();
        return vehicle;
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorCreatesRouteWithComputedDuration()
    {
        var (origin, destination) = await SeedWarehousesAsync();

        var route = await _coordinator.CreateRouteAsync(origin.Id, destination.Id, 100m);

        Assert.Equal(2m, route.EstimatedDurationHours);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorRejectsRouteWithSameOriginAndDestination()
    {
        var (origin, _) = await SeedWarehousesAsync();

        await Assert.ThrowsAsync<ArgumentException>(
            () => _coordinator.CreateRouteAsync(origin.Id, origin.Id, 50m));
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorCreatesPendingAssignmentBindingDriverVehicleAndShipments()
    {
        var (origin, destination) = await SeedWarehousesAsync();
        var route = await _coordinator.CreateRouteAsync(origin.Id, destination.Id, 100m);
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var firstShipment = await SeedShipmentAsync(origin.Id);
        var secondShipment = await SeedShipmentAsync(origin.Id);

        var assignment = await _coordinator.CreateAssignmentAsync(
            new[] { firstShipment.Id, secondShipment.Id }, driver.Id, vehicle.Id, route.Id);

        Assert.Equal(AssignmentStatus.Pending, assignment.Status);
        var details = await _coordinator.GetAssignmentDetailsAsync(assignment.Id);
        Assert.NotNull(details);
        Assert.Equal(2, details!.Value.ShipmentIds.Count);
        Assert.Contains(firstShipment.Id, details.Value.ShipmentIds);
        Assert.Contains(secondShipment.Id, details.Value.ShipmentIds);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorApprovesPendingAssignment()
    {
        var (origin, destination) = await SeedWarehousesAsync();
        var route = await _coordinator.CreateRouteAsync(origin.Id, destination.Id, 100m);
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var shipment = await SeedShipmentAsync(origin.Id);

        var assignment = await _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id, route.Id);
        var approved = await _coordinator.ApproveAssignmentAsync(assignment.Id);

        Assert.Equal(AssignmentStatus.Active, approved.Status);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorRejectsApprovingAlreadyActiveAssignment()
    {
        var (origin, destination) = await SeedWarehousesAsync();
        var route = await _coordinator.CreateRouteAsync(origin.Id, destination.Id, 100m);
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var shipment = await SeedShipmentAsync(origin.Id);

        var assignment = await _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id, route.Id);
        await _coordinator.ApproveAssignmentAsync(assignment.Id);

        await Assert.ThrowsAsync<InvalidOperationException>(() => _coordinator.ApproveAssignmentAsync(assignment.Id));
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorRejectsDoubleBookingOfPendingDriver()
    {
        var (origin, destination) = await SeedWarehousesAsync();
        var route = await _coordinator.CreateRouteAsync(origin.Id, destination.Id, 100m);
        var driver = await SeedDriverAsync();
        var firstVehicle = await SeedVehicleAsync();
        var secondVehicle = await SeedVehicleAsync();
        var firstShipment = await SeedShipmentAsync(origin.Id);
        var secondShipment = await SeedShipmentAsync(origin.Id);

        await _coordinator.CreateAssignmentAsync(new[] { firstShipment.Id }, driver.Id, firstVehicle.Id, route.Id);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _coordinator.CreateAssignmentAsync(new[] { secondShipment.Id }, driver.Id, secondVehicle.Id, route.Id));
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorRejectsDoubleBookingOfPendingVehicle()
    {
        var (origin, destination) = await SeedWarehousesAsync();
        var route = await _coordinator.CreateRouteAsync(origin.Id, destination.Id, 100m);
        var firstDriver = await SeedDriverAsync();
        var secondDriver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var firstShipment = await SeedShipmentAsync(origin.Id);
        var secondShipment = await SeedShipmentAsync(origin.Id);

        await _coordinator.CreateAssignmentAsync(new[] { firstShipment.Id }, firstDriver.Id, vehicle.Id, route.Id);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _coordinator.CreateAssignmentAsync(new[] { secondShipment.Id }, secondDriver.Id, vehicle.Id, route.Id));
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorRejectsShipmentAlreadyAssignedToAnotherAssignment()
    {
        var (origin, destination) = await SeedWarehousesAsync();
        var route = await _coordinator.CreateRouteAsync(origin.Id, destination.Id, 100m);
        var firstDriver = await SeedDriverAsync();
        var secondDriver = await SeedDriverAsync();
        var firstVehicle = await SeedVehicleAsync();
        var secondVehicle = await SeedVehicleAsync();
        var shipment = await SeedShipmentAsync(origin.Id);

        await _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, firstDriver.Id, firstVehicle.Id, route.Id);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, secondDriver.Id, secondVehicle.Id, route.Id));
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorAllowsReassignmentAfterCompletion()
    {
        var (origin, destination) = await SeedWarehousesAsync();
        var route = await _coordinator.CreateRouteAsync(origin.Id, destination.Id, 100m);
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var firstShipment = await SeedShipmentAsync(origin.Id);
        var secondShipment = await SeedShipmentAsync(origin.Id);

        var firstAssignment = await _coordinator.CreateAssignmentAsync(new[] { firstShipment.Id }, driver.Id, vehicle.Id, route.Id);
        await _coordinator.CompleteAssignmentAsync(firstAssignment.Id);

        var secondAssignment = await _coordinator.CreateAssignmentAsync(new[] { secondShipment.Id }, driver.Id, vehicle.Id, route.Id);

        Assert.Equal(AssignmentStatus.Pending, secondAssignment.Status);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorFiltersAssignmentsByDriver()
    {
        var (origin, destination) = await SeedWarehousesAsync();
        var route = await _coordinator.CreateRouteAsync(origin.Id, destination.Id, 100m);
        var firstDriver = await SeedDriverAsync();
        var secondDriver = await SeedDriverAsync();
        var firstVehicle = await SeedVehicleAsync();
        var secondVehicle = await SeedVehicleAsync();
        var firstShipment = await SeedShipmentAsync(origin.Id);
        var secondShipment = await SeedShipmentAsync(origin.Id);

        var assignment = await _coordinator.CreateAssignmentAsync(new[] { firstShipment.Id }, firstDriver.Id, firstVehicle.Id, route.Id);
        await _coordinator.CreateAssignmentAsync(new[] { secondShipment.Id }, secondDriver.Id, secondVehicle.Id, route.Id);

        var results = (await _coordinator.GetAssignmentsAsync(status: null, driverId: firstDriver.Id)).ToList();

        Assert.Single(results);
        Assert.Equal(assignment.Id, results[0].Assignment.Id);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorCreatesDeliveryConfirmationForAssignedDriver()
    {
        var (origin, destination) = await SeedWarehousesAsync();
        var route = await _coordinator.CreateRouteAsync(origin.Id, destination.Id, 100m);
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var shipment = await SeedShipmentAsync(origin.Id);
        await _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id, route.Id);

        var confirmation = await _coordinator.CreateDeliveryConfirmationAsync(
            shipment.Id, driver.Id, "Recipient", "signature-data", 21.0, 105.8);

        Assert.Equal(shipment.Id, confirmation.ShipmentId);
        Assert.Equal(driver.Id, confirmation.DriverId);
        var updatedShipment = await _shipments.GetByIdAsync(shipment.Id);
        Assert.Equal(ShipmentStatus.Delivered, updatedShipment!.Status);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorRejectsDeliveryConfirmationFromUnassignedDriver()
    {
        var (origin, destination) = await SeedWarehousesAsync();
        var route = await _coordinator.CreateRouteAsync(origin.Id, destination.Id, 100m);
        var driver = await SeedDriverAsync();
        var otherDriver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var shipment = await SeedShipmentAsync(origin.Id);
        await _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id, route.Id);

        await Assert.ThrowsAsync<ArgumentException>(() => _coordinator.CreateDeliveryConfirmationAsync(
            shipment.Id, otherDriver.Id, "Recipient", "signature-data", 21.0, 105.8));
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorCreatesMaintenanceRecordForVehicle()
    {
        var vehicle = await SeedVehicleAsync();

        var record = await _coordinator.CreateMaintenanceRecordAsync(vehicle.Id, "Oil change", DateTime.UtcNow.AddDays(7));

        Assert.Equal(vehicle.Id, record.VehicleId);
    }

    public void Dispose()
    {
        _context.Dispose();
        _factory.Dispose();
    }
}
