using SmartFM.Application.Coordinators;
using SmartFM.Domain.Entities;
using SmartFM.Domain.ValueObjects;
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
    private readonly Repository<Assignment> _assignments;
    private readonly Repository<Cargo> _cargoes;
    private readonly Repository<LoadManifest> _loadManifests;

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
        _assignments = new Repository<Assignment>(_context);
        _cargoes = new Repository<Cargo>(_context);
        _loadManifests = new Repository<LoadManifest>(_context);

        var unitOfWork = new UnitOfWork(_context);
        FleetAssignmentCoordinator? fleet = null;
        var recordCoordinator = new RecordCoordinator(
            new Repository<Domain.Records.AuditRecord>(_context),
            new Repository<Notification>(_context),
            new Repository<Domain.Records.IncidentRecord>(_context),
            _assignments,
            _shipments,
            () => fleet!,
            unitOfWork);
        var orderFulfilmentCoordinator = new OrderFulfilmentCoordinator(
            _customers,
            _orders,
            _shipments,
            _cargoes,
            _offerings,
            _assignments,
            new Repository<Invoice>(_context),
            recordCoordinator,
            unitOfWork);

        _coordinator = fleet = new FleetAssignmentCoordinator(
            new Repository<Route>(_context),
            _assignments,
            _drivers,
            _vehicles,
            _shipments,
            _orders,
            _customers,
            _warehouses,
            new Repository<DeliveryConfirmation>(_context),
            _loadManifests,
            _cargoes,
            orderFulfilmentCoordinator,
            recordCoordinator,
            unitOfWork);
    }

    private static RouteData SampleRouteData(double distanceKm = 100, int estimatedDurationMinutes = 120) =>
        new("Origin Address, Hanoi", "Destination Address, HCMC", new[] { "Waypoint 1" }, distanceKm, estimatedDurationMinutes);

    private async Task<(Warehouse origin, Warehouse destination)> SeedWarehousesAsync()
    {
        var branch = new Branch("Hanoi Branch", "Hanoi");
        await _branches.AddAsync(branch);
        var origin = new Warehouse("Origin Warehouse", "1 Origin Street", branch.Id, 5000m);
        var destination = new Warehouse("Destination Warehouse", "1 Destination Street", branch.Id, 5000m);
        await _warehouses.AddAsync(origin);
        await _warehouses.AddAsync(destination);
        await _context.SaveChangesAsync();
        return (origin, destination);
    }

    private async Task<Shipment> SeedShipmentAsync(decimal orderWeightKg = 10m)
    {
        var customer = new Customer("Nguyen Van Khach", "khach@example.com", "0900000000");
        await _customers.AddAsync(customer);
        var offering = new Offering("Light Delivery", "Small parcels", 150000m, 1000m, 3m, "Light");
        await _offerings.AddAsync(offering);
        var order = new Order(customer, offering, orderWeightKg);
        var shipment = new Shipment(order, "Customer warehouse, Binh Duong", "Supermarket store, Q1 HCMC");
        order.AttachShipment(shipment);
        order.SetStatus(OrderStatus.Approved);
        await _orders.AddAsync(order);
        await _shipments.AddAsync(shipment);
        await _context.SaveChangesAsync();
        return shipment;
    }

    private async Task<(Shipment Shipment, List<Cargo> Cargoes)> SeedShipmentWithCargoAsync(int cargoCount = 2)
    {
        var customer = new Customer("Nguyen Van Khach", "khach@example.com", "0900000000");
        await _customers.AddAsync(customer);
        var offering = new Offering("Light Delivery", "Small parcels", 150000m, 1000m, 3m, "Light");
        await _offerings.AddAsync(offering);
        var order = new Order(customer, offering);
        var cargoes = new List<Cargo>();
        for (var i = 0; i < cargoCount; i++)
        {
            var cargo = new Cargo(order.Id, $"Box {i + 1}", 5m, null, false);
            order.AddCargo(cargo);
            cargoes.Add(cargo);
        }
        var shipment = new Shipment(order, "Customer warehouse, Binh Duong", "Supermarket store, Q1 HCMC");
        order.AttachShipment(shipment);
        order.SetStatus(OrderStatus.Approved);
        await _orders.AddAsync(order);
        await _shipments.AddAsync(shipment);
        foreach (var cargo in cargoes)
            await _cargoes.AddAsync(cargo);
        await _context.SaveChangesAsync();
        return (shipment, cargoes);
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
    public async Task FleetAssignmentCoordinatorCreatesPendingAssignmentBindingDriverVehicleAndShipments()
    {
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var firstShipment = await SeedShipmentAsync();
        var secondShipment = await SeedShipmentAsync();

        var assignment = await _coordinator.CreateAssignmentAsync(
            new[] { firstShipment.Id, secondShipment.Id }, driver.Id, vehicle.Id);

        Assert.Equal(AssignmentStatus.Pending, assignment.Status);
        var details = await _coordinator.GetAssignmentDetailsAsync(assignment.Id);
        Assert.NotNull(details);
        var shipmentIds = details!.Value.Shipments.Select(s => s.Shipment.Id).ToList();
        Assert.Equal(2, shipmentIds.Count);
        Assert.Contains(firstShipment.Id, shipmentIds);
        Assert.Contains(secondShipment.Id, shipmentIds);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorCreatesAssignmentWithNullRouteForDirectDelivery()
    {
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var shipment = await SeedShipmentAsync();

        var assignment = await _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id);

        Assert.Null(assignment.RouteId);
        var details = await _coordinator.GetAssignmentDetailsAsync(assignment.Id);
        Assert.Null(details!.Value.Route);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorPersistsInlineRouteDataAndReturnsItOnAssignment()
    {
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var shipment = await SeedShipmentAsync();
        var routeData = SampleRouteData(distanceKm: 1720.5, estimatedDurationMinutes: 1860);

        var assignment = await _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id, routeData);

        Assert.NotNull(assignment.RouteId);
        var route = await _coordinator.GetRouteByIdAsync(assignment.RouteId!.Value);
        Assert.NotNull(route);
        Assert.Equal("Origin Address, Hanoi", route!.OriginAddress);
        Assert.Equal("Destination Address, HCMC", route.DestinationAddress);
        Assert.Equal(1720.5, route.DistanceKm);
        Assert.Equal(1860, route.EstimatedDurationMinutes);

        var details = await _coordinator.GetAssignmentDetailsAsync(assignment.Id);
        Assert.NotNull(details!.Value.Route);
        Assert.Equal(route.Id, details.Value.Route!.Id);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorRejectsRouteWithBlankOriginAddress()
    {
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var shipment = await SeedShipmentAsync();
        var routeData = new RouteData("", "Destination Address, HCMC", null, 100, 120);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id, routeData));
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorRejectsRouteWithNonPositiveDistanceWhenProvided()
    {
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var shipment = await SeedShipmentAsync();
        var routeData = new RouteData("Origin Address, Hanoi", "Destination Address, HCMC", null, -5, 120);

        await Assert.ThrowsAsync<ArgumentException>(() =>
            _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id, routeData));
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorLeavesShipmentWarehouseNullWhenNoneProvided()
    {
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var shipment = await SeedShipmentAsync();

        await _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id);

        var updatedShipment = await _shipments.GetByIdAsync(shipment.Id);
        Assert.Null(updatedShipment!.WarehouseId);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorStagesShipmentAtWarehouseWhenProvided()
    {
        var (origin, _) = await SeedWarehousesAsync();
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var shipment = await SeedShipmentAsync(orderWeightKg: 10m);

        await _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id, warehouseId: origin.Id);

        var updatedShipment = await _shipments.GetByIdAsync(shipment.Id);
        Assert.Equal(origin.Id, updatedShipment!.WarehouseId);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorRejectsStagingWhenShipmentWeightExceedsWarehouseCapacity()
    {
        var (origin, _) = await SeedWarehousesAsync();
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var shipment = await SeedShipmentAsync(orderWeightKg: 6000m);

        await Assert.ThrowsAsync<InvalidOperationException>(() =>
            _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id, warehouseId: origin.Id));
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorApprovesPendingAssignment()
    {
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var shipment = await SeedShipmentAsync();

        var assignment = await _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id);
        var approved = await _coordinator.ApproveAssignmentAsync(assignment.Id);

        Assert.Equal(AssignmentStatus.Assigned, approved.Status);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorApprovingAssignmentActivatesOrder()
    {
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var shipment = await SeedShipmentAsync();

        var assignment = await _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id);
        await _coordinator.ApproveAssignmentAsync(assignment.Id);

        var order = await _orders.GetByIdAsync(shipment.OrderId);
        Assert.Equal(OrderStatus.Active, order!.Status);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorRejectsApprovingAlreadyActiveAssignment()
    {
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var shipment = await SeedShipmentAsync();

        var assignment = await _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id);
        await _coordinator.ApproveAssignmentAsync(assignment.Id);

        await Assert.ThrowsAsync<InvalidOperationException>(() => _coordinator.ApproveAssignmentAsync(assignment.Id));
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorRejectsDoubleBookingOfPendingDriver()
    {
        var driver = await SeedDriverAsync();
        var firstVehicle = await SeedVehicleAsync();
        var secondVehicle = await SeedVehicleAsync();
        var firstShipment = await SeedShipmentAsync();
        var secondShipment = await SeedShipmentAsync();

        await _coordinator.CreateAssignmentAsync(new[] { firstShipment.Id }, driver.Id, firstVehicle.Id);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _coordinator.CreateAssignmentAsync(new[] { secondShipment.Id }, driver.Id, secondVehicle.Id));
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorRejectsDoubleBookingOfPendingVehicle()
    {
        var firstDriver = await SeedDriverAsync();
        var secondDriver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var firstShipment = await SeedShipmentAsync();
        var secondShipment = await SeedShipmentAsync();

        await _coordinator.CreateAssignmentAsync(new[] { firstShipment.Id }, firstDriver.Id, vehicle.Id);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _coordinator.CreateAssignmentAsync(new[] { secondShipment.Id }, secondDriver.Id, vehicle.Id));
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorRejectsShipmentAlreadyAssignedToAnotherAssignment()
    {
        var firstDriver = await SeedDriverAsync();
        var secondDriver = await SeedDriverAsync();
        var firstVehicle = await SeedVehicleAsync();
        var secondVehicle = await SeedVehicleAsync();
        var shipment = await SeedShipmentAsync();

        await _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, firstDriver.Id, firstVehicle.Id);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, secondDriver.Id, secondVehicle.Id));
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorAllowsReassignmentAfterDelivery()
    {
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var firstShipment = await SeedShipmentAsync();
        var secondShipment = await SeedShipmentAsync();

        var firstAssignment = await _coordinator.CreateAssignmentAsync(new[] { firstShipment.Id }, driver.Id, vehicle.Id);
        await _coordinator.DeliverAssignmentAsync(firstAssignment.Id);

        var secondAssignment = await _coordinator.CreateAssignmentAsync(new[] { secondShipment.Id }, driver.Id, vehicle.Id);

        Assert.Equal(AssignmentStatus.Pending, secondAssignment.Status);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorFiltersAssignmentsByDriver()
    {
        var firstDriver = await SeedDriverAsync();
        var secondDriver = await SeedDriverAsync();
        var firstVehicle = await SeedVehicleAsync();
        var secondVehicle = await SeedVehicleAsync();
        var firstShipment = await SeedShipmentAsync();
        var secondShipment = await SeedShipmentAsync();

        var assignment = await _coordinator.CreateAssignmentAsync(new[] { firstShipment.Id }, firstDriver.Id, firstVehicle.Id);
        await _coordinator.CreateAssignmentAsync(new[] { secondShipment.Id }, secondDriver.Id, secondVehicle.Id);

        var results = (await _coordinator.GetAssignmentsAsync(status: null, driverId: firstDriver.Id)).ToList();

        Assert.Single(results);
        Assert.Equal(assignment.Id, results[0].Assignment.Id);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorCreatesDeliveryConfirmationForAssignedDriver()
    {
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var shipment = await SeedShipmentAsync();
        var assignment = await _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id);
        await _coordinator.ApproveAssignmentAsync(assignment.Id);

        var confirmation = await _coordinator.CreateDeliveryConfirmationAsync(
            shipment.Id, driver.Id, "Recipient", "signature-data", 21.0, 105.8);

        Assert.Equal(shipment.Id, confirmation.ShipmentId);
        Assert.Equal(driver.Id, confirmation.DriverId);
        var updatedShipment = await _shipments.GetByIdAsync(shipment.Id);
        Assert.Equal(ShipmentStatus.Delivered, updatedShipment!.Status);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorDeliveryConfirmationFulfilsTheOrder()
    {
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var shipment = await SeedShipmentAsync();
        var assignment = await _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id);
        await _coordinator.ApproveAssignmentAsync(assignment.Id);

        await _coordinator.CreateDeliveryConfirmationAsync(
            shipment.Id, driver.Id, "Recipient", "signature-data", 21.0, 105.8);

        var order = await _orders.GetByIdAsync(shipment.OrderId);
        Assert.Equal(OrderStatus.Fulfilled, order!.Status);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorDeliveryConfirmationSetsAssignmentDeliveredAndReleasesResources()
    {
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var shipment = await SeedShipmentAsync();
        var assignment = await _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id);
        await _coordinator.ApproveAssignmentAsync(assignment.Id);

        await _coordinator.CreateDeliveryConfirmationAsync(
            shipment.Id, driver.Id, "Recipient", "signature-data", 21.0, 105.8);

        var updatedAssignment = await _assignments.GetByIdAsync(assignment.Id);
        Assert.Equal(AssignmentStatus.Delivered, updatedAssignment!.Status);
        var updatedDriver = await _drivers.GetByIdAsync(driver.Id);
        Assert.True(updatedDriver!.IsAvailable);
        var updatedVehicle = await _vehicles.GetByIdAsync(vehicle.Id);
        Assert.Equal(VehicleStatus.Available, updatedVehicle!.CurrentStatus);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorCreatesDeliveryConfirmationWithoutGpsCoordinates()
    {
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var shipment = await SeedShipmentAsync();
        var assignment = await _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id);
        await _coordinator.ApproveAssignmentAsync(assignment.Id);

        var confirmation = await _coordinator.CreateDeliveryConfirmationAsync(
            shipment.Id, driver.Id, "Recipient", "signature-data", null, null);

        Assert.Null(confirmation.GpsLatitude);
        Assert.Null(confirmation.GpsLongitude);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorRejectsDeliveryConfirmationFromUnassignedDriver()
    {
        var driver = await SeedDriverAsync();
        var otherDriver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var shipment = await SeedShipmentAsync();
        await _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id);

        await Assert.ThrowsAsync<ArgumentException>(() => _coordinator.CreateDeliveryConfirmationAsync(
            shipment.Id, otherDriver.Id, "Recipient", "signature-data", 21.0, 105.8));
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorReturnsShipmentAddressesAndCustomerContactOnAssignment()
    {
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var (shipment, _) = await SeedShipmentWithCargoAsync();

        var assignment = await _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id);
        var details = await _coordinator.GetAssignmentDetailsAsync(assignment.Id);

        var shipmentData = details!.Value.Shipments.Single();
        Assert.Equal("Customer warehouse, Binh Duong", shipmentData.Shipment.PickupAddress);
        Assert.Equal("Supermarket store, Q1 HCMC", shipmentData.Shipment.DeliveryAddress);
        Assert.Equal("Nguyen Van Khach", shipmentData.CustomerName);
        Assert.Equal("0900000000", shipmentData.CustomerPhone);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorCreatesLoadManifestOnceAndReusesItOnSubsequentFetches()
    {
        var (shipment, cargoes) = await SeedShipmentWithCargoAsync(cargoCount: 2);

        var first = await _coordinator.GetOrCreateLoadManifestAsync(shipment.Id);
        var second = await _coordinator.GetOrCreateLoadManifestAsync(shipment.Id);

        Assert.Equal(2, first.CargoIds.Count);
        Assert.Equal(cargoes.Select(c => c.Id).OrderBy(id => id), first.CargoIds.OrderBy(id => id));
        Assert.Empty(first.LoadedCargoIds);
        Assert.False(first.IsPickupResolved);

        var allManifests = await _loadManifests.GetAllAsync();
        Assert.Single(allManifests.Where(m => m.ShipmentId == shipment.Id));
        Assert.Equal(first.CreatedAt, second.CreatedAt);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorUpdatesLoadedCargoItems()
    {
        var (shipment, cargoes) = await SeedShipmentWithCargoAsync(cargoCount: 2);
        await _coordinator.GetOrCreateLoadManifestAsync(shipment.Id);

        var updated = await _coordinator.UpdateLoadedCargoItemsAsync(shipment.Id, new[] { cargoes[0].Id });

        Assert.Single(updated.LoadedCargoIds);
        Assert.Contains(cargoes[0].Id, updated.LoadedCargoIds);
        Assert.False(updated.IsPickupResolved);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorRejectsLoadedCargoItemNotOnManifest()
    {
        var (shipment, _) = await SeedShipmentWithCargoAsync(cargoCount: 1);
        await _coordinator.GetOrCreateLoadManifestAsync(shipment.Id);

        await Assert.ThrowsAsync<ArgumentException>(
            () => _coordinator.UpdateLoadedCargoItemsAsync(shipment.Id, new[] { Guid.NewGuid() }));
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorRejectsStartingBeforeAllCargoLoaded()
    {
        var (shipment, cargoes) = await SeedShipmentWithCargoAsync(cargoCount: 2);
        await _coordinator.GetOrCreateLoadManifestAsync(shipment.Id);
        await _coordinator.UpdateLoadedCargoItemsAsync(shipment.Id, new[] { cargoes[0].Id });

        await Assert.ThrowsAsync<InvalidOperationException>(() => _coordinator.MarkLoadingCompleteAsync(shipment.Id));
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorMarksLoadingCompleteWhenAllCargoLoaded()
    {
        var (shipment, cargoes) = await SeedShipmentWithCargoAsync(cargoCount: 2);
        await _coordinator.GetOrCreateLoadManifestAsync(shipment.Id);
        await _coordinator.UpdateLoadedCargoItemsAsync(shipment.Id, cargoes.Select(c => c.Id).ToList());

        var completed = await _coordinator.MarkLoadingCompleteAsync(shipment.Id);

        Assert.True(completed.IsPickupResolved);
        var allManifests = await _loadManifests.GetAllAsync();
        Assert.Single(allManifests.Where(m => m.ShipmentId == shipment.Id));
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorResolvesLoadManifestAtDropoffWithoutDuplicatingRow()
    {
        var (shipment, _) = await SeedShipmentWithCargoAsync(cargoCount: 1);
        await _coordinator.GetOrCreateLoadManifestAsync(shipment.Id);

        var resolved = await _coordinator.ResolveLoadManifestAtDropoffAsync(shipment.Id, new List<string> { "1 item missing" });

        Assert.True(resolved.IsDropoffResolved);
        Assert.Equal(new List<string> { "1 item missing" }, resolved.DamagedOrMissingItems);
        var allManifests = (await _loadManifests.GetAllAsync()).Where(m => m.ShipmentId == shipment.Id).ToList();
        Assert.Single(allManifests);
        Assert.True(allManifests[0].IsDropoffResolved);
    }

    private async Task<(Assignment Assignment, Shipment Shipment, List<Cargo> Cargoes)> SeedAssignedAndLoadedShipmentAsync()
    {
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var (shipment, cargoes) = await SeedShipmentWithCargoAsync(cargoCount: 2);

        var assignment = await _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id);
        await _coordinator.ApproveAssignmentAsync(assignment.Id);
        await _coordinator.GetOrCreateLoadManifestAsync(shipment.Id);
        await _coordinator.UpdateLoadedCargoItemsAsync(shipment.Id, cargoes.Select(c => c.Id).ToList());
        await _coordinator.MarkLoadingCompleteAsync(shipment.Id);

        return (assignment, shipment, cargoes);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorMarkingLoadingCompleteSetsAssignmentLoaded()
    {
        var (assignment, _, _) = await SeedAssignedAndLoadedShipmentAsync();

        var updatedAssignment = await _assignments.GetByIdAsync(assignment.Id);
        Assert.Equal(AssignmentStatus.Loaded, updatedAssignment!.Status);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorStartTripSetsShipmentInTransitAndAssignmentDelivering()
    {
        var (assignment, shipment, _) = await SeedAssignedAndLoadedShipmentAsync();

        var updatedShipment = await _coordinator.MarkShipmentInTransitAsync(shipment.Id);

        Assert.Equal(ShipmentStatus.InTransit, updatedShipment.Status);
        var updatedAssignment = await _assignments.GetByIdAsync(assignment.Id);
        Assert.Equal(AssignmentStatus.Delivering, updatedAssignment!.Status);
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorRejectsStartTripBeforeLoadingResolved()
    {
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var (shipment, _) = await SeedShipmentWithCargoAsync(cargoCount: 1);
        var assignment = await _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id);
        await _coordinator.ApproveAssignmentAsync(assignment.Id);
        await _coordinator.GetOrCreateLoadManifestAsync(shipment.Id);

        await Assert.ThrowsAsync<InvalidOperationException>(() => _coordinator.MarkShipmentInTransitAsync(shipment.Id));
    }

    [Fact]
    public async Task FleetAssignmentCoordinatorRequestReallocationRejectsAssignmentAndUnassignsShipment()
    {
        var driver = await SeedDriverAsync();
        var vehicle = await SeedVehicleAsync();
        var shipment = await SeedShipmentAsync();
        var assignment = await _coordinator.CreateAssignmentAsync(new[] { shipment.Id }, driver.Id, vehicle.Id);
        await _coordinator.ApproveAssignmentAsync(assignment.Id);

        await _coordinator.RequestReallocationAsync(assignment.Id);

        var updatedAssignment = await _assignments.GetByIdAsync(assignment.Id);
        Assert.Equal(AssignmentStatus.Rejected, updatedAssignment!.Status);
        var updatedShipment = await _shipments.GetByIdAsync(shipment.Id);
        Assert.Null(updatedShipment!.AssignmentId);
        Assert.Equal(ShipmentStatus.Created, updatedShipment.Status);
        var updatedDriver = await _drivers.GetByIdAsync(driver.Id);
        Assert.True(updatedDriver!.IsAvailable);
        var updatedVehicle = await _vehicles.GetByIdAsync(vehicle.Id);
        Assert.Equal(VehicleStatus.Available, updatedVehicle!.CurrentStatus);
    }

    public void Dispose()
    {
        _context.Dispose();
        _factory.Dispose();
    }
}
