using SmartFM.Application.Coordinators;
using SmartFM.Domain.Entities;
using SmartFM.Domain.Records;
using SmartFM.Domain.ValueObjects;
using SmartFM.Infrastructure.Persistence;
using SmartFM.Infrastructure.Persistence.Repositories;
using SmartFM.Tests.TestSupport;
using Xunit;

namespace SmartFM.Tests.Coordinators;

public class RecordCoordinatorTests : IDisposable
{
    private readonly InMemoryDbContextFactory _factory = new();
    private readonly SmartFMDbContext _context;
    private readonly Repository<AuditRecord> _auditRecords;
    private readonly Repository<Branch> _branches;
    private readonly Repository<Warehouse> _warehouses;
    private readonly Repository<Driver> _drivers;
    private readonly Repository<Vehicle> _vehicles;
    private readonly Repository<Customer> _customers;
    private readonly Repository<Offering> _offerings;
    private readonly Repository<Order> _orders;
    private readonly Repository<Shipment> _shipments;
    private readonly Repository<Cargo> _cargoes;
    private readonly Repository<Assignment> _assignments;
    private readonly Repository<LoadManifest> _loadManifests;

    public RecordCoordinatorTests()
    {
        _context = _factory.CreateContext();
        _auditRecords = new Repository<AuditRecord>(_context);
        _branches = new Repository<Branch>(_context);
        _warehouses = new Repository<Warehouse>(_context);
        _drivers = new Repository<Driver>(_context);
        _vehicles = new Repository<Vehicle>(_context);
        _customers = new Repository<Customer>(_context);
        _offerings = new Repository<Offering>(_context);
        _orders = new Repository<Order>(_context);
        _shipments = new Repository<Shipment>(_context);
        _cargoes = new Repository<Cargo>(_context);
        _assignments = new Repository<Assignment>(_context);
        _loadManifests = new Repository<LoadManifest>(_context);
    }

    /// Creates a RecordCoordinator and a FleetAssignmentCoordinator that reference each other
    /// via the Func<> lazy factory, mirroring how Program.cs wires them in production.
    private (RecordCoordinator Record, FleetAssignmentCoordinator Fleet) CreateCoordinators()
    {
        var unitOfWork = new UnitOfWork(_context);
        FleetAssignmentCoordinator? fleet = null;

        var record = new RecordCoordinator(
            _auditRecords,
            new Repository<Notification>(_context),
            new Repository<IncidentRecord>(_context),
            _assignments,
            _shipments,
            () => fleet!,
            unitOfWork);

        var orderFulfilment = new OrderFulfilmentCoordinator(
            _customers, _orders, _shipments, _cargoes, _offerings, _assignments,
            new Repository<Invoice>(_context), record, unitOfWork);

        fleet = new FleetAssignmentCoordinator(
            new Repository<Route>(_context),
            _assignments, _drivers, _vehicles, _shipments, _orders, _customers, _warehouses,
            new Repository<DeliveryConfirmation>(_context),
            _loadManifests, _cargoes,
            orderFulfilment, record, unitOfWork);

        return (record, fleet);
    }

    // ── Audit tests ──────────────────────────────────────────────────────────

    [Fact]
    public async Task RecordStatusChangeAsync_CreatesAuditRecord()
    {
        var (record, _) = CreateCoordinators();
        var entityId = Guid.NewGuid();

        await record.RecordStatusChangeAsync(AuditEntityType.Assignment, entityId, null, "Pending", "FleetAssignmentCoordinator");

        var records = _context.Set<AuditRecord>().ToList();
        Assert.Single(records);
        Assert.Equal(AuditEntityType.Assignment, records[0].EntityType);
        Assert.Equal(entityId, records[0].EntityId);
        Assert.Null(records[0].FromStatus);
        Assert.Equal("Pending", records[0].ToStatus);
        Assert.Equal("FleetAssignmentCoordinator", records[0].ChangedBy);
    }

