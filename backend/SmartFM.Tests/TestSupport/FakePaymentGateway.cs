using SmartFM.Domain.Interfaces;

namespace SmartFM.Tests.TestSupport;

public sealed class FakePaymentGateway : IPaymentGateway
{
    private readonly string _response;

    public FakePaymentGateway(string response)
    {
        _response = response;
    }

    public int CallCount { get; private set; }

    public string ProcessPayment(decimal amount, string reference)
    {
        CallCount++;
        return _response;
    }
}
