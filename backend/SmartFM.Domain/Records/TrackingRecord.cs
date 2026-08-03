namespace SmartFM.Domain.Records;

public record TrackingRecord : Record
{
    public string EntityType { get; init; } = string.Empty;  // "Order", "Assignment", "Invoice", "Driver"
    public Guid EntityId { get; init; }
    public string? FromStatus { get; init; }                  // null on creation (no prior state)
    public string ToStatus { get; init; } = string.Empty;
    public string? ChangedBy { get; init; }
}
