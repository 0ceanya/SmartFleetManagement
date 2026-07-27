namespace SmartFM.Domain.ValueObjects;

public record DeliveryConfirmation(
    Guid ShipmentId,
    Guid DriverId,
    string RecipientName,
    string ProofSignature,
    double GpsLatitude,
    double GpsLongitude,
    DateTime ConfirmedAt);
