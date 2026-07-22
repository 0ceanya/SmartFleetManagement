namespace SmartFM.Domain.Entities;

public class Invoice
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid ShipmentId { get; private set; }
    public decimal Amount { get; private set; }
    public string Status { get; private set; } = InvoiceStatus.Unpaid;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    private Invoice() { }

    public Invoice(Shipment shipment, decimal amount)
    {
        ArgumentNullException.ThrowIfNull(shipment);
        if (amount <= 0) throw new ArgumentException("Amount must be positive.", nameof(amount));
        ShipmentId = shipment.Id;
        Amount = amount;
    }

    public void MarkPaid() => Status = InvoiceStatus.Paid;
}
