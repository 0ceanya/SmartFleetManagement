using System.Text.Json;
using SmartFM.Application.Coordinators;
using SmartFM.Domain.Entities;
using SmartFM.Domain.Records;
using SmartFM.Domain.ValueObjects;
using SmartFM.Infrastructure.Persistence;
using SmartFM.Infrastructure.Persistence.Repositories;
using SmartFM.Tests.TestSupport;
using Xunit;

namespace SmartFM.Tests.Coordinators;

public class ReportingCoordinatorTests : IDisposable
{
    private readonly InMemoryDbContextFactory _factory = new();
    private readonly SmartFMDbContext _context;
    private readonly ReportingCoordinator _coordinator;
    private readonly Repository<TrackingRecord> _trackingRecords;
    private readonly Repository<IncidentRecord> _incidentRecords;
    private readonly Repository<Branch> _branches;
    private readonly Repository<Driver> _drivers;
    private readonly Repository<Vehicle> _vehicles;
    private readonly Repository<Customer> _customers;
    private readonly Repository<Offering> _offerings;
    private readonly Repository<Order> _orders;
    private readonly Repository<Shipment> _shipments;
    private readonly Repository<Assignment> _assignments;
    private readonly Repository<Invoice> _invoices;
    private readonly Repository<Employee> _employees;
    private readonly Repository<AuditRecord> _auditRecords;
    private readonly Repository<Cargo> _cargoes;

    public ReportingCoordinatorTests()
    {
        _context = _factory.CreateContext();
        _trackingRecords = new Repository<TrackingRecord>(_context);
        _incidentRecords = new Repository<IncidentRecord>(_context);
        _branches = new Repository<Branch>(_context);
        _drivers = new Repository<Driver>(_context);
        _vehicles = new Repository<Vehicle>(_context);
        _customers = new Repository<Customer>(_context);
        _offerings = new Repository<Offering>(_context);
        _orders = new Repository<Order>(_context);
        _shipments = new Repository<Shipment>(_context);
        _assignments = new Repository<Assignment>(_context);
        _invoices = new Repository<Invoice>(_context);
        _employees = new Repository<Employee>(_context);
        _auditRecords = new Repository<AuditRecord>(_context);
        _cargoes = new Repository<Cargo>(_context);

        _coordinator = new ReportingCoordinator(
            _trackingRecords,
            _incidentRecords,
            new Repository<Report>(_context),
            _assignments,
            _vehicles,
            _orders,
            _invoices,
            _employees,
            _auditRecords,
            _shipments,
            _cargoes,
            new UnitOfWork(_context));
    }

    private async Task<Branch> SeedBranchAsync(string name) =>
        await AddAndSaveAsync(_branches, new Branch(name, "Hanoi"));

    private async Task<Driver> SeedDriverAsync(Guid branchId) =>
        await AddAndSaveAsync(_drivers, new Driver("Nguyen Van Tai Xe", $"driver-{Guid.NewGuid()}@example.com", branchId, "D-0001"));

    private async Task<Vehicle> SeedVehicleAsync(Guid branchId, string status)
    {
        var vehicle = new LightVehicle($"29A-{Guid.NewGuid().ToString()[..5]}", branchId);
        vehicle.SetStatus(status);
        return await AddAndSaveAsync(_vehicles, vehicle);
    }

    private async Task<Shipment> SeedShipmentAsync()
    {
        var customer = await AddAndSaveAsync(_customers, new Customer("Nguyen Van Khach", $"khach-{Guid.NewGuid()}@example.com", "0900000000"));
        var offering = await AddAndSaveAsync(_offerings, new Offering("Light Delivery", "Small parcels", 150000m, 1000m, 3m, "Light"));
        var order = new Order(customer, offering);
        var shipment = new Shipment(order, "Pickup Address", "Delivery Address");
        order.AttachShipment(shipment);
        await _orders.AddAsync(order);
        return await AddAndSaveAsync(_shipments, shipment);
    }

    private async Task<Assignment> SeedAssignmentAsync(Driver driver, Vehicle vehicle)
    {
        var shipment = await SeedShipmentAsync();
        var assignment = new Assignment(new[] { shipment }, driver, vehicle, null);
        return await AddAndSaveAsync(_assignments, assignment);
    }

    private async Task<Assignment> SeedDeliveredAssignmentAsync(Driver driver, Vehicle vehicle)
    {
        var shipment = await SeedShipmentAsync();
        var assignment = new Assignment(new[] { shipment }, driver, vehicle, null);
        assignment.Approve();
        assignment.MarkLoaded();
        assignment.MarkDelivering();
        assignment.Deliver();
        return await AddAndSaveAsync(_assignments, assignment);
    }

