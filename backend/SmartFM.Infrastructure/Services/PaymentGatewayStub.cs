using SmartFM.Domain.Interfaces;

namespace SmartFM.Infrastructure.Services;

public class PaymentGatewayStub : IPaymentGateway
{
    public string ProcessPayment(decimal amount, string reference) => "Payment processed";
}
