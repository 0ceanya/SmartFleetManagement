using SmartFM.Application.Coordinators;
using SmartFM.Domain.Entities;
using SmartFM.Infrastructure.Persistence;
using SmartFM.Infrastructure.Persistence.Repositories;
using SmartFM.Tests.TestSupport;
using Xunit;

namespace SmartFM.Tests.Coordinators;

public class OrderFulfilmentCoordinatorTests : IDisposable
{
    private const string PickupAddress = "Customer warehouse, Binh Duong";
    private const string DeliveryAddress = "Supermarket store, Q1 HCMC";

    private readonly InMemoryDbContextFactory _factory = new();
    private readonly SmartFMDbContext _context;
    private readonly OrderFulfilmentCoordinator _coordinator;
    private readonly Repository<Offering> _offerings;
    private readonly Repository<Order> _orders;
    private readonly Repository<Shipment> _shipments;
    private readonly Repository<Assignment> _assignments;
    private readonly Repository<Branch> _branches;
    private readonly Repository<Driver> _drivers;
    private readonly Repository<Vehicle> _vehicles;
    private readonly Repository<Route> _routes;

    public OrderFulfilmentCoordinatorTests()
    {
        _context = _factory.CreateContext();
        _offerings = new Repository<Offering>(_context);
        _orders = new Repository<Order>(_context);
        _shipments = new Repository<Shipment>(_context);
        _assignments = new Repository<Assignment>(_context);
        _branches = new Repository<Branch>(_context);
        _drivers = new Repository<Driver>(_context);
        _vehicles = new Repository<Vehicle>(_context);
        _routes = new Repository<Route>(_context);
        _coordinator = new OrderFulfilmentCoordinator(
            new Repository<Customer>(_context),
            _orders,
            _shipments,
            new Repository<Cargo>(_context),
            _offerings,
            _assignments,
            new UnitOfWork(_context));
    }

    private async Task<Offering> SeedOfferingAsync(decimal maxWeightKg = 1000m, decimal maxVolumeCbm = 3m)
    {
        var offering = new Offering("Light Delivery", "Small parcels", 150000m, maxWeightKg, maxVolumeCbm, "Light");
        await _offerings.AddAsync(offering);
        await _context.SaveChangesAsync();
        return offering;
    }

    private async Task ApproveOrderAsync(Order order)
    {
        var storedOrder = await _orders.GetByIdAsync(order.Id) ?? throw new InvalidOperationException("Order not found.");
        storedOrder.SetStatus(OrderStatus.Approved);
        _orders.Update(storedOrder);
        await _context.SaveChangesAsync();
    }

    private async Task ActivateOrderAsync(Order order)
    {
        var storedOrder = await _orders.GetByIdAsync(order.Id) ?? throw new InvalidOperationException("Order not found.");
        storedOrder.SetStatus(OrderStatus.Active);
        _orders.Update(storedOrder);
        await _context.SaveChangesAsync();
    }

    private async Task DispatchShipmentAsync(Shipment shipment)
    {
        var branch = new Branch("Hanoi Branch", "Hanoi");
        await _branches.AddAsync(branch);
        var driver = new Driver("Nguyen Van Tai Xe", "driver@example.com", branch.Id, "D-0001");
        await _drivers.AddAsync(driver);
        var vehicle = new LightVehicle("29A-00001", branch.Id);
        await _vehicles.AddAsync(vehicle);
        var route = new Route("Origin Address", "Destination Address", null, 100, 120);
        await _routes.AddAsync(route);
        await _context.SaveChangesAsync();

        var storedShipment = await _shipments.GetByIdAsync(shipment.Id) ?? throw new InvalidOperationException("Shipment not found.");
        var assignment = new Assignment(new[] { storedShipment }, driver, vehicle, route);
        assignment.Approve();
        await _assignments.AddAsync(assignment);

        storedShipment.AssignTo(assignment.Id);
        _shipments.Update(storedShipment);
        await _context.SaveChangesAsync();
    }

