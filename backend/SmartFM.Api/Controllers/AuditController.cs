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
    /// Get all audit records, optionally filtered by entity type and ID.
    /// Example: GET /api/audit/records?entityType=Order&amp;entityId={id}
    /// </summary>
    [HttpGet("records")]
    [ProducesResponseType(typeof(IEnumerable<AuditRecordResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AuditRecordResponse>>> GetAuditRecords(
        [FromQuery] string? entityType,
        [FromQuery] Guid? entityId)
    {
        IEnumerable<AuditRecord> records = (entityType is not null && entityId is not null)
            ? await _coordinator.GetAuditRecordsByEntityAsync(entityType, entityId.Value)
            : await _coordinator.GetAuditRecordsAsync();

        return Ok(records.Select(AuditRecordResponse.FromEntity));
    }

    [HttpGet("notifications")]
    [ProducesResponseType(typeof(IEnumerable<NotificationResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<NotificationResponse>>> GetNotifications()
    {
        var notifications = await _coordinator.GetNotificationsAsync();
        return Ok(notifications.Select(NotificationResponse.FromEntity));
    }
}
