using SmartFM.Application.Abstractions;
using SmartFM.Domain.Entities;

namespace SmartFM.Application.Coordinators;

public record CargoData(string Description, decimal WeightKg, decimal? VolumeCbm, bool IsHazardous);

public class OrderFulfilmentCoordinator
{
    private readonly IRepository<Customer> _customers;
    private readonly IRepository<Order> _orders;
    private readonly IRepository<Shipment> _shipments;
    private readonly IRepository<Cargo> _cargoes;
    private readonly IRepository<Offering> _offerings;
    private readonly IRepository<Assignment> _assignments;
    private readonly IRepository<Invoice> _invoices;
    private readonly IUnitOfWork _unitOfWork;

    public OrderFulfilmentCoordinator(
        IRepository<Customer> customers,
        IRepository<Order> orders,
        IRepository<Shipment> shipments,
        IRepository<Cargo> cargoes,
        IRepository<Offering> offerings,
        IRepository<Assignment> assignments,
        IRepository<Invoice> invoices,
        IUnitOfWork unitOfWork)
    {
        _customers = customers;
        _orders = orders;
        _shipments = shipments;
        _cargoes = cargoes;
        _offerings = offerings;
        _assignments = assignments;
        _invoices = invoices;
        _unitOfWork = unitOfWork;
    }

    public Task InitializeOrderSubsystem()
    {
        Console.WriteLine("OrderFulfilmentCoordinator initialized");
        return Task.CompletedTask;
    }

    public async Task<Customer> RegisterCustomerAsync(string name, string email, string phone)
    {
        var customer = new Customer(name, email, phone);
        await _customers.AddAsync(customer);
        await _unitOfWork.SaveChangesAsync();
        return customer;
    }

    public Task<IEnumerable<Customer>> GetCustomersAsync() => _customers.GetAllAsync();

    public async Task<Customer?> GetCustomerByIdAsync(Guid id) => await _customers.GetByIdAsync(id);

    public async Task<(Order order, Shipment shipment)> CreateOrderAsync(Guid customerId, Guid offeringId, string pickupAddress, string deliveryAddress)
    {
        var customer = await _customers.GetByIdAsync(customerId)
            ?? throw new InvalidOperationException($"Customer {customerId} not found.");
        var offering = await _offerings.GetByIdAsync(offeringId)
            ?? throw new InvalidOperationException($"Offering {offeringId} not found.");

        var order = new Order(customer, offering);
        var shipment = new Shipment(order, pickupAddress, deliveryAddress);
        order.AttachShipment(shipment);

        var invoice = new Invoice(order, offering.BasePrice);

        await _orders.AddAsync(order);
        await _shipments.AddAsync(shipment);
        await _invoices.AddAsync(invoice);
        await _unitOfWork.SaveChangesAsync();

        return (order, shipment);
    }

    public async Task<Cargo> AddCargoAsync(Guid orderId, string description, decimal weightKg, decimal? volumeCbm, bool isHazardous)
    {
        var order = await _orders.GetByIdAsync(orderId)
            ?? throw new InvalidOperationException($"Order {orderId} not found.");
        var offering = await _offerings.GetByIdAsync(order.OfferingId)
            ?? throw new InvalidOperationException("Offering not found for order.");

        ValidateCargoAgainstOffering(offering, weightKg, volumeCbm);

        var cargo = new Cargo(order.Id, description, weightKg, volumeCbm, isHazardous);
        order.AddCargo(cargo);
        await _cargoes.AddAsync(cargo);

        await _unitOfWork.SaveChangesAsync();
        return cargo;
    }

    public async Task<(Customer customer, Order order, Shipment shipment)> PlaceOrderAsync(
        string customerName,
        string customerEmail,
        string customerPhone,
        Guid offeringId,
        string pickupAddress,
        string deliveryAddress,
        IReadOnlyList<(string Description, decimal WeightKg, decimal? VolumeCbm, bool IsHazardous)> cargoItems,
        decimal? orderWeightKg = null)
    {
        var convertedCargoData = cargoItems.Select(c => new CargoData(c.Description, c.WeightKg, c.VolumeCbm, c.IsHazardous)).ToList();
        return await PlaceOrderAsync(customerName, customerEmail, customerPhone, offeringId, pickupAddress, deliveryAddress, convertedCargoData, orderWeightKg);
    }

    public async Task<(Customer customer, Order order, Shipment shipment)> PlaceOrderAsync(
        string customerName,
        string customerEmail,
        string customerPhone,
        Guid offeringId,
        string pickupAddress,
        string deliveryAddress,
        IReadOnlyList<CargoData> cargoItems,
        decimal? orderWeightKg = null)
    {
        var offering = await _offerings.GetByIdAsync(offeringId)
            ?? throw new InvalidOperationException($"Offering {offeringId} not found.");

        if (cargoItems == null || cargoItems.Count == 0)
            throw new ArgumentException("Order must contain at least one cargo item.", nameof(cargoItems));

        var totalCargoWeightKg = cargoItems.Sum(c => c.WeightKg);

        ValidateOrderWeight(orderWeightKg, totalCargoWeightKg);

        var customer = await FindCustomerByEmailAsync(customerEmail);
        if (customer is null)
        {
            customer = new Customer(customerName, customerEmail, customerPhone);
            await _customers.AddAsync(customer);
        }

        var order = new Order(customer, offering, totalCargoWeightKg);
        var shipment = new Shipment(order, pickupAddress, deliveryAddress);
        order.AttachShipment(shipment);

        var invoice = new Invoice(order, offering.BasePrice);

        await _orders.AddAsync(order);
        await _shipments.AddAsync(shipment);
        await _invoices.AddAsync(invoice);

        await CreateCargoesAsync(order, offering, cargoItems);

        await _unitOfWork.SaveChangesAsync();
        return (customer, order, shipment);
    }

