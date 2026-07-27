using System.ComponentModel.DataAnnotations;
using SmartFM.Domain.Entities;
using SmartFM.Domain.ValueObjects;

namespace SmartFM.Api.Dtos.Billing;

public record GenerateInvoiceRequest
{
    [Required]
    public Guid OrderId { get; init; }
}

public record InvoiceResponse(Guid Id, Guid ShipmentId, decimal Amount, string Status, DateTime CreatedAt)
{
    public static InvoiceResponse FromEntity(Invoice invoice) =>
        new(invoice.Id, invoice.ShipmentId, invoice.Amount, invoice.Status, invoice.CreatedAt);
}

public record PayInvoiceRequest : IValidatableObject
{
    [Required, AllowedValues("Cash", "Card", "Digital")]
    public string PaymentMethod { get; init; } = string.Empty;

    public string? WalletReference { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (PaymentMethod == "Digital" && string.IsNullOrWhiteSpace(WalletReference))
            yield return new ValidationResult("WalletReference is required for Digital payments.", [nameof(WalletReference)]);
    }
}

public record ReceiptResponse(Guid InvoiceId, decimal AmountPaid, string PaymentMethod, string GatewayResponse, DateTime IssuedAt)
{
    public static ReceiptResponse FromEntity(Receipt receipt) =>
        new(receipt.InvoiceId, receipt.AmountPaid, receipt.PaymentMethod, receipt.GatewayResponse, receipt.IssuedAt);
}

public record PayInvoiceResponse(Guid InvoiceId, decimal AmountPaid, string PaymentMethod, string GatewayResponse, DateTime IssuedAt, string Message)
{
    public static PayInvoiceResponse FromReceipt(Receipt receipt) =>
        new(receipt.InvoiceId, receipt.AmountPaid, receipt.PaymentMethod, receipt.GatewayResponse, receipt.IssuedAt, "Payment processed");
}
