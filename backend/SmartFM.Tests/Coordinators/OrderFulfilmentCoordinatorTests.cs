using SmartFM.Application.Coordinators;
using SmartFM.Domain.Entities;
using SmartFM.Infrastructure.Persistence;
using SmartFM.Infrastructure.Persistence.Repositories;
using SmartFM.Tests.TestSupport;
using Xunit;

namespace SmartFM.Tests.Coordinators;

public class OrderFulfilmentCoordinatorTests : IDisposable
{
    private readonly InMemoryDbContextFactory _factory = new();
    private readonly SmartFMDbContext _context;
    private readonly OrderFulfilmentCoordinator _coordinator;
    private readonly Repository<Branch> _branches;
    private readonly Repository<Offering> _offerings;
    private readonly Repository<Warehouse> _warehouses;

    public OrderFulfilmentCoordinatorTests()
    {
        _context = _factory.CreateContext();
        _branches = new Repository<Branch>(_context);
        _offerings = new Repository<Offering>(_context);
        _warehouses = new Repository<Warehouse>(_context);
        _coordinator = new OrderFulfilmentCoordinator(
            new Repository<Customer>(_context),
            new Repository<Order>(_context),
            new Repository<Shipment>(_context),
            new Repository<Cargo>(_context),
            _offerings,
            _warehouses,
            new UnitOfWork(_context));
    }

    private async Task<Offering> SeedOfferingAsync(decimal maxWeightKg = 1000m, decimal maxVolumeCbm = 3m)
    {
        var offering = new Offering("Light Delivery", "Small parcels", 150000m, maxWeightKg, maxVolumeCbm, "Light");
        await _offerings.AddAsync(offering);
        await _context.SaveChangesAsync();
        return offering;
    }

    private async Task<Warehouse> SeedWarehouseAsync(decimal capacityKg = 5000m)
    {
        var branch = new Branch("Hanoi Branch", "Hanoi");
        await _branches.AddAsync(branch);
        var warehouse = new Warehouse("Hanoi Warehouse", "1 Giai Phong Street", branch.Id, capacityKg);
        await _warehouses.AddAsync(warehouse);
        await _context.SaveChangesAsync();
        return warehouse;
    }

    [Fact]
    public async Task OrderFulfilmentCoordinatorPlacesOrderCreatingCustomerOrderAndShipment()
    {
        var offering = await SeedOfferingAsync();
        var warehouse = await SeedWarehouseAsync();

        var (customer, order, shipment) = await _coordinator.PlaceOrderAsync(
            "Nguyen Van Khach", "khach@example.com", "0900000000", offering.Id, warehouse.Id,
            new[] { ("Boxed goods", 10m, (decimal?)1m, false) }, 10m);

        Assert.NotEqual(Guid.Empty, customer.Id);
        Assert.Equal(customer.Id, order.CustomerId);
        Assert.Equal(order.Id, shipment.OrderId);
        Assert.Equal(warehouse.Id, shipment.WarehouseId);
        Assert.Equal(10m, order.OrderWeightKg);
        Assert.Single(order.Cargoes);
        var cargo = order.Cargoes[0];
        Assert.Equal("Boxed goods", cargo.Description);
        Assert.Equal(10m, cargo.WeightKg);
        Assert.Equal(1m, cargo.VolumeCbm);
        Assert.Equal(order.Id, cargo.OrderId);
    }

    [Fact]
    public async Task OrderFulfilmentCoordinatorPlacesOrderWithMultipleCargoItemsAndCalculatesOrderWeight()
    {
        var offering = await SeedOfferingAsync();
        var warehouse = await SeedWarehouseAsync();

        var cargoData = new List<CargoData>
        {
            new CargoData("Pallet 1 - Supermarket Goods", 35m, 1.5m, false),
            new CargoData("Pallet 2 - Household Supplies", 15m, 1.0m, false)
        };

        var (customer, order, shipment) = await _coordinator.PlaceOrderAsync(
            "Supermarket Customer", "supermarket@example.com", "0912345678", offering.Id, warehouse.Id, cargoData);

        // Total order weight = 35 + 15 = 50kg
        Assert.Equal(50m, order.OrderWeightKg);
        Assert.Equal(2, order.Cargoes.Count);

        var cargo1 = order.Cargoes[0];
        Assert.Equal(35m, cargo1.WeightKg);

        var cargo2 = order.Cargoes[1];
        Assert.Equal(15m, cargo2.WeightKg);
    }

