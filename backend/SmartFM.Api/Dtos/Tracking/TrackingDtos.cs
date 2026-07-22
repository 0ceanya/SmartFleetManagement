using SmartFM.Domain.Records;
using SmartFM.Domain.ValueObjects;

namespace SmartFM.Api.Dtos.Tracking;

public record TrackingRecordResponse(Guid Id, Guid VehicleId, Guid ShipmentId, double Lat, double Lon, string Status, DateTime CreatedAt)
{
    public static TrackingRecordResponse FromEntity(TrackingRecord record) =>
        new(record.Id, record.VehicleId, record.ShipmentId, record.Lat, record.Lon, record.Status, record.CreatedAt);
}

public record NotificationResponse(Guid RecipientId, string Message, DateTime SentAt)
{
    public static NotificationResponse FromEntity(Notification notification) =>
        new(notification.RecipientId, notification.Message, notification.SentAt);
}
