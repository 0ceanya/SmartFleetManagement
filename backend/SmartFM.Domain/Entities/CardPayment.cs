namespace SmartFM.Domain.Entities;

public class CardPayment : Payment
{
    public string GatewayResponse { get; private set; } = string.Empty;

    private CardPayment() { }

    public CardPayment(decimal amount, Guid invoiceId, string gatewayResponse)
        : base(amount, invoiceId)
    {
        GatewayResponse = gatewayResponse;
    }
}
