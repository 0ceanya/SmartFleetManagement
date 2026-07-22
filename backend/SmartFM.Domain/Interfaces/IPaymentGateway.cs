namespace SmartFM.Domain.Interfaces;

public interface IPaymentGateway
{
    bool ProcessPayment(decimal amount, string reference);
}