    [Fact]
    public async Task OrderFulfilmentCoordinatorPlacesOrderCreatingCustomerOrderAndShipment()
    {
        var offering = await SeedOfferingAsync();

        var (customer, order, shipment) = await _coordinator.PlaceOrderAsync(
            "Nguyen Van Khach", "khach@example.com", "0900000000", offering.Id, PickupAddress, DeliveryAddress,
            new[] { ("Boxed goods", 10m, (decimal?)1m, false) }, 10m);

        Assert.NotEqual(Guid.Empty, customer.Id);
        Assert.Equal(customer.Id, order.CustomerId);
        Assert.Equal(order.Id, shipment.OrderId);
        Assert.Equal(PickupAddress, shipment.PickupAddress);
        Assert.Equal(DeliveryAddress, shipment.DeliveryAddress);
        Assert.Null(shipment.WarehouseId);
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

        var cargoData = new List<CargoData>
        {
            new CargoData("Pallet 1 - Supermarket Goods", 35m, 1.5m, false),
            new CargoData("Pallet 2 - Household Supplies", 15m, 1.0m, false)
        };

        var (customer, order, shipment) = await _coordinator.PlaceOrderAsync(
            "Supermarket Customer", "supermarket@example.com", "0912345678", offering.Id, PickupAddress, DeliveryAddress, cargoData);

        // Total order weight = 35 + 15 = 50kg
        Assert.Equal(50m, order.OrderWeightKg);
        Assert.Equal(2, order.Cargoes.Count);

        var cargo1 = order.Cargoes[0];
        Assert.Equal(35m, cargo1.WeightKg);

        var cargo2 = order.Cargoes[1];
        Assert.Equal(15m, cargo2.WeightKg);
    }

    [Fact]
    public async Task OrderFulfilmentCoordinatorPersistsAllCargoItemsAndReturnsThemAfterReload()
    {
        var offering = await SeedOfferingAsync();

        var cargoData = new List<CargoData>
        {
            new CargoData("Pallet 1", 20m, 1m, false),
            new CargoData("Pallet 2", 30m, 1m, false),
            new CargoData("Pallet 3", 40m, 1m, true)
        };

        var (_, order, _) = await _coordinator.PlaceOrderAsync(
            "Multi Cargo Customer", "multicargo@example.com", "0900000099", offering.Id, PickupAddress, DeliveryAddress, cargoData);

        Assert.Equal(3, order.Cargoes.Count);

        var details = await _coordinator.GetOrderDetailsAsync(order.Id);

        Assert.NotNull(details);
        Assert.Equal(3, details.Value.Cargoes.Count);
        Assert.Equal(cargoData.Select(c => c.Description).OrderBy(d => d),
            details.Value.Cargoes.Select(c => c.Description).OrderBy(d => d));
    }

