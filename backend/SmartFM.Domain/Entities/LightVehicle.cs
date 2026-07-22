namespace SmartFM.Domain.Entities;

public class LightVehicle : Vehicle
{
    private LightVehicle() { }

    public LightVehicle(string registrationNumber, Guid branchId)
        : base(registrationNumber, branchId, maxPayloadKg: 1000) { }
}
