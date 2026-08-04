using SmartFM.Application.Coordinators;
using SmartFM.Domain.Entities;
using SmartFM.Domain.ValueObjects;
using SmartFM.Infrastructure.Persistence;
using SmartFM.Infrastructure.Persistence.Repositories;
using SmartFM.Tests.TestSupport;
using Xunit;

namespace SmartFM.Tests.Coordinators;

public class MasterDataCoordinatorTests : IDisposable
{
    private readonly InMemoryDbContextFactory _factory = new();
    private readonly SmartFMDbContext _context;
    private readonly MasterDataCoordinator _coordinator;

    public MasterDataCoordinatorTests()
    {
        _context = _factory.CreateContext();
        var unitOfWork = new UnitOfWork(_context);
        var recordCoordinator = new RecordCoordinator(
            new Repository<Domain.Records.AuditRecord>(_context),
            new Repository<Notification>(_context),
            new Repository<Domain.Records.IncidentRecord>(_context),
            new Repository<Assignment>(_context),
            new Repository<Shipment>(_context),
            () => null!,  // incident methods not invoked in master data tests
            unitOfWork);
        _coordinator = new MasterDataCoordinator(
            new Repository<Branch>(_context),
            new Repository<Warehouse>(_context),
            new Repository<Employee>(_context),
            new Repository<Vehicle>(_context),
            new Repository<Offering>(_context),
            recordCoordinator,
            unitOfWork);
    }

    [Fact]
    public async Task MasterDataCoordinatorCreatesBranchWithUniqueName()
    {
        var branch = await _coordinator.CreateBranchAsync("Danang Branch", "Danang");

        Assert.NotEqual(Guid.Empty, branch.Id);
        Assert.Equal("Danang Branch", branch.Name);
    }

