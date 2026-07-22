namespace SmartFM.Domain.Records;

public record IncidentRecord : Record
{
    public Guid VehicleId { get; init; }
    public Guid? ShipmentId { get; init; }
    public string Description { get; init; } = string.Empty;
    public string Severity { get; init; } = string.Empty;
}
