using SmartFM.Application.Coordinators;
using SmartFM.Domain.Entities;
using SmartFM.Domain.Records;
using SmartFM.Domain.ValueObjects;
using SmartFM.Infrastructure.Persistence;
using SmartFM.Infrastructure.Persistence.Repositories;
using SmartFM.Tests.TestSupport;
using Xunit;

namespace SmartFM.Tests.Coordinators;

public class BillingCoordinatorTests : IDisposable
{
    private readonly InMemoryDbContextFactory _factory = new();
    private readonly SmartFMDbContext _context;
    private readonly Repository<Customer> _customers;
    private readonly Repository<Offering> _offerings;
    private readonly Repository<Order> _orders;
    private readonly Repository<Shipment> _shipments;

    public BillingCoordinatorTests()
    {
        _context = _factory.CreateContext();
        _customers = new Repository<Customer>(_context);
        _offerings = new Repository<Offering>(_context);
        _orders = new Repository<Order>(_context);
        _shipments = new Repository<Shipment>(_context);
    }

    private BillingCoordinator CreateCoordinator(FakePaymentGateway gateway)
    {
        var unitOfWork = new UnitOfWork(_context);
        var auditCoordinator = new RecordCoordinator(
            new Repository<Domain.Records.AuditRecord>(_context),
            new Repository<Notification>(_context),
            new Repository<Domain.Records.IncidentRecord>(_context),
            new Repository<Assignment>(_context),
            new Repository<Shipment>(_context),
            () => null!,  // incident methods not invoked in billing tests
            unitOfWork);
        return new(
            new Repository<Invoice>(_context),
            new Repository<Payment>(_context),
            _orders,
            _offerings,
            _shipments,
            new Repository<Receipt>(_context),
            auditCoordinator,
            gateway,
            unitOfWork);
    }

    private async Task<Order> SeedOrderWithShipmentAsync()
    {
        var customer = new Customer("Nguyen Van Khach", "khach@example.com", "0900000000");
        await _customers.AddAsync(customer);
        var offering = new Offering("Light Delivery", "Small parcels", 150000m, 1000m, 3m, "Light");
        await _offerings.AddAsync(offering);
        var order = new Order(customer, offering);
        var shipment = new Shipment(order, "Customer warehouse, Binh Duong", "Supermarket store, Q1 HCMC");
        order.AttachShipment(shipment);
        await _orders.AddAsync(order);
        await _shipments.AddAsync(shipment);
        await _context.SaveChangesAsync();
        return order;
    }

    [Fact]
    public async Task BillingCoordinatorGeneratesInvoiceFromOrder()
    {
        var order = await SeedOrderWithShipmentAsync();
        var coordinator = CreateCoordinator(new FakePaymentGateway(true));

        var invoice = await coordinator.GenerateInvoiceAsync(order.Id);

        Assert.Equal(150000m, invoice.Amount);
        Assert.Equal(InvoiceStatus.Unpaid, invoice.Status);

        var audits = _context.Set<AuditRecord>().ToList();
        Assert.Contains(audits, a => a.EntityType == "Invoice" && a.EntityId == invoice.Id
            && a.FromStatus == null && a.ToStatus == InvoiceStatus.Unpaid && a.ChangedBy == "Staff");
    }

    [Fact]
    public async Task BillingCoordinatorProcessesCashPaymentWithoutCallingGateway()
    {
        var order = await SeedOrderWithShipmentAsync();
        var gateway = new FakePaymentGateway(true);
        var coordinator = CreateCoordinator(gateway);
        var invoice = await coordinator.GenerateInvoiceAsync(order.Id);

        var receipt = await coordinator.ProcessPaymentAsync(invoice.Id, "Cash");

        Assert.Equal(0, gateway.CallCount);
        Assert.Equal("Cash", receipt.PaymentMethod);
    }

    [Fact]
    public async Task BillingCoordinatorProcessesCardPaymentThroughGatewayAndApprovesOrder()
    {
        var order = await SeedOrderWithShipmentAsync();
        var gateway = new FakePaymentGateway(true);
        var coordinator = CreateCoordinator(gateway);
        var invoice = await coordinator.GenerateInvoiceAsync(order.Id);

        var receipt = await coordinator.ProcessPaymentAsync(invoice.Id, "Card");

        Assert.Equal(1, gateway.CallCount);
        var audits = _context.Set<AuditRecord>().ToList();
        Assert.Contains(audits, a => a.EntityType == "Invoice" && a.ToStatus == "Paid" && a.ChangedBy == "Customer");
        Assert.Contains(audits, a => a.EntityType == "Order" && a.EntityId == order.Id
            && a.ToStatus == OrderStatus.Approved && a.ChangedBy == "System");
        Assert.Equal("Payment processed", receipt.GatewayResponse);
        var updatedOrder = await _orders.GetByIdAsync(order.Id);
        Assert.Equal(OrderStatus.Approved, updatedOrder!.Status);
    }

    [Fact]
    public async Task BillingCoordinatorRejectsCardPaymentWhenGatewayFails()
    {
        var order = await SeedOrderWithShipmentAsync();
        var gateway = new FakePaymentGateway(false);
        var coordinator = CreateCoordinator(gateway);
        var invoice = await coordinator.GenerateInvoiceAsync(order.Id);

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => coordinator.ProcessPaymentAsync(invoice.Id, "Card"));

        Assert.Empty(_context.Set<Receipt>().ToList());
    }

    [Fact]
    public async Task BillingCoordinatorRejectsPaymentOnAlreadyPaidInvoice()
    {
        var order = await SeedOrderWithShipmentAsync();
        var gateway = new FakePaymentGateway(true);
        var coordinator = CreateCoordinator(gateway);
        var invoice = await coordinator.GenerateInvoiceAsync(order.Id);
        await coordinator.ProcessPaymentAsync(invoice.Id, "Cash");

        await Assert.ThrowsAsync<InvalidOperationException>(
            () => coordinator.ProcessPaymentAsync(invoice.Id, "Cash"));
    }

    public void Dispose()
    {
        _context.Dispose();
        _factory.Dispose();
    }
}
