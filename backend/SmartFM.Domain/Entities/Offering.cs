namespace SmartFM.Domain.Entities;

public class Offering
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Name { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public decimal BasePrice { get; private set; }
    public decimal MaxWeightKg { get; private set; }
    public decimal MaxVolumeCbm { get; private set; }
    public string VehicleClass { get; private set; } = string.Empty;

    private Offering() { }

    public Offering(string name, string description, decimal basePrice, decimal maxWeightKg, decimal maxVolumeCbm, string vehicleClass)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        if (basePrice <= 0) throw new ArgumentException("BasePrice must be positive.", nameof(basePrice));
        if (maxWeightKg <= 0) throw new ArgumentException("MaxWeightKg must be positive.", nameof(maxWeightKg));
        Name = name;
        Description = description;
        BasePrice = basePrice;
        MaxWeightKg = maxWeightKg;
        MaxVolumeCbm = maxVolumeCbm;
        VehicleClass = vehicleClass;
    }
}
