using SmartFM.Domain.Interfaces;

namespace SmartFM.Infrastructure.Services;

public class PaymentGatewayStub : IPaymentGateway
{
    public bool ProcessPayment(decimal amount, string reference) => true;
}
