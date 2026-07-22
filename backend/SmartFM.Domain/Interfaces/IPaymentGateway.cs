namespace SmartFM.Domain.Interfaces;

public interface IPaymentGateway
{
    string ProcessPayment(decimal amount, string reference);
}