    [Fact]
    public async Task OrderFulfilmentCoordinatorGetOrderDetailsIncludesSubmittedCargoAfterReload()
    {
        var offering = await SeedOfferingAsync();

        var (_, order, _) = await _coordinator.PlaceOrderAsync(
            "Tran Thi Khach", "khach4@example.com", "0900000004", offering.Id, PickupAddress, DeliveryAddress,
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
        var (first, _, _) = await _coordinator.PlaceOrderAsync(
            "Nguyen Van Khach", "khach@example.com", "0900000000", offering.Id, PickupAddress, DeliveryAddress,
            new[] { ("First parcel", 5m, (decimal?)null, false) }, 5m);

        var (second, _, _) = await _coordinator.PlaceOrderAsync(
            "Nguyen Van Khach", "khach@example.com", "0900000000", offering.Id, PickupAddress, DeliveryAddress,
            new[] { ("Second parcel", 5m, (decimal?)null, false) }, 5m);

        Assert.Equal(first.Id, second.Id);
    }

    [Fact]
    public async Task OrderFulfilmentCoordinatorRejectsCargoWeightAboveOfferingLimit()
    {
        var offering = await SeedOfferingAsync(maxWeightKg: 100m);

        await Assert.ThrowsAsync<InvalidOperationException>(() => _coordinator.PlaceOrderAsync(
            "Nguyen Van Khach", "khach@example.com", "0900000000", offering.Id, PickupAddress, DeliveryAddress,
            new[] { ("Overweight item", 150m, (decimal?)null, false) }, 150m));
    }

    [Fact]
    public async Task OrderFulfilmentCoordinatorRejectsCargoVolumeAboveOfferingLimitOnlyWhenProvided()
    {
        var offering = await SeedOfferingAsync(maxWeightKg: 1000m, maxVolumeCbm: 2m);

        await Assert.ThrowsAsync<InvalidOperationException>(() => _coordinator.PlaceOrderAsync(
            "Nguyen Van Khach", "khach@example.com", "0900000000", offering.Id, PickupAddress, DeliveryAddress,
            new[] { ("Oversized item", 10m, (decimal?)5m, false) }, 10m));

        var (_, order, shipment) = await _coordinator.PlaceOrderAsync(
            "Tran Thi Khach", "khach2@example.com", "0900000001", offering.Id, PickupAddress, DeliveryAddress,
            new[] { ("Item without volume", 10m, (decimal?)null, false) }, 10m);

        Assert.Single(order.Cargoes);
    }

    [Fact]
    public async Task OrderFulfilmentCoordinatorRejectsMismatchedOrderWeightAndCargoWeight()
    {
        var offering = await SeedOfferingAsync();

        await Assert.ThrowsAsync<InvalidOperationException>(() => _coordinator.PlaceOrderAsync(
            "Nguyen Van Khach", "khach@example.com", "0900000000", offering.Id, PickupAddress, DeliveryAddress,
            new[] { ("Boxed goods", 10m, (decimal?)null, false) }, 12m));
    }

    [Fact]
    public async Task OrderFulfilmentCoordinatorFulfilsActiveOrder()
    {
        var offering = await SeedOfferingAsync();
        var (_, order, _) = await _coordinator.PlaceOrderAsync(
            "Fulfil Customer", "fulfil@example.com", "0900000010", offering.Id, PickupAddress, DeliveryAddress,
            new[] { ("Boxed goods", 10m, (decimal?)1m, false) }, 10m);
        await ApproveOrderAsync(order);
        await ActivateOrderAsync(order);

        var fulfilled = await _coordinator.MarkOrderFulfilledAsync(order.Id);

        Assert.Equal(OrderStatus.Fulfilled, fulfilled.Status);
    }

    [Fact]
    public async Task OrderFulfilmentCoordinatorRejectsFulfillingOrderThatIsNotActive()
    {
        var offering = await SeedOfferingAsync();
        var (_, order, _) = await _coordinator.PlaceOrderAsync(
            "Unapproved Customer", "unapproved@example.com", "0900000011", offering.Id, PickupAddress, DeliveryAddress,
            new[] { ("Boxed goods", 10m, (decimal?)1m, false) }, 10m);

        // Order is only "Pending" at this point (or "Approved" without an accepted driver) - never Active.
        await Assert.ThrowsAsync<InvalidOperationException>(() => _coordinator.MarkOrderFulfilledAsync(order.Id));
    }

    [Fact]
    public async Task OrderFulfilmentCoordinatorCancelsApprovedOrderBeforeDispatch()
    {
        var offering = await SeedOfferingAsync();
        var (_, order, _) = await _coordinator.PlaceOrderAsync(
            "Cancel Customer", "cancel@example.com", "0900000012", offering.Id, PickupAddress, DeliveryAddress,
            new[] { ("Boxed goods", 10m, (decimal?)1m, false) }, 10m);
        await ApproveOrderAsync(order);

        var cancelled = await _coordinator.CancelOrderAsync(order.Id);

        Assert.Equal(OrderStatus.Cancelled, cancelled.Status);
    }

    [Fact]
    public async Task OrderFulfilmentCoordinatorRejectsCancellingOrderAlreadyDispatched()
    {
        var offering = await SeedOfferingAsync();
        var (_, order, shipment) = await _coordinator.PlaceOrderAsync(
            "Dispatched Customer", "dispatched@example.com", "0900000013", offering.Id, PickupAddress, DeliveryAddress,
            new[] { ("Boxed goods", 10m, (decimal?)1m, false) }, 10m);
        await ApproveOrderAsync(order);
        await DispatchShipmentAsync(shipment);

        await Assert.ThrowsAsync<InvalidOperationException>(() => _coordinator.CancelOrderAsync(order.Id));
    }

    public void Dispose()
    {
        _context.Dispose();
        _factory.Dispose();
    }
}
