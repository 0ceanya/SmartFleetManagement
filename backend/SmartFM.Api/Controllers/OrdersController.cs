using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using SmartFM.Api.Dtos.Orders;
using SmartFM.Application.Coordinators;
using SmartFM.Domain.Entities;

namespace SmartFM.Api.Controllers;

[ApiController]
[Route("api/orders")]
public class OrdersController : ControllerBase
{
    private readonly OrderFulfilmentCoordinator _coordinator;

    public OrdersController(OrderFulfilmentCoordinator coordinator)
    {
        _coordinator = coordinator;
    }

    [HttpPost]
    [ProducesResponseType(typeof(OrderDetailsResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<OrderDetailsResponse>> PlaceOrder(PlaceOrderRequest request)
    {
        var cargoItems = request.CargoItems
            .Select(item => (item.Description, item.WeightKg, item.VolumeCbm, item.IsHazardous))
            .ToList();

        var (_, order, shipment) = await _coordinator.PlaceOrderAsync(
            request.CustomerName, request.CustomerEmail, request.CustomerPhone, request.OfferingId, request.WarehouseId, cargoItems);

        var response = OrderDetailsResponse.FromEntity(order, new[] { (shipment, (IReadOnlyList<Cargo>)shipment.Cargoes) });
        return CreatedAtAction(nameof(GetOrderById), new { id = order.Id }, response);
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(OrderDetailsResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OrderDetailsResponse>> GetOrderById(Guid id)
    {
        var details = await _coordinator.GetOrderDetailsAsync(id);
        if (details is null)
            return Problem(detail: $"Order {id} not found.", statusCode: StatusCodes.Status404NotFound);
        return Ok(OrderDetailsResponse.FromEntity(details.Value.Order, details.Value.Shipments));
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<OrderSummaryResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<OrderSummaryResponse>>> GetOrders([FromQuery, EmailAddress] string? customerEmail)
    {
        var orders = string.IsNullOrWhiteSpace(customerEmail)
            ? await _coordinator.GetOrdersAsync()
            : await _coordinator.GetOrdersByCustomerEmailAsync(customerEmail);
        return Ok(orders.Select(OrderSummaryResponse.FromEntity));
    }
}
