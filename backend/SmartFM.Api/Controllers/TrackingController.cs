using Microsoft.AspNetCore.Mvc;
using SmartFM.Api.Dtos.Tracking;
using SmartFM.Application.Coordinators;
using SmartFM.Domain.Records;

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

    [HttpGet("records")]
    [ProducesResponseType(typeof(IEnumerable<TrackingRecordResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TrackingRecordResponse>>> GetTrackingRecords(
        [FromQuery] string? entityType,
        [FromQuery] Guid? entityId)
    {
        IEnumerable<TrackingRecord> records = (entityType is not null && entityId is not null)
            ? await _coordinator.GetTrackingRecordsByEntityAsync(entityType, entityId.Value)
            : await _coordinator.GetTrackingRecordsAsync();

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