    private async Task<Order> SeedOrderWithCargoAsync(decimal weightKg)
    {
        var customer = await AddAndSaveAsync(_customers, new Customer("Nguyen Van Khach", $"khach-{Guid.NewGuid()}@example.com", "0900000000"));
        var offering = await AddAndSaveAsync(_offerings, new Offering("Light Delivery", "Small parcels", 150000m, 1000m, 3m, "Light"));
        var order = new Order(customer, offering);
        order.AddCargo(new Cargo(order.Id, "Boxes", weightKg, null, false));
        return await AddAndSaveAsync(_orders, order);
    }

    private async Task<Invoice> SeedInvoiceAsync(decimal amount, bool paid)
    {
        var customer = await AddAndSaveAsync(_customers, new Customer("Nguyen Van Khach", $"khach-{Guid.NewGuid()}@example.com", "0900000000"));
        var offering = await AddAndSaveAsync(_offerings, new Offering("Light Delivery", "Small parcels", 150000m, 1000m, 3m, "Light"));
        var order = await AddAndSaveAsync(_orders, new Order(customer, offering));
        var invoice = new Invoice(order, amount);
        if (paid) invoice.MarkPaid();
        return await AddAndSaveAsync(_invoices, invoice);
    }

    private async Task<T> AddAndSaveAsync<T>(Repository<T> repository, T entity) where T : class
    {
        await repository.AddAsync(entity);
        await _context.SaveChangesAsync();
        return entity;
    }

    [Fact]
    public async Task ReportingCoordinatorGeneratesReportAggregatingRecordsAndWritesAuditRecord()
    {
        var from = DateTime.UtcNow.AddMinutes(-5);

        await _trackingRecords.AddAsync(new TrackingRecord { VehicleId = Guid.NewGuid(), Lat = 21.0, Lon = 105.8, Waypoint = "Depot" });
        await _incidentRecords.AddAsync(new IncidentRecord { VehicleId = Guid.NewGuid(), Description = "Breakdown", Severity = "High" });
        await _context.SaveChangesAsync();

        var to = DateTime.UtcNow.AddMinutes(5);

        var report = await _coordinator.GenerateReportAsync("FleetSummary", from, to, null);

        Assert.Equal("FleetSummary", report.ReportType);
        Assert.Contains("TrackingRecords: 1", report.Content);
        Assert.Contains("IncidentRecords: 1", report.Content);
    }

    [Fact]
    public async Task ReportingCoordinatorComputesFleetWideKpisAndBreakdowns()
    {
        var branchA = await SeedBranchAsync("Branch A");
        var branchB = await SeedBranchAsync("Branch B");
        var driver1 = await SeedDriverAsync(branchA.Id);
        var driver2 = await SeedDriverAsync(branchB.Id);
        var vehicleA1 = await SeedVehicleAsync(branchA.Id, VehicleStatus.Available);
        await SeedVehicleAsync(branchA.Id, VehicleStatus.UnderMaintenance);
        var vehicleB1 = await SeedVehicleAsync(branchB.Id, VehicleStatus.Assigned);

        await SeedAssignmentAsync(driver1, vehicleA1);
        await SeedAssignmentAsync(driver2, vehicleB1);

        await _incidentRecords.AddAsync(new IncidentRecord { VehicleId = vehicleA1.Id, Description = "Flat tire", Severity = "Low" });
        await _context.SaveChangesAsync();

        await SeedOrderWithCargoAsync(50m);
        await SeedInvoiceAsync(1000m, paid: true);
        await SeedInvoiceAsync(500m, paid: false);

        var from = DateTime.UtcNow.AddMinutes(-5);
        var to = DateTime.UtcNow.AddMinutes(5);

        var report = await _coordinator.GenerateReportAsync("FleetSummary", from, to, null);

        Assert.Equal(2, report.TotalAssignments);
        Assert.Equal(2, report.ActiveVehicles);
        Assert.Equal(1, report.IncidentCount);
        Assert.Equal(50m, report.TotalCargoWeightKg);
        Assert.Equal(1000m, report.Revenue);

        var jsonOptions = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };

        var byDay = JsonSerializer.Deserialize<List<AssignmentsByDayEntry>>(report.AssignmentsByDayJson, jsonOptions);
        Assert.NotNull(byDay);
        Assert.Equal(2, byDay!.Sum(e => e.Count));

        var byBranch = JsonSerializer.Deserialize<List<AssignmentsByBranchEntry>>(report.AssignmentsByBranchJson, jsonOptions);
        Assert.NotNull(byBranch);
        Assert.Contains(byBranch!, e => e.BranchId == branchA.Id && e.Count == 1);
        Assert.Contains(byBranch!, e => e.BranchId == branchB.Id && e.Count == 1);

