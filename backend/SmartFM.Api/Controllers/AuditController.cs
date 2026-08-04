using Microsoft.AspNetCore.Mvc;
using SmartFM.Api.Dtos.Audit;
using SmartFM.Application.Coordinators;
using SmartFM.Domain.Records;

namespace SmartFM.Api.Controllers;

[ApiController]
[Route("api/audit")]
public class AuditController : ControllerBase
{
    private readonly RecordCoordinator _coordinator;

    public AuditController(RecordCoordinator coordinator)
    {
        _coordinator = coordinator;
    }

    /// <summary>
    /// Get audit records, newest-first, optionally filtered by entity type/ID, event type, and date
    /// range. Example: GET /api/audit/records?entityType=Order&amp;entityId={id}
    /// The "after" cursor (a timestamp) supports notification-style polling for new records.
    /// </summary>
    [HttpGet("records")]
    [ProducesResponseType(typeof(AuditFeedResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AuditFeedResponse>> GetAuditRecords(
        [FromQuery] string? entityType,
        [FromQuery] Guid? entityId,
        [FromQuery] string? eventType,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] DateTime? after,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50)
    {
        var (records, totalCount) = await _coordinator.QueryAuditRecordsAsync(
            entityType, entityId, eventType, from, to, after, page, pageSize);

        return Ok(new AuditFeedResponse(records.Select(AuditRecordResponse.FromEntity), totalCount, page, pageSize));
    }

    [HttpGet("notifications")]
    [ProducesResponseType(typeof(IEnumerable<NotificationResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<NotificationResponse>>> GetNotifications()
    {
        var notifications = await _coordinator.GetNotificationsAsync();
        return Ok(notifications.Select(NotificationResponse.FromEntity));
    }
}
