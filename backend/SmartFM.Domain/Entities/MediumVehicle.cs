namespace SmartFM.Domain.Entities;

public class MediumVehicle : Vehicle
{
    private MediumVehicle() { }

    public MediumVehicle(string registrationNumber, Guid branchId)
        : base(registrationNumber, branchId, maxPayloadKg: 5000) { }
}
