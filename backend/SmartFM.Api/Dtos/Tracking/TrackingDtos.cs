using SmartFM.Domain.Records;

namespace SmartFM.Api.Dtos.Tracking;

public record TrackingRecordResponse(
    Guid Id,
    Guid VehicleId,
    Guid? AssignmentId,
    double Lat,
    double Lon,
    string? Waypoint,
    DateTime CreatedAt)
{
    public static TrackingRecordResponse FromEntity(TrackingRecord r) =>
        new(r.Id, r.VehicleId, r.AssignmentId, r.Lat, r.Lon, r.Waypoint, r.CreatedAt);
}
