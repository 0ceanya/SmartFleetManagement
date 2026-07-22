namespace SmartFM.Domain.ValueObjects;

public record DeliveryConfirmation(
    Guid ShipmentId,
    Guid DriverId,
    string RecipientName,
    DateTime ConfirmedAt);
