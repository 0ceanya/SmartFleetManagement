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
    private readonly IncidentCoordinator _coordinator;
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

        var unitOfWork = new UnitOfWork(_context);
        _fleetAssignmentCoordinator = new FleetAssignmentCoordinator(
            new Repository<Route>(_context),
            new Repository<Assignment>(_context),
            _drivers,
            _vehicles,
            _shipments,
            new Repository<MaintenanceRecord>(_context),
            new Repository<DeliveryConfirmation>(_context),
            unitOfWork);

        _coordinator = new IncidentCoordinator(
            new Repository<IncidentRecord>(_context),
            new Repository<LoadManifest>(_context),
            new Repository<Assignment>(_context),
            _shipments,
            _fleetAssignmentCoordinator,
            unitOfWork);
    }

    private async Task<(Driver driver, Vehicle vehicle, Assignment assignment)> SeedActiveAssignmentAsync()
    {
        var branch = new Branch("Hanoi Branch", "Hanoi");
        await _branches.AddAsync(branch);
        var origin = new Warehouse("Origin Warehouse", "1 Origin Street", branch.Id, 5000m);
        var destination = new Warehouse("Destination Warehouse", "1 Destination Street", branch.Id, 5000m);
        await _warehouses.AddAsync(origin);
        await _warehouses.AddAsync(destination);

        var driver = new Driver("Nguyen Van Tai Xe", "driver@example.com", branch.Id, "D-0001");
        await _drivers.AddAsync(driver);
        var vehicle = new LightVehicle("29A-00001", branch.Id);
        await _vehicles.AddAsync(vehicle);

        var customer = new Customer("Nguyen Van Khach", "khach@example.com", "0900000000");
        await _customers.AddAsync(customer);
        var offering = new Offering("Light Delivery", "Small parcels", 150000m, 1000m, 3m, "Light");
        await _offerings.AddAsync(offering);
        var order = new Order(customer, offering);
        var shipment = new Shipment(order, origin.Id);
        order.AttachShipment(shipment);
        await _orders.AddAsync(order);
        await _shipments.AddAsync(shipment);

        var cargo = new Cargo(shipment.Id, "Boxed goods", 10m, 1m, false);
        shipment.AddCargo(cargo);
        await _cargoes.AddAsync(cargo);
        await _context.SaveChangesAsync();

        var route = await _fleetAssignmentCoordinator.CreateRouteAsync(origin.Id, destination.Id, 100m);
        var assignment = await _fleetAssignmentCoordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id, route.Id);
        assignment = await _fleetAssignmentCoordinator.ApproveAssignmentAsync(assignment.Id);

        return (driver, vehicle, assignment);
    }

    [Fact]
    public async Task IncidentCoordinatorCreatesIncidentRecordAndLoadManifestForActiveAssignment()
    {
        var (_, vehicle, _) = await SeedActiveAssignmentAsync();

        var incident = await _coordinator.ReportIncidentAsync(vehicle.Id, "Vehicle breakdown", "High");

        Assert.Equal(vehicle.Id, incident.VehicleId);
        var manifests = _context.Set<LoadManifest>().ToList();
        Assert.Single(manifests);
        Assert.Contains("Boxed goods", manifests[0].CargoDescriptions);
    }

    [Fact]
    public async Task IncidentCoordinatorRequestsReallocationFreeingDriverAndVehicle()
    {
        var (driver, vehicle, assignment) = await SeedActiveAssignmentAsync();

        await _coordinator.ReportIncidentAsync(vehicle.Id, "Vehicle breakdown", "High");

        var completedAssignment = await _fleetAssignmentCoordinator.GetAssignmentByIdAsync(assignment.Id);
        Assert.Equal(AssignmentStatus.Completed, completedAssignment!.Status);

        var freedDriver = await _drivers.GetByIdAsync(driver.Id);
        Assert.True(freedDriver!.IsAvailable);
    }

    [Fact]
    public async Task IncidentCoordinatorCreatesIncidentRecordWhenTelemetryFlagsAnomaly()
    {
        var (_, vehicle, _) = await SeedActiveAssignmentAsync();
        var data = new TelemetryData(vehicle.Id, 21.0, 105.8, DateTime.UtcNow, IsAnomaly: true);

        _coordinator.OnTelemetryReceived(vehicle, data);

        var incidents = _context.Set<IncidentRecord>().ToList();
        Assert.Single(incidents);
        var manifests = _context.Set<LoadManifest>().ToList();
        Assert.Single(manifests);
    }

    [Fact]
    public async Task IncidentCoordinatorIgnoresTelemetryWithoutAnomalyFlag()
    {
        var (_, vehicle, _) = await SeedActiveAssignmentAsync();
        var data = new TelemetryData(vehicle.Id, 21.0, 105.8, DateTime.UtcNow, IsAnomaly: false);

        _coordinator.OnTelemetryReceived(vehicle, data);

        Assert.Empty(_context.Set<IncidentRecord>().ToList());
        Assert.Empty(_context.Set<LoadManifest>().ToList());
    }

    public void Dispose()
    {
        _context.Dispose();
        _factory.Dispose();
    }
}
