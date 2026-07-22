namespace SmartFM.Domain.Entities;

public class HeavyVehicle : Vehicle
{
    private HeavyVehicle() { }

    public HeavyVehicle(string registrationNumber, Guid branchId)
        : base(registrationNumber, branchId, maxPayloadKg: 20000) { }
}
