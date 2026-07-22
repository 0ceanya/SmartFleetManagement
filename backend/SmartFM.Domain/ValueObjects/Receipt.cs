namespace SmartFM.Domain.ValueObjects;

public record Receipt(
    Guid InvoiceId,
    decimal AmountPaid,
    string PaymentMethod,
    string GatewayResponse,
    DateTime IssuedAt);