    [Fact]
    public async Task GetAuditRecordsByEntityAsync_FiltersCorrectly()
    {
        var (record, _) = CreateCoordinators();
        var assignmentId = Guid.NewGuid();
        var otherId = Guid.NewGuid();

        await record.RecordStatusChangeAsync(AuditEntityType.Assignment, assignmentId, null, "Pending");
        await record.RecordStatusChangeAsync(AuditEntityType.Assignment, assignmentId, "Pending", "Assigned");
        await record.RecordStatusChangeAsync(AuditEntityType.Order, otherId, null, "Active");

        var results = (await record.GetAuditRecordsByEntityAsync(AuditEntityType.Assignment, assignmentId)).ToList();

        Assert.Equal(2, results.Count);
        Assert.All(results, r => Assert.Equal(AuditEntityType.Assignment, r.EntityType));
        Assert.All(results, r => Assert.Equal(assignmentId, r.EntityId));
    }

    [Fact]
    public async Task RecordStatusChangeAsync_SetsCreatedAtTimestamp()
    {
        var (record, _) = CreateCoordinators();
        var before = DateTime.UtcNow;
        await record.RecordStatusChangeAsync(AuditEntityType.Invoice, Guid.NewGuid(), "Unpaid", "Paid");
        var after = DateTime.UtcNow;

        var auditRecord = _context.Set<AuditRecord>().Single();
        Assert.InRange(auditRecord.CreatedAt, before, after);
    }

    // ── Incident tests ───────────────────────────────────────────────────────

    private async Task<(Driver Driver, Vehicle Vehicle, Assignment Assignment)> SeedActiveAssignmentAsync(FleetAssignmentCoordinator fleet)
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

        var assignment = await fleet.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id);
        assignment = await fleet.ApproveAssignmentAsync(assignment.Id);
        return (driver, vehicle, assignment);
    }

    [Fact]
    public async Task ReportIncidentUpdatesVehicleStatusAndGeneratesReport()
    {
        var (record, fleet) = CreateCoordinators();
        var (driver, vehicle, assignment) = await SeedActiveAssignmentAsync(fleet);

        var incident = await record.ReportIncidentAsync(vehicle.Id, "Engine overheating", "High", "VehicleBreakdown");

        Assert.NotNull(incident);
        Assert.Equal(vehicle.Id, incident.VehicleId);
        Assert.Equal("Engine overheating", incident.Description);

        var manifests = (await _loadManifests.GetAllAsync()).ToList();
        Assert.Single(manifests);
        Assert.Contains("Boxed goods", manifests[0].CargoDescriptions);
    }

    [Fact]
    public async Task ReportIncidentDoesNotDuplicateLoadManifestAlreadyCreatedForShipment()
    {
        var (record, fleet) = CreateCoordinators();
        var (_, vehicle, assignment) = await SeedActiveAssignmentAsync(fleet);
        var shipmentId = (await _shipments.GetAllAsync()).Single(s => s.AssignmentId == assignment.Id).Id;
        await fleet.GetOrCreateLoadManifestAsync(shipmentId);

        await record.ReportIncidentAsync(vehicle.Id, "Engine overheating", "High", "VehicleBreakdown");

        var manifests = (await _loadManifests.GetAllAsync()).Where(m => m.ShipmentId == shipmentId).ToList();
        Assert.Single(manifests);
    }

    [Fact]
    public async Task ReportIncidentReallocatesInProgressAssignment()
    {
        var (record, fleet) = CreateCoordinators();
        var (_, vehicle, assignment) = await SeedActiveAssignmentAsync(fleet);

        await record.ReportIncidentAsync(vehicle.Id, "Vehicle broke down", "Critical", "VehicleBreakdown");

        var updatedAssignment = await (new Repository<Assignment>(_context)).GetByIdAsync(assignment.Id);
        Assert.Equal(AssignmentStatus.Rejected, updatedAssignment!.Status);
    }

    [Fact]
    public async Task ReportIncidentDoesNotReallocateAlreadyDeliveredAssignment()
    {
        var (record, fleet) = CreateCoordinators();
        var (driver, vehicle, assignment) = await SeedActiveAssignmentAsync(fleet);
        var shipment = (await _shipments.GetAllAsync()).Single(s => s.AssignmentId == assignment.Id);
        await fleet.CreateDeliveryConfirmationAsync(shipment.Id, driver.Id, "Recipient", "signature-data", null, null);

        await record.ReportIncidentAsync(vehicle.Id, "Customer complained about a scratch", "Low", "CustomerComplaint");

        var updatedAssignment = await (new Repository<Assignment>(_context)).GetByIdAsync(assignment.Id);
        Assert.Equal(AssignmentStatus.Delivered, updatedAssignment!.Status);
    }

    public void Dispose()
    {
        _context.Dispose();
        _factory.Dispose();
    }
}
