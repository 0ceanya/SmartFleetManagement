using SmartFM.Domain.Interfaces;

namespace SmartFM.Tests.TestSupport;

public sealed class FakePaymentGateway : IPaymentGateway
{
    private readonly bool _succeeds;

    public FakePaymentGateway(bool succeeds)
    {
        _succeeds = succeeds;
    }

    public int CallCount { get; private set; }

    public bool ProcessPayment(decimal amount, string reference)
    {
        CallCount++;
        return _succeeds;
    }
}
