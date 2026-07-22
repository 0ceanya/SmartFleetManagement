namespace SmartFM.Domain.Records;

public record TrackingRecord : Record
{
    public Guid VehicleId { get; init; }
    public Guid ShipmentId { get; init; }
    public double Lat { get; init; }
    public double Lon { get; init; }
    public string Status { get; init; } = string.Empty;
}
