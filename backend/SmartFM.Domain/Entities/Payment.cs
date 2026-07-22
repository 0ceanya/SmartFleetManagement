namespace SmartFM.Domain.Entities;

public abstract class Payment
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public decimal Amount { get; private set; }
    public DateTime PaidAt { get; private set; } = DateTime.UtcNow;
    public Guid InvoiceId { get; private set; }

    protected Payment() { }

    protected Payment(decimal amount, Guid invoiceId)
    {
        if (amount <= 0) throw new ArgumentException("Amount must be positive.", nameof(amount));
        Amount = amount;
        InvoiceId = invoiceId;
    }
}
