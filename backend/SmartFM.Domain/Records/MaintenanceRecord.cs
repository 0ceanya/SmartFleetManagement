namespace SmartFM.Domain.Records;

public record MaintenanceRecord : Record
{
    public Guid VehicleId { get; init; }
    public string Description { get; init; } = string.Empty;
    public DateTime ScheduledAt { get; init; }
}
