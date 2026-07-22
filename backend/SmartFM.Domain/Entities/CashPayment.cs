namespace SmartFM.Domain.Entities;

public class CashPayment : Payment
{
    private CashPayment() { }

    public CashPayment(decimal amount, Guid invoiceId)
        : base(amount, invoiceId) { }
}
