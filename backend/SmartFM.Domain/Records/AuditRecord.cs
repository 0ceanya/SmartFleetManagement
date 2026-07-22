namespace SmartFM.Domain.Records;

public record AuditRecord : Record
{
    public string Action { get; init; } = string.Empty;
    public string PerformedBy { get; init; } = string.Empty;
    public string Details { get; init; } = string.Empty;
}
