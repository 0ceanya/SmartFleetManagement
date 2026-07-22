namespace SmartFM.Domain.Entities;

public class Cargo
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid ShipmentId { get; private set; }
    public string Description { get; private set; } = string.Empty;
    public decimal WeightKg { get; private set; }
    public decimal? VolumeCbm { get; private set; }
    public bool IsHazardous { get; private set; }

    private Cargo() { }

    public Cargo(Guid shipmentId, string description, decimal weightKg, decimal? volumeCbm, bool isHazardous)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(description);
        if (weightKg <= 0) throw new ArgumentException("WeightKg must be positive.", nameof(weightKg));
        ShipmentId = shipmentId;
        Description = description;
        WeightKg = weightKg;
        VolumeCbm = volumeCbm;
        IsHazardous = isHazardous;
    }
}