        var byDriver = JsonSerializer.Deserialize<List<AssignmentsByDriverEntry>>(report.AssignmentsByDriverJson, jsonOptions);
        Assert.NotNull(byDriver);
        Assert.Contains(byDriver!, e => e.DriverId == driver1.Id && e.Count == 1);
        Assert.Contains(byDriver!, e => e.DriverId == driver2.Id && e.Count == 1);
    }

    [Fact]
    public async Task ReportingCoordinatorScopesAssignmentKpisToBranchButKeepsCargoAndRevenueFleetWide()
    {
        var branchA = await SeedBranchAsync("Branch A");
        var branchB = await SeedBranchAsync("Branch B");
        var driver1 = await SeedDriverAsync(branchA.Id);
        var driver2 = await SeedDriverAsync(branchB.Id);
        var vehicleA1 = await SeedVehicleAsync(branchA.Id, VehicleStatus.Available);
        var vehicleB1 = await SeedVehicleAsync(branchB.Id, VehicleStatus.Available);

        await SeedAssignmentAsync(driver1, vehicleA1);
        await SeedAssignmentAsync(driver2, vehicleB1);

        await _incidentRecords.AddAsync(new IncidentRecord { VehicleId = vehicleA1.Id, Description = "Flat tire", Severity = "Low" });
        await _incidentRecords.AddAsync(new IncidentRecord { VehicleId = vehicleB1.Id, Description = "Flat tire", Severity = "Low" });
        await _context.SaveChangesAsync();

        await SeedOrderWithCargoAsync(50m);
        await SeedInvoiceAsync(1000m, paid: true);

        var from = DateTime.UtcNow.AddMinutes(-5);
        var to = DateTime.UtcNow.AddMinutes(5);

        var fleetWideReport = await _coordinator.GenerateReportAsync("FleetSummary", from, to, null);
        var branchReport = await _coordinator.GenerateReportAsync("FleetSummary", from, to, branchA.Id);

        Assert.Equal(2, fleetWideReport.TotalAssignments);
        Assert.Equal(1, branchReport.TotalAssignments);
        Assert.Equal(1, branchReport.ActiveVehicles);
        Assert.Equal(1, branchReport.IncidentCount);

        Assert.Equal(fleetWideReport.TotalCargoWeightKg, branchReport.TotalCargoWeightKg);
        Assert.Equal(fleetWideReport.Revenue, branchReport.Revenue);
    }

    [Fact]
    public async Task GetDashboardSummaryAsync_CountsTripsAndDistanceWithinPeriod()
    {
        var branch = await SeedBranchAsync("Branch A");
        var driver = await SeedDriverAsync(branch.Id);
        var vehicle = await SeedVehicleAsync(branch.Id, VehicleStatus.Available);
        var assignment = await SeedDeliveredAssignmentAsync(driver, vehicle);

        await _trackingRecords.AddAsync(new TrackingRecord { VehicleId = vehicle.Id, AssignmentId = assignment.Id, Lat = 21.0, Lon = 105.8 });
        await _trackingRecords.AddAsync(new TrackingRecord { VehicleId = vehicle.Id, AssignmentId = assignment.Id, Lat = 21.1, Lon = 105.9 });
        await _context.SaveChangesAsync();

        var from = DateTime.UtcNow.AddMinutes(-5);
        var to = DateTime.UtcNow.AddMinutes(5);

        var summary = await _coordinator.GetDashboardSummaryAsync(from, to, branch.Id, null);

        Assert.Equal(1, summary.TripsCompleted);
        Assert.True(summary.TotalKm > 0);
        Assert.Equal(100, summary.FleetUtilizationPct);
        Assert.Equal(0, summary.TripsCompletedPrevPeriod);
    }

    [Fact]
    public async Task GetTripsByVehicleTypeAsync_GroupsByVehicleClrType()
    {
        var branch = await SeedBranchAsync("Branch A");
        var driver = await SeedDriverAsync(branch.Id);
        var lightVehicle = await SeedVehicleAsync(branch.Id, VehicleStatus.Available);
        var heavyVehicle = await AddAndSaveAsync(_vehicles, new HeavyVehicle($"29A-{Guid.NewGuid().ToString()[..5]}", branch.Id));

        await SeedDeliveredAssignmentAsync(driver, lightVehicle);
        await SeedDeliveredAssignmentAsync(driver, heavyVehicle);

        var from = DateTime.UtcNow.AddMinutes(-5);
        var to = DateTime.UtcNow.AddMinutes(5);

        var byType = await _coordinator.GetTripsByVehicleTypeAsync(from, to, null);

        Assert.Contains(byType, e => e.VehicleType == "Light" && e.Count == 1);
        Assert.Contains(byType, e => e.VehicleType == "Heavy" && e.Count == 1);
    }

    public void Dispose()
    {
        _context.Dispose();
        _factory.Dispose();
    }
}
