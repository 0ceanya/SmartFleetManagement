namespace SmartFM.Domain.Records;

public record AuditRecord : Record
{
    public string EntityType { get; init; } = string.Empty;  // "Order", "Assignment", "Invoice", "Driver"
    public Guid EntityId { get; init; }
    public string? FromStatus { get; init; }
    public string ToStatus { get; init; } = string.Empty;
    public string? ChangedBy { get; init; }
}
