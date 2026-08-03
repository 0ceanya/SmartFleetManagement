namespace SmartFM.Domain.Records;

// GPS waypoint records for mock/demo purposes — shows how vehicle tracking would work.
// Written only by seed data, not wired into real business operations.
public record TrackingRecord : Record
{
    public Guid VehicleId { get; init; }
    public Guid? AssignmentId { get; init; }
    public double Lat { get; init; }
    public double Lon { get; init; }
    public string? Waypoint { get; init; }  // e.g. "Hanoi Warehouse", "Highway 1A", "Customer Site"
}
