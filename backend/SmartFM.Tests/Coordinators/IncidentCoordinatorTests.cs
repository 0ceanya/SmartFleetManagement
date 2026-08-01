using SmartFM.Application.Coordinators;
using SmartFM.Domain.Entities;
using SmartFM.Domain.Records;
using SmartFM.Domain.ValueObjects;
using SmartFM.Infrastructure.Persistence;
using SmartFM.Infrastructure.Persistence.Repositories;
using SmartFM.Tests.TestSupport;
using Xunit;

namespace SmartFM.Tests.Coordinators;

public class IncidentCoordinatorTests : IDisposable
{
    private readonly InMemoryDbContextFactory _factory = new();
    private readonly SmartFMDbContext _context;
    private readonly IncidentCoordinator _incidentCoordinator;
    private readonly FleetAssignmentCoordinator _fleetAssignmentCoordinator;
    private readonly Repository<Branch> _branches;
    private readonly Repository<Warehouse> _warehouses;
    private readonly Repository<Driver> _drivers;
    private readonly Repository<Vehicle> _vehicles;
    private readonly Repository<Customer> _customers;
    private readonly Repository<Offering> _offerings;
    private readonly Repository<Order> _orders;
    private readonly Repository<Shipment> _shipments;
    private readonly Repository<Cargo> _cargoes;
    private readonly Repository<LoadManifest> _loadManifests;
    private readonly Repository<Assignment> _assignments;

    public IncidentCoordinatorTests()
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
        _cargoes = new Repository<Cargo>(_context);
        _loadManifests = new Repository<LoadManifest>(_context);
        _assignments = new Repository<Assignment>(_context);

        var unitOfWork = new UnitOfWork(_context);

        var orderFulfilmentCoordinator = new OrderFulfilmentCoordinator(
            _customers,
            _orders,
            _shipments,
            _cargoes,
            _offerings,
            _assignments,
            unitOfWork);

        _fleetAssignmentCoordinator = new FleetAssignmentCoordinator(
            new Repository<Route>(_context),
            _assignments,
            _drivers,
            _vehicles,
            _shipments,
            _orders,
            _warehouses,
            new Repository<MaintenanceRecord>(_context),
            new Repository<DeliveryConfirmation>(_context),
            _loadManifests,
            _cargoes,
            orderFulfilmentCoordinator,
            unitOfWork);

        _incidentCoordinator = new IncidentCoordinator(
            new Repository<IncidentRecord>(_context),
            _loadManifests,
            new Repository<Assignment>(_context),
            _shipments,
            _cargoes,
            _fleetAssignmentCoordinator,
            unitOfWork);
    }

    private async Task<(Driver Driver, Vehicle Vehicle, Assignment Assignment)> SeedActiveAssignmentAsync()
    {
        var branch = new Branch("Hanoi Branch", "Hanoi");
        await _branches.AddAsync(branch);

        var driver = new Driver("Nguyen Van A", "driver.a@example.com", branch.Id, "D-001");
        await _drivers.AddAsync(driver);

        var vehicle = new LightVehicle("29A-00001", branch.Id);
        await _vehicles.AddAsync(vehicle);

        var customer = new Customer("Nguyen Van Khach", "khach@example.com", "0900000000");
        await _customers.AddAsync(customer);
        var offering = new Offering("Light Delivery", "Small parcels", 150000m, 1000m, 3m, "Light");
        await _offerings.AddAsync(offering);
        var order = new Order(customer, offering);
        var shipment = new Shipment(order, "Customer warehouse, Binh Duong", "Supermarket store, Q1 HCMC");
        order.AttachShipment(shipment);
        await _orders.AddAsync(order);
        await _shipments.AddAsync(shipment);

        var cargo = new Cargo(order.Id, "Boxed goods", 10m, 1m, false);
        order.AddCargo(cargo);
        await _cargoes.AddAsync(cargo);
        await _context.SaveChangesAsync();

        var assignment = await _fleetAssignmentCoordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id);
        assignment = await _fleetAssignmentCoordinator.ApproveAssignmentAsync(assignment.Id);

        return (driver, vehicle, assignment);
    }

    [Fact]
    public async Task ReportIncidentUpdatesVehicleStatusAndGeneratesReport()
    {
        var (driver, vehicle, assignment) = await SeedActiveAssignmentAsync();

        var incident = await _incidentCoordinator.ReportIncidentAsync(vehicle.Id, "Engine overheating", "High");

        Assert.NotNull(incident);
        Assert.Equal(vehicle.Id, incident.VehicleId);
        Assert.Equal("Engine overheating", incident.Description);

        var updatedAssignment = await (new Repository<Assignment>(_context)).GetByIdAsync(assignment.Id);
        Assert.NotNull(updatedAssignment);

        var manifests = (await _loadManifests.GetAllAsync()).ToList();
        Assert.Single(manifests);
        Assert.Contains("Boxed goods", manifests[0].CargoDescriptions);
    }

    public void Dispose()
    {
        _context.Dispose();
        _factory.Dispose();
    }
}
