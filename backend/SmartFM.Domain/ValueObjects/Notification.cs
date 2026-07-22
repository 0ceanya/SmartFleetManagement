namespace SmartFM.Domain.ValueObjects;

public record Notification(
    Guid RecipientId,
    string Message,
    DateTime SentAt);
