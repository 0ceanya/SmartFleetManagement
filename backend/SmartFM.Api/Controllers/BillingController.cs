using Microsoft.AspNetCore.Mvc;
using SmartFM.Api.Dtos.Billing;
using SmartFM.Application.Coordinators;

namespace SmartFM.Api.Controllers;

[ApiController]
[Route("api/billing")]
public class BillingController : ControllerBase
{
    private readonly BillingCoordinator _coordinator;

    public BillingController(BillingCoordinator coordinator)
    {
        _coordinator = coordinator;
    }

    [HttpPost("invoices")]
    [ProducesResponseType(typeof(InvoiceResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InvoiceResponse>> GenerateInvoice(GenerateInvoiceRequest request)
    {
        var invoice = await _coordinator.GenerateInvoiceAsync(request.OrderId);
        var response = InvoiceResponse.FromEntity(invoice);
        return CreatedAtAction(nameof(GetInvoiceById), new { id = invoice.Id }, response);
    }

    [HttpGet("invoices")]
    [ProducesResponseType(typeof(IEnumerable<InvoiceResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<InvoiceResponse>>> GetInvoices()
    {
        var invoices = await _coordinator.GetInvoicesAsync();
        return Ok(invoices.Select(InvoiceResponse.FromEntity));
    }

    [HttpGet("invoices/{id:guid}")]
    [ProducesResponseType(typeof(InvoiceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<InvoiceResponse>> GetInvoiceById(Guid id)
    {
        var invoice = await _coordinator.GetInvoiceByIdAsync(id);
        if (invoice is null)
            return Problem(detail: $"Invoice {id} not found.", statusCode: StatusCodes.Status404NotFound);
        return Ok(InvoiceResponse.FromEntity(invoice));
    }

    [HttpPost("invoices/{id:guid}/pay")]
    [ProducesResponseType(typeof(PayInvoiceResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<PayInvoiceResponse>> PayInvoice(Guid id, PayInvoiceRequest request)
    {
        var receipt = await _coordinator.ProcessPaymentAsync(id, request.PaymentMethod, request.WalletReference);
        return Ok(PayInvoiceResponse.FromReceipt(receipt));
    }

    [HttpGet("invoices/{id:guid}/receipt")]
    [ProducesResponseType(typeof(ReceiptResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<ReceiptResponse>> GetReceiptByInvoiceId(Guid id)
    {
        var receipt = await _coordinator.GetReceiptByInvoiceIdAsync(id);
        if (receipt is null)
            return Problem(detail: $"Receipt for invoice {id} not found.", statusCode: StatusCodes.Status404NotFound);
        return Ok(ReceiptResponse.FromEntity(receipt));
    }
}
