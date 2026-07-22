using Microsoft.AspNetCore.Mvc;
using SmartFM.Api.Dtos.Tracking;
using SmartFM.Application.Coordinators;

namespace SmartFM.Api.Controllers;

[ApiController]
[Route("api/tracking")]
public class TrackingController : ControllerBase
{
    private readonly TrackingCoordinator _coordinator;

    public TrackingController(TrackingCoordinator coordinator)
    {
        _coordinator = coordinator;
    }

    [HttpGet("shipments/{shipmentId:guid}/records")]
    [ProducesResponseType(typeof(IEnumerable<TrackingRecordResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TrackingRecordResponse>>> GetTrackingRecordsByShipmentId(Guid shipmentId)
    {
        var records = await _coordinator.GetTrackingRecordsByShipmentIdAsync(shipmentId);
        return Ok(records.Select(TrackingRecordResponse.FromEntity));
    }

    [HttpGet("notifications")]
    [ProducesResponseType(typeof(IEnumerable<NotificationResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<NotificationResponse>>> GetNotifications()
    {
        var notifications = await _coordinator.GetNotificationsAsync();
        return Ok(notifications.Select(NotificationResponse.FromEntity));
    }
}
