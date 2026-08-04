using SmartFM.Application.Coordinators;
using SmartFM.Domain.Records;
using SmartFM.Domain.ValueObjects;

namespace SmartFM.Api.Dtos.Audit;

public record AuditRecordResponse(
    Guid Id,
    string EntityType,
    Guid EntityId,
    string? FromStatus,
    string ToStatus,
    string? ChangedBy,
    DateTime CreatedAt,
    string EventType,
    string Description)
{
    public static AuditRecordResponse FromEntity(AuditRecord r)
    {
        var (eventType, description) = RecordCoordinator.DescribeEvent(r);
        return new(r.Id, r.EntityType, r.EntityId, r.FromStatus, r.ToStatus, r.ChangedBy, r.CreatedAt, eventType, description);
    }
}

public record AuditFeedResponse(IEnumerable<AuditRecordResponse> Records, int TotalCount, int Page, int PageSize);

public record NotificationResponse(Guid RecipientId, string Message, DateTime SentAt)
{
    public static NotificationResponse FromEntity(Notification notification) =>
        new(notification.RecipientId, notification.Message, notification.SentAt);
}
