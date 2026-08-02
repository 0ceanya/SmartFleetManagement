namespace SmartFM.Domain.ValueObjects;

public record LoadManifest(
    Guid ShipmentId,
    IReadOnlyList<Guid> CargoIds,
    IReadOnlyList<string> CargoDescriptions,
    decimal TotalWeightKg,
    bool ContainsHazardous,
    DateTime CreatedAt,
    IReadOnlyList<Guid> LoadedCargoIds,
    bool IsPickupResolved = false,
    bool IsDropoffResolved = false,
    IReadOnlyList<string>? DamagedOrMissingItems = null);