    public async Task<Order?> GetOrderByIdAsync(Guid id) => await _orders.GetByIdAsync(id);

    public Task<IEnumerable<Order>> GetOrdersAsync() => _orders.GetAllAsync();

    public async Task<Shipment?> GetShipmentByIdAsync(Guid id) => await _shipments.GetByIdAsync(id);

    public Task<IEnumerable<Shipment>> GetShipmentsAsync() => _shipments.GetAllAsync();

    public async Task<(Order Order, IReadOnlyList<Cargo> Cargoes, IReadOnlyList<Shipment> Shipments, Invoice? Invoice)?> GetOrderDetailsAsync(Guid id)
    {
        var order = await _orders.GetByIdAsync(id);
        if (order is null)
            return null;

        var shipments = await _shipments.GetAllAsync();
        var orderShipments = shipments.Where(s => s.OrderId == order.Id).ToList();

        var allCargoes = await _cargoes.GetAllAsync();
        var orderCargoes = allCargoes.Where(c => c.OrderId == order.Id).ToList();

        var allInvoices = await _invoices.GetAllAsync();
        var orderInvoice = allInvoices.FirstOrDefault(i => i.OrderId == order.Id);

        return (order, orderCargoes, orderShipments, orderInvoice);
    }

    public async Task<IEnumerable<Order>> GetOrdersByCustomerEmailAsync(string email)
    {
        var customer = await FindCustomerByEmailAsync(email);
        if (customer is null)
            return Enumerable.Empty<Order>();

        var orders = await _orders.GetAllAsync();
        return orders.Where(o => o.CustomerId == customer.Id);
    }

    public async Task<Order> MarkOrderFulfilledAsync(Guid orderId)
    {
        var order = await _orders.GetByIdAsync(orderId)
            ?? throw new InvalidOperationException($"Order {orderId} not found.");

        order.Fulfil();
        _orders.Update(order);

        await _unitOfWork.SaveChangesAsync();
        return order;
    }

    public async Task<Order> CancelOrderAsync(Guid orderId)
    {
        var order = await _orders.GetByIdAsync(orderId)
            ?? throw new InvalidOperationException($"Order {orderId} not found.");

        var hasDispatchedShipment = await HasDispatchedShipmentAsync(order.Id);
        order.Cancel(hasDispatchedShipment);
        _orders.Update(order);

        await _unitOfWork.SaveChangesAsync();
        return order;
    }

    private async Task<bool> HasDispatchedShipmentAsync(Guid orderId)
    {
        var shipments = await _shipments.GetAllAsync();
        var assignmentIds = shipments
            .Where(s => s.OrderId == orderId && s.AssignmentId is not null)
            .Select(s => s.AssignmentId!.Value)
            .ToHashSet();

        if (assignmentIds.Count == 0)
            return false;

        var assignments = await _assignments.GetAllAsync();
        return assignments.Any(a => assignmentIds.Contains(a.Id) && a.Status is AssignmentStatus.Assigned or AssignmentStatus.Loaded or AssignmentStatus.Delivering);
    }

    private async Task<Customer?> FindCustomerByEmailAsync(string email)
    {
        var customers = await _customers.GetAllAsync();
        return customers.FirstOrDefault(c => string.Equals(c.Email, email, StringComparison.OrdinalIgnoreCase));
    }

    private async Task CreateCargoesAsync(
        Order order,
        Offering offering,
        IReadOnlyList<CargoData> cargoItems)
    {
        foreach (var item in cargoItems)
        {
            ValidateCargoAgainstOffering(offering, item.WeightKg, item.VolumeCbm);

            var cargo = new Cargo(order.Id, item.Description, item.WeightKg, item.VolumeCbm, item.IsHazardous);
            order.AddCargo(cargo);
            await _cargoes.AddAsync(cargo);
        }
    }

    private static void ValidateCargoAgainstOffering(Offering offering, decimal weightKg, decimal? volumeCbm)
    {
        if (weightKg <= 0)
            throw new ArgumentException("WeightKg must be positive.", nameof(weightKg));
        if (weightKg > offering.MaxWeightKg)
            throw new InvalidOperationException($"WeightKg {weightKg} exceeds offering limit of {offering.MaxWeightKg}.");
        if (volumeCbm.HasValue && volumeCbm.Value > offering.MaxVolumeCbm)
            throw new InvalidOperationException($"VolumeCbm {volumeCbm} exceeds offering limit of {offering.MaxVolumeCbm}.");
    }

    private static void ValidateOrderWeight(decimal? orderWeightKg, decimal cargoWeightKg)
    {
        if (orderWeightKg.HasValue && orderWeightKg.Value != cargoWeightKg)
            throw new InvalidOperationException(
                $"Order weight {orderWeightKg.Value}kg must match the combined cargo weight of {cargoWeightKg}kg.");
    }
}