    [Fact]
    public async Task MasterDataCoordinatorRejectsDuplicateBranchName()
    {
        await _coordinator.CreateBranchAsync("Danang Branch", "Danang");

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _coordinator.CreateBranchAsync("Danang Branch", "Hue"));
    }

    [Fact]
    public async Task MasterDataCoordinatorCreatesWarehouseUnderBranch()
    {
        var branch = await _coordinator.CreateBranchAsync("Hue Branch", "Hue");

        var warehouse = await _coordinator.CreateWarehouseAsync("Hue Warehouse", "1 Le Loi Street", branch.Id, 5000m);

        Assert.Equal(branch.Id, warehouse.BranchId);
    }

    [Fact]
    public async Task MasterDataCoordinatorCreatesDriverStaffAndManager()
    {
        var branch = await _coordinator.CreateBranchAsync("Can Tho Branch", "Can Tho");

        var driver = await _coordinator.CreateDriverAsync("Vo Van F", "driver.f@smartfm.vn", branch.Id, "D-0099");
        var staff = await _coordinator.CreateStaffAsync("Do Thi G", "staff.g@smartfm.vn", branch.Id, "Operations");
        var manager = await _coordinator.CreateManagerAsync("Bui Van H", "manager.h@smartfm.vn", branch.Id);

        var employees = (await _coordinator.GetEmployeesAsync()).ToList();
        Assert.Contains(employees, e => e.Id == driver.Id);
        Assert.Contains(employees, e => e.Id == staff.Id);
        Assert.Contains(employees, e => e.Id == manager.Id);

        var audits = _context.Set<Domain.Records.AuditRecord>().ToList();
        Assert.Contains(audits, a => a.EntityType == "Driver" && a.EntityId == driver.Id && a.ChangedBy == "Admin");
        Assert.Contains(audits, a => a.EntityType == "Staff" && a.EntityId == staff.Id && a.ChangedBy == "Admin");
        Assert.DoesNotContain(audits, a => a.EntityId == manager.Id);
    }

    [Fact]
    public async Task MasterDataCoordinatorCreatesVehicleForVehicleClass()
    {
        var branch = await _coordinator.CreateBranchAsync("Hai Phong Branch", "Hai Phong");

        var vehicle = await _coordinator.CreateVehicleAsync("15A-00001", branch.Id, "Medium");

        Assert.IsType<MediumVehicle>(vehicle);

        var audits = _context.Set<Domain.Records.AuditRecord>().ToList();
        Assert.Contains(audits, a => a.EntityType == "Vehicle" && a.EntityId == vehicle.Id
            && a.FromStatus == null && a.ToStatus == VehicleStatus.Available && a.ChangedBy == "Admin");
    }

    [Fact]
    public async Task MasterDataCoordinatorRecordsAuditOnVehicleStatusUpdate()
    {
        var branch = await _coordinator.CreateBranchAsync("Vinh Branch", "Vinh");
        var vehicle = await _coordinator.CreateVehicleAsync("38A-00001", branch.Id, "Light");

        await _coordinator.UpdateVehicleStatusAsync(vehicle.Id, VehicleStatus.UnderMaintenance);

        var audits = _context.Set<Domain.Records.AuditRecord>().ToList();
        Assert.Contains(audits, a => a.EntityType == "Vehicle" && a.EntityId == vehicle.Id
            && a.FromStatus == VehicleStatus.Available && a.ToStatus == VehicleStatus.UnderMaintenance && a.ChangedBy == "Admin");
    }

    [Fact]
    public async Task MasterDataCoordinatorUpdatesOfferingPricing()
    {
        var offering = await _coordinator.CreateOfferingAsync("Light Delivery", "Small parcels", 150000m, 1000m, 3m, "Light");

        var updated = await _coordinator.UpdateOfferingAsync(offering.Id, "Small and medium parcels", 175000m, 1200m, 4m);

        Assert.Equal(175000m, updated.BasePrice);
        Assert.Equal(1200m, updated.MaxWeightKg);
    }

    [Fact]
    public async Task MasterDataCoordinatorDeletesBranch()
    {
        var branch = await _coordinator.CreateBranchAsync("Vinh Branch", "Vinh");

        await _coordinator.DeleteBranchAsync(branch.Id);

        var branches = await _coordinator.GetBranchesAsync();
        Assert.DoesNotContain(branches, b => b.Id == branch.Id);
    }

    [Fact]
    public async Task MasterDataCoordinatorUpdatesAndDeletesWarehouse()
    {
        var branch = await _coordinator.CreateBranchAsync("Nha Trang Branch", "Nha Trang");
        var wh = await _coordinator.CreateWarehouseAsync("Old Depot", "Address 1", branch.Id, 10000m);

        var updated = await _coordinator.UpdateWarehouseAsync(wh.Id, "Updated Depot", "Address 2");
        Assert.Equal("Updated Depot", updated.Name);
        Assert.Equal("Address 2", updated.Address);

        await _coordinator.DeleteWarehouseAsync(wh.Id);
        var warehouses = await _coordinator.GetWarehousesAsync();
        Assert.DoesNotContain(warehouses, w => w.Id == wh.Id);
    }

    [Fact]
    public async Task MasterDataCoordinatorUpdatesAndDeletesEmployee()
    {
        var branch = await _coordinator.CreateBranchAsync("Quy Nhon Branch", "Quy Nhon");
        var driver = await _coordinator.CreateDriverAsync("Original Name", "orig@smartfm.vn", branch.Id, "D-1111");

        var updated = await _coordinator.UpdateEmployeeContactAsync(driver.Id, "Updated Name", "updated@smartfm.vn");
        Assert.Equal("Updated Name", updated.Name);
        Assert.Equal("updated@smartfm.vn", updated.Email);

        await _coordinator.DeleteEmployeeAsync(driver.Id);
        var employees = await _coordinator.GetEmployeesAsync();
        Assert.DoesNotContain(employees, e => e.Id == driver.Id);
    }

    [Fact]
    public async Task MasterDataCoordinatorUpdatesAndDeletesVehicle()
    {
        var branch = await _coordinator.CreateBranchAsync("Phu Quoc Branch", "Phu Quoc");
        var vehicle = await _coordinator.CreateVehicleAsync("68A-11111", branch.Id, "Heavy");

        var updated = await _coordinator.UpdateVehicleStatusAsync(vehicle.Id, "UnderMaintenance");
        Assert.Equal("UnderMaintenance", updated.CurrentStatus);

        await _coordinator.DeleteVehicleAsync(vehicle.Id);
        var vehicles = await _coordinator.GetVehiclesAsync();
        Assert.DoesNotContain(vehicles, v => v.Id == vehicle.Id);
    }

    [Fact]
    public async Task MasterDataCoordinatorDeletesOffering()
    {
        var offering = await _coordinator.CreateOfferingAsync("Test Service", "Desc", 100000m, 500m, 1m, "Light");

        await _coordinator.DeleteOfferingAsync(offering.Id);

        var offerings = await _coordinator.GetOfferingsAsync();
        Assert.DoesNotContain(offerings, o => o.Id == offering.Id);
    }

    [Fact]
    public async Task MasterDataCoordinatorPatchesVehicleBranchAndStatus()
    {
        var branch1 = await _coordinator.CreateBranchAsync("Branch Alpha", "City A");
        var branch2 = await _coordinator.CreateBranchAsync("Branch Beta", "City B");
        var vehicle = await _coordinator.CreateVehicleAsync("29A-99999", branch1.Id, "Light");

        var patched = await _coordinator.PatchVehicleAsync(vehicle.Id, branch2.Id, "UnderMaintenance");

        Assert.Equal(branch2.Id, patched.BranchId);
        Assert.Equal("UnderMaintenance", patched.CurrentStatus);
    }

    [Fact]
    public async Task MasterDataCoordinatorPatchesEmployeeBranchAndPromotesStaffToManager()
    {
        var branch1 = await _coordinator.CreateBranchAsync("Branch Gamma", "City C");
        var branch2 = await _coordinator.CreateBranchAsync("Branch Delta", "City D");
        var staff = await _coordinator.CreateStaffAsync("Nguyen Staff", "staff@smartfm.vn", branch1.Id, "Support");

        var promoted = await _coordinator.PatchEmployeeAsync(staff.Id, "Nguyen Manager", "manager@smartfm.vn", branch2.Id, null, null, promoteToManager: true);

        Assert.IsType<Manager>(promoted);
        Assert.Equal(staff.Id, promoted.Id);
        Assert.Equal("Nguyen Manager", promoted.Name);
        Assert.Equal("manager@smartfm.vn", promoted.Email);
        Assert.Equal(branch2.Id, promoted.BranchId);
    }

    public void Dispose()
    {
        _context.Dispose();
        _factory.Dispose();
    }
}
