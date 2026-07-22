using SmartFM.Application.Coordinators;
using SmartFM.Domain.Entities;
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
            new UnitOfWork(_context));
    }

    private async Task<(Warehouse origin, Warehouse destination)> SeedWarehousesAsync()
    {
        var branch = new Branch("Hanoi Branch", "Hanoi");
        await _branches.AddAsync(branch);
        var origin = new Warehouse("Origin Warehouse", "1 Origin Street", branch.Id);
        var destination = new Warehouse("Destination Warehouse", "1 Destination Street", branch.Id);
        await _warehouses.AddAsync(origin);
        await _warehouses.AddAsync(destination);
        await _context.SaveChangesAsync();
        return (origin, destination);
    }

    private async Task<Shipment> SeedShipmentAsync()
    {
        var customer = new Customer("Nguyen Van Khach", "khach@example.com", "0900000000");
        await _customers.AddAsync(customer);
        var offering = new Offering("Light Delivery", "Small parcels", 150000m, 1000m, 3m, "Light");
        await _offerings.AddAsync(offering);
        var order = new Order(customer, offering);
        var shipment = new Shipment(order);
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
    public async Task FleetAssignmentCoordinatorAssignsDriverVehicleAndRouteToShipment()
    {
        var (origin, destination) = await SeedWarehousesAsync();
        var route = await _coordinator.CreateRouteAsync(origin.Id, destination.Id, 100m);
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var shipment = await SeedShipmentAsync();

        var assignment = await _coordinator.CreateAssignmentAsync(shipment.Id, driver.Id, vehicle.Id, route.Id);

        Assert.Equal(AssignmentStatus.Active, assignment.Status);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorRejectsDoubleBookingOfActiveDriver()
    {
        var (origin, destination) = await SeedWarehousesAsync();
        var route = await _coordinator.CreateRouteAsync(origin.Id, destination.Id, 100m);
        var driver = await SeedDriverAsync();
        var firstVehicle = await SeedVehicleAsync();
        var secondVehicle = await SeedVehicleAsync();
        var firstShipment = await SeedShipmentAsync();
        var secondShipment = await SeedShipmentAsync();

        await _coordinator.CreateAssignmentAsync(firstShipment.Id, driver.Id, firstVehicle.Id, route.Id);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _coordinator.CreateAssignmentAsync(secondShipment.Id, driver.Id, secondVehicle.Id, route.Id));
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorRejectsDoubleBookingOfActiveVehicle()
    {
        var (origin, destination) = await SeedWarehousesAsync();
        var route = await _coordinator.CreateRouteAsync(origin.Id, destination.Id, 100m);
        var firstDriver = await SeedDriverAsync();
        var secondDriver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var firstShipment = await SeedShipmentAsync();
        var secondShipment = await SeedShipmentAsync();

        await _coordinator.CreateAssignmentAsync(firstShipment.Id, firstDriver.Id, vehicle.Id, route.Id);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _coordinator.CreateAssignmentAsync(secondShipment.Id, secondDriver.Id, vehicle.Id, route.Id));
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorAllowsReassignmentAfterCompletion()
    {
        var (origin, destination) = await SeedWarehousesAsync();
        var route = await _coordinator.CreateRouteAsync(origin.Id, destination.Id, 100m);
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var firstShipment = await SeedShipmentAsync();
        var secondShipment = await SeedShipmentAsync();

        var firstAssignment = await _coordinator.CreateAssignmentAsync(firstShipment.Id, driver.Id, vehicle.Id, route.Id);
        await _coordinator.CompleteAssignmentAsync(firstAssignment.Id);

        var secondAssignment = await _coordinator.CreateAssignmentAsync(secondShipment.Id, driver.Id, vehicle.Id, route.Id);

        Assert.Equal(AssignmentStatus.Active, secondAssignment.Status);
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
