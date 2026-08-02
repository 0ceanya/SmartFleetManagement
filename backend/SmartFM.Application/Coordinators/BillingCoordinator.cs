using SmartFM.Application.Abstractions;
using SmartFM.Domain.Entities;
using SmartFM.Domain.Interfaces;
using SmartFM.Domain.Records;
using SmartFM.Domain.ValueObjects;

namespace SmartFM.Application.Coordinators;

public class BillingCoordinator
{
    private readonly IRepository<Invoice> _invoices;
    private readonly IRepository<Payment> _payments;
    private readonly IRepository<Order> _orders;
    private readonly IRepository<Offering> _offerings;
    private readonly IRepository<Shipment> _shipments;
    private readonly IRepository<Receipt> _receipts;
    private readonly IRepository<AuditRecord> _auditRecords;
    private readonly IPaymentGateway _paymentGateway;
    private readonly IUnitOfWork _unitOfWork;

    public BillingCoordinator(
        IRepository<Invoice> invoices,
        IRepository<Payment> payments,
        IRepository<Order> orders,
        IRepository<Offering> offerings,
        IRepository<Shipment> shipments,
        IRepository<Receipt> receipts,
        IRepository<AuditRecord> auditRecords,
        IPaymentGateway paymentGateway,
        IUnitOfWork unitOfWork)
    {
        _invoices = invoices;
        _payments = payments;
        _orders = orders;
        _offerings = offerings;
        _shipments = shipments;
        _receipts = receipts;
        _auditRecords = auditRecords;
        _paymentGateway = paymentGateway;
        _unitOfWork = unitOfWork;
    }

    public Task InitializeBillingSubsystem()
    {
        Console.WriteLine("BillingCoordinator initialized");
        return Task.CompletedTask;
    }

    public async Task<Invoice> GenerateInvoiceAsync(Guid orderId)
    {
        var order = await _orders.GetByIdAsync(orderId)
            ?? throw new InvalidOperationException($"Order {orderId} not found.");
        var offering = await _offerings.GetByIdAsync(order.OfferingId)
            ?? throw new InvalidOperationException($"Offering {order.OfferingId} not found.");

        var invoice = new Invoice(order, offering.BasePrice);
        await _invoices.AddAsync(invoice);
        await _unitOfWork.SaveChangesAsync();
        return invoice;
    }

    public async Task<Receipt> ProcessPaymentAsync(Guid invoiceId, string method, string? walletReference = null)
    {
        var invoice = await _invoices.GetByIdAsync(invoiceId)
            ?? throw new InvalidOperationException($"Invoice {invoiceId} not found.");

        if (invoice.Status == InvoiceStatus.Paid)
            throw new InvalidOperationException($"Invoice {invoiceId} is already paid.");

        Payment payment = method switch
        {
            "Cash" => new CashPayment(invoice.Amount, invoice.Id),
            "Card" => CreateCardPayment(invoice),
            "Digital" => CreateDigitalPayment(invoice, walletReference ?? string.Empty),
            _ => throw new ArgumentException($"Unknown payment method: {method}", nameof(method))
        };

        await _payments.AddAsync(payment);

        invoice.MarkPaid();
        _invoices.Update(invoice);

        await ApproveOrderAsync(invoice.OrderId);

        var gatewayResponse = payment switch
        {
            CardPayment card => card.GatewayResponse,
            DigitalPayment digital => digital.GatewayResponse,
            _ => "N/A"
        };

        var receipt = new Receipt(invoice.Id, invoice.Amount, method, gatewayResponse, DateTime.UtcNow);
        await _receipts.AddAsync(receipt);

        var audit = new AuditRecord
        {
            Action = "PaymentProcessed",
            PerformedBy = "BillingCoordinator",
            Details = $"Invoice {invoice.Id} paid via {method}."
        };
        await _auditRecords.AddAsync(audit);

        await _unitOfWork.SaveChangesAsync();
        return receipt;
    }

    public Task<IEnumerable<Invoice>> GetInvoicesAsync() => _invoices.GetAllAsync();

    public async Task<Invoice?> GetInvoiceByIdAsync(Guid id) => await _invoices.GetByIdAsync(id);

    public Task<IEnumerable<Receipt>> GetReceiptsAsync() => _receipts.GetAllAsync();

    public async Task<Receipt?> GetReceiptByInvoiceIdAsync(Guid invoiceId)
    {
        var receipts = await _receipts.GetAllAsync();
        return receipts.FirstOrDefault(r => r.InvoiceId == invoiceId);
    }

    private CardPayment CreateCardPayment(Invoice invoice)
    {
        var success = _paymentGateway.ProcessPayment(invoice.Amount, invoice.Id.ToString());
        if (!success)
            throw new InvalidOperationException("Card payment failed.");
        Console.WriteLine("Payment processed");
        return new CardPayment(invoice.Amount, invoice.Id, "Payment processed");
    }

    private DigitalPayment CreateDigitalPayment(Invoice invoice, string walletReference)
    {
        var success = _paymentGateway.ProcessPayment(invoice.Amount, invoice.Id.ToString());
        if (!success)
            throw new InvalidOperationException("Digital payment failed.");
        Console.WriteLine("Payment processed");
        return new DigitalPayment(invoice.Amount, invoice.Id, "Payment processed", walletReference);
    }

    private async Task ApproveOrderAsync(Guid orderId)
    {
        var order = await _orders.GetByIdAsync(orderId)
            ?? throw new InvalidOperationException($"Order {orderId} not found.");

        order.SetStatus(OrderStatus.Approved);
        _orders.Update(order);
    }
}
