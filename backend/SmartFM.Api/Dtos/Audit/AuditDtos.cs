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
    DateTime CreatedAt)
{
    public static AuditRecordResponse FromEntity(AuditRecord r) =>
        new(r.Id, r.EntityType, r.EntityId, r.FromStatus, r.ToStatus, r.ChangedBy, r.CreatedAt);
}

public record NotificationResponse(Guid RecipientId, string Message, DateTime SentAt)
{
    public static NotificationResponse FromEntity(Notification notification) =>
        new(notification.RecipientId, notification.Message, notification.SentAt);
}
