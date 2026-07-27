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
            new[] { ("Boxed goods", 10m, (decimal?)1m, false) });

        Assert.NotEqual(Guid.Empty, customer.Id);
        Assert.Equal(customer.Id, order.CustomerId);
        Assert.Equal(order.Id, shipment.OrderId);
        Assert.Equal(warehouse.Id, shipment.WarehouseId);
        Assert.Single(shipment.Cargoes);
        var cargo = shipment.Cargoes[0];
        Assert.Equal("Boxed goods", cargo.Description);
        Assert.Equal(10m, cargo.WeightKg);
        Assert.Equal(1m, cargo.VolumeCbm);
        Assert.Equal(shipment.Id, cargo.ShipmentId);
    }

    [Fact]
    public async Task OrderFulfilmentCoordinatorGetOrderDetailsIncludesSubmittedCargoAfterReload()
    {
        var offering = await SeedOfferingAsync();
        var warehouse = await SeedWarehouseAsync();

        var (_, order, _) = await _coordinator.PlaceOrderAsync(
            "Tran Thi Khach", "khach4@example.com", "0900000004", offering.Id, warehouse.Id,
            new[] { ("Boxed goods", 10m, (decimal?)1m, false) });

        var details = await _coordinator.GetOrderDetailsAsync(order.Id);

        Assert.NotNull(details);
        Assert.Single(details.Value.Shipments);
        var shipment = details.Value.Shipments[0];
        Assert.Single(shipment.Cargoes);
        Assert.Equal("Boxed goods", shipment.Cargoes[0].Description);
    }

    [Fact]
    public async Task OrderFulfilmentCoordinatorReusesExistingCustomerByEmail()
    {
        var offering = await SeedOfferingAsync();
        var warehouse = await SeedWarehouseAsync();
        var (first, _, _) = await _coordinator.PlaceOrderAsync(
            "Nguyen Van Khach", "khach@example.com", "0900000000", offering.Id, warehouse.Id,
            Array.Empty<(string, decimal, decimal?, bool)>());

        var (second, _, _) = await _coordinator.PlaceOrderAsync(
            "Nguyen Van Khach", "khach@example.com", "0900000000", offering.Id, warehouse.Id,
            Array.Empty<(string, decimal, decimal?, bool)>());

        Assert.Equal(first.Id, second.Id);
    }

    [Fact]
    public async Task OrderFulfilmentCoordinatorRejectsCargoWeightAboveOfferingLimit()
    {
        var offering = await SeedOfferingAsync(maxWeightKg: 100m);
        var warehouse = await SeedWarehouseAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() => _coordinator.PlaceOrderAsync(
            "Nguyen Van Khach", "khach@example.com", "0900000000", offering.Id, warehouse.Id,
            new[] { ("Overweight item", 150m, (decimal?)null, false) }));
    }

    [Fact]
    public async Task OrderFulfilmentCoordinatorRejectsCargoVolumeAboveOfferingLimitOnlyWhenProvided()
    {
        var offering = await SeedOfferingAsync(maxWeightKg: 1000m, maxVolumeCbm: 2m);
        var warehouse = await SeedWarehouseAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() => _coordinator.PlaceOrderAsync(
            "Nguyen Van Khach", "khach@example.com", "0900000000", offering.Id, warehouse.Id,
            new[] { ("Oversized item", 10m, (decimal?)5m, false) }));

        var (_, _, shipment) = await _coordinator.PlaceOrderAsync(
            "Tran Thi Khach", "khach2@example.com", "0900000001", offering.Id, warehouse.Id,
            new[] { ("Item without volume", 10m, (decimal?)null, false) });

        Assert.Single(shipment.Cargoes);
    }

    [Fact]
    public async Task OrderFulfilmentCoordinatorRejectsOrderExceedingWarehouseCapacity()
    {
        var offering = await SeedOfferingAsync(maxWeightKg: 1000m);
        var warehouse = await SeedWarehouseAsync(capacityKg: 50m);

        await Assert.ThrowsAsync<InvalidOperationException>(() => _coordinator.PlaceOrderAsync(
            "Nguyen Van Khach", "khach@example.com", "0900000000", offering.Id, warehouse.Id,
            new[] { ("Heavy item", 100m, (decimal?)null, false) }));
    }

    public void Dispose()
    {
        _context.Dispose();
        _factory.Dispose();
    }
}
