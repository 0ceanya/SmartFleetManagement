namespace SmartFM.Domain.Entities;

public class DigitalPayment : Payment
{
    public string GatewayResponse { get; private set; } = string.Empty;
    public string DigitalWalletReference { get; private set; } = string.Empty;

    private DigitalPayment() { }

    public DigitalPayment(decimal amount, Guid invoiceId, string gatewayResponse, string walletReference)
        : base(amount, invoiceId)
    {
        GatewayResponse = gatewayResponse;
        DigitalWalletReference = walletReference;
    }
}
