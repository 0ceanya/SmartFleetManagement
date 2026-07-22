using SmartFM.Application.Abstractions;
using SmartFM.Domain.Entities;

namespace SmartFM.Application.Coordinators;

public class OrderFulfilmentCoordinator
{
    private readonly IRepository<Customer> _customers;
    private readonly IRepository<Order> _orders;
    private readonly IRepository<Shipment> _shipments;
    private readonly IRepository<Cargo> _cargoes;
    private readonly IRepository<Offering> _offerings;
    private readonly IUnitOfWork _unitOfWork;

    public OrderFulfilmentCoordinator(
        IRepository<Customer> customers,
        IRepository<Order> orders,
        IRepository<Shipment> shipments,
        IRepository<Cargo> cargoes,
        IRepository<Offering> offerings,
        IUnitOfWork unitOfWork)
    {
        _customers = customers;
        _orders = orders;
        _shipments = shipments;
        _cargoes = cargoes;
        _offerings = offerings;
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

    public async Task<(Order order, Shipment shipment)> CreateOrderAsync(Guid customerId, Guid offeringId)
    {
        var customer = await _customers.GetByIdAsync(customerId)
            ?? throw new InvalidOperationException($"Customer {customerId} not found.");
        var offering = await _offerings.GetByIdAsync(offeringId)
            ?? throw new InvalidOperationException($"Offering {offeringId} not found.");

        var order = new Order(customer, offering);
        var shipment = new Shipment(order);
        order.AttachShipment(shipment);

        await _orders.AddAsync(order);
        await _shipments.AddAsync(shipment);
        await _unitOfWork.SaveChangesAsync();

        return (order, shipment);
    }

    public async Task<Cargo> AddCargoAsync(Guid shipmentId, string description, decimal weightKg, decimal? volumeCbm, bool isHazardous)
    {
        var shipment = await _shipments.GetByIdAsync(shipmentId)
            ?? throw new InvalidOperationException($"Shipment {shipmentId} not found.");
        var order = await _orders.GetByIdAsync(shipment.OrderId)
            ?? throw new InvalidOperationException("Order not found for shipment.");
        var offering = await _offerings.GetByIdAsync(order.OfferingId)
            ?? throw new InvalidOperationException("Offering not found for order.");

        ValidateCargoAgainstOffering(offering, weightKg, volumeCbm);

        var cargo = new Cargo(shipment.Id, description, weightKg, volumeCbm, isHazardous);
        shipment.AddCargo(cargo);
        await _cargoes.AddAsync(cargo);
        await _unitOfWork.SaveChangesAsync();
        return cargo;
    }

    public async Task<(Customer customer, Order order, Shipment shipment)> PlaceOrderAsync(
        string customerName,
        string customerEmail,
        string customerPhone,
        Guid offeringId,
        IReadOnlyList<(string Description, decimal WeightKg, decimal? VolumeCbm, bool IsHazardous)> cargoItems)
    {
        var offering = await _offerings.GetByIdAsync(offeringId)
            ?? throw new InvalidOperationException($"Offering {offeringId} not found.");

        var customer = await FindCustomerByEmailAsync(customerEmail);
        if (customer is null)
        {
            customer = new Customer(customerName, customerEmail, customerPhone);
            await _customers.AddAsync(customer);
        }

        var order = new Order(customer, offering);
        var shipment = new Shipment(order);
        order.AttachShipment(shipment);

        await _orders.AddAsync(order);
        await _shipments.AddAsync(shipment);

        foreach (var item in cargoItems)
        {
            ValidateCargoAgainstOffering(offering, item.WeightKg, item.VolumeCbm);
            var cargo = new Cargo(shipment.Id, item.Description, item.WeightKg, item.VolumeCbm, item.IsHazardous);
            shipment.AddCargo(cargo);
            await _cargoes.AddAsync(cargo);
        }

        await _unitOfWork.SaveChangesAsync();
        return (customer, order, shipment);
    }

    public async Task<Order?> GetOrderByIdAsync(Guid id) => await _orders.GetByIdAsync(id);

    public Task<IEnumerable<Order>> GetOrdersAsync() => _orders.GetAllAsync();

    public async Task<Shipment?> GetShipmentByIdAsync(Guid id) => await _shipments.GetByIdAsync(id);

    public Task<IEnumerable<Shipment>> GetShipmentsAsync() => _shipments.GetAllAsync();

    private async Task<Customer?> FindCustomerByEmailAsync(string email)
    {
        var customers = await _customers.GetAllAsync();
        return customers.FirstOrDefault(c => string.Equals(c.Email, email, StringComparison.OrdinalIgnoreCase));
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
}
