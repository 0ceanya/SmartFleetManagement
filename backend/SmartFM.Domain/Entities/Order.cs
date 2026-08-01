namespace SmartFM.Domain.Entities;

public class Order
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid CustomerId { get; private set; }
    public Guid OfferingId { get; private set; }
    public decimal OrderWeightKg { get; private set; }
    public string Status { get; private set; } = OrderStatus.Pending;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public List<Cargo> Cargoes { get; private set; } = [];
    public List<Shipment> Shipments { get; private set; } = [];

    private Order() { }

    public Order(Customer customer, Offering offering, decimal orderWeightKg = 0m)
    {
        ArgumentNullException.ThrowIfNull(customer);
        ArgumentNullException.ThrowIfNull(offering);
        CustomerId = customer.Id;
        OfferingId = offering.Id;
        OrderWeightKg = orderWeightKg;
    }

    public void AddCargo(Cargo cargo)
    {
        ArgumentNullException.ThrowIfNull(cargo);
        Cargoes.Add(cargo);
        SetOrderWeight(Cargoes.Sum(c => c.WeightKg));
    }

    public void SetOrderWeight(decimal weightKg)
    {
        if (weightKg < 0) throw new ArgumentException("Order weight cannot be negative.", nameof(weightKg));
        OrderWeightKg = weightKg;
    }

    public void AttachShipment(Shipment shipment)
    {
        ArgumentNullException.ThrowIfNull(shipment);
        Shipments.Add(shipment);
        Status = OrderStatus.PendingPayment;
    }

    public void SetStatus(string status) => Status = status;

    public void Fulfil()
    {
        if (Status != OrderStatus.Approved)
            throw new InvalidOperationException($"Cannot fulfil order in status '{Status}'.");
        Status = OrderStatus.Fulfilled;
    }

    public void Cancel(bool hasDispatchedShipment)
    {
        if (Status is not (OrderStatus.PendingPayment or OrderStatus.Approved))
            throw new InvalidOperationException($"Cannot cancel order in status '{Status}'.");
        if (hasDispatchedShipment)
            throw new InvalidOperationException("Cannot cancel an order that has already been dispatched.");
        Status = OrderStatus.Cancelled;
    }
}