    [Fact]
    public async Task OrderFulfilmentCoordinatorGetOrderDetailsIncludesSubmittedCargoAfterReload()
    {
        var offering = await SeedOfferingAsync();
        var warehouse = await SeedWarehouseAsync();

        var (_, order, _) = await _coordinator.PlaceOrderAsync(
            "Tran Thi Khach", "khach4@example.com", "0900000004", offering.Id, warehouse.Id,
            new[] { ("Boxed goods", 10m, (decimal?)1m, false) }, 10m);

        var details = await _coordinator.GetOrderDetailsAsync(order.Id);

        Assert.NotNull(details);
        Assert.Equal(10m, details.Value.Order.OrderWeightKg);
        Assert.Single(details.Value.Shipments);
        Assert.Single(details.Value.Cargoes);
        Assert.Equal("Boxed goods", details.Value.Cargoes[0].Description);
    }

    [Fact]
    public async Task OrderFulfilmentCoordinatorReusesExistingCustomerByEmail()
    {
        var offering = await SeedOfferingAsync();
        var warehouse = await SeedWarehouseAsync();
        var (first, _, _) = await _coordinator.PlaceOrderAsync(
            "Nguyen Van Khach", "khach@example.com", "0900000000", offering.Id, warehouse.Id,
            new[] { ("First parcel", 5m, (decimal?)null, false) }, 5m);

        var (second, _, _) = await _coordinator.PlaceOrderAsync(
            "Nguyen Van Khach", "khach@example.com", "0900000000", offering.Id, warehouse.Id,
            new[] { ("Second parcel", 5m, (decimal?)null, false) }, 5m);

        Assert.Equal(first.Id, second.Id);
    }

    [Fact]
    public async Task OrderFulfilmentCoordinatorRejectsCargoWeightAboveOfferingLimit()
    {
        var offering = await SeedOfferingAsync(maxWeightKg: 100m);
        var warehouse = await SeedWarehouseAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() => _coordinator.PlaceOrderAsync(
            "Nguyen Van Khach", "khach@example.com", "0900000000", offering.Id, warehouse.Id,
            new[] { ("Overweight item", 150m, (decimal?)null, false) }, 150m));
    }

    [Fact]
    public async Task OrderFulfilmentCoordinatorRejectsCargoVolumeAboveOfferingLimitOnlyWhenProvided()
    {
        var offering = await SeedOfferingAsync(maxWeightKg: 1000m, maxVolumeCbm: 2m);
        var warehouse = await SeedWarehouseAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() => _coordinator.PlaceOrderAsync(
            "Nguyen Van Khach", "khach@example.com", "0900000000", offering.Id, warehouse.Id,
            new[] { ("Oversized item", 10m, (decimal?)5m, false) }, 10m));

        var (_, order, shipment) = await _coordinator.PlaceOrderAsync(
            "Tran Thi Khach", "khach2@example.com", "0900000001", offering.Id, warehouse.Id,
            new[] { ("Item without volume", 10m, (decimal?)null, false) }, 10m);

        Assert.Single(order.Cargoes);
    }

    [Fact]
    public async Task OrderFulfilmentCoordinatorRejectsOrderExceedingWarehouseCapacity()
    {
        var offering = await SeedOfferingAsync(maxWeightKg: 1000m);
        var warehouse = await SeedWarehouseAsync(capacityKg: 50m);

        await Assert.ThrowsAsync<InvalidOperationException>(() => _coordinator.PlaceOrderAsync(
            "Nguyen Van Khach", "khach@example.com", "0900000000", offering.Id, warehouse.Id,
            new[] { ("Heavy item", 100m, (decimal?)null, false) }, 100m));
    }

    [Fact]
    public async Task OrderFulfilmentCoordinatorRejectsMismatchedOrderWeightAndCargoWeight()
    {
        var offering = await SeedOfferingAsync();
        var warehouse = await SeedWarehouseAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() => _coordinator.PlaceOrderAsync(
            "Nguyen Van Khach", "khach@example.com", "0900000000", offering.Id, warehouse.Id,
            new[] { ("Boxed goods", 10m, (decimal?)null, false) }, 12m));
    }

    public void Dispose()
    {
        _context.Dispose();
        _factory.Dispose();
    }
}
