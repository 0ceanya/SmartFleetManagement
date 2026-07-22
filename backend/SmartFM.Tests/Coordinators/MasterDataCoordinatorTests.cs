using SmartFM.Application.Coordinators;
using SmartFM.Domain.Entities;
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
        _coordinator = new MasterDataCoordinator(
            new Repository<Branch>(_context),
            new Repository<Warehouse>(_context),
            new Repository<Employee>(_context),
            new Repository<Vehicle>(_context),
            new Repository<Offering>(_context),
            new UnitOfWork(_context));
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

        var warehouse = await _coordinator.CreateWarehouseAsync("Hue Warehouse", "1 Le Loi Street", branch.Id);

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
    }

    [Fact]
    public async Task MasterDataCoordinatorCreatesVehicleForVehicleClass()
    {
        var branch = await _coordinator.CreateBranchAsync("Hai Phong Branch", "Hai Phong");

        var vehicle = await _coordinator.CreateVehicleAsync("15A-00001", branch.Id, "Medium");

        Assert.IsType<MediumVehicle>(vehicle);
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

    public void Dispose()
    {
        _context.Dispose();
        _factory.Dispose();
    }
}
