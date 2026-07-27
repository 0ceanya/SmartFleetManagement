namespace SmartFM.Domain.Entities;

public class Order
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid CustomerId { get; private set; }
    public Guid OfferingId { get; private set; }
    public string Status { get; private set; } = OrderStatus.Pending;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public List<Shipment> Shipments { get; private set; } = [];

    private Order() { }

    public Order(Customer customer, Offering offering)
    {
        ArgumentNullException.ThrowIfNull(customer);
        ArgumentNullException.ThrowIfNull(offering);
        CustomerId = customer.Id;
        OfferingId = offering.Id;
    }

    public void AttachShipment(Shipment shipment)
    {
        ArgumentNullException.ThrowIfNull(shipment);
        Shipments.Add(shipment);
        Status = OrderStatus.PendingPayment;
    }

    public void SetStatus(string status) => Status = status;
}
