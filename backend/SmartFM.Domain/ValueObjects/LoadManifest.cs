namespace SmartFM.Domain.ValueObjects;

public record LoadManifest(
    Guid ShipmentId,
    IReadOnlyList<string> CargoDescriptions,
    decimal TotalWeightKg,
    bool ContainsHazardous,
    DateTime CreatedAt,
    bool IsPickupResolved = false,
    bool IsDropoffResolved = false,
    IReadOnlyList<string>? DamagedOrMissingItems = null);
