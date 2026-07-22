namespace SmartFM.Domain.ValueObjects;

public record LoadManifest(
    Guid ShipmentId,
    IReadOnlyList<string> CargoDescriptions,
    decimal TotalWeightKg,
    bool ContainsHazardous,
    DateTime CreatedAt);
