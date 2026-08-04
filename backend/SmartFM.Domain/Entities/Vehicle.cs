namespace SmartFM.Domain.Entities;

public abstract class Vehicle
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string RegistrationNumber { get; private set; } = string.Empty;
    public string CurrentStatus { get; private set; } = VehicleStatus.Available;
    public Guid BranchId { get; private set; }
    public double MaxPayloadKg { get; private set; }

    protected Vehicle() { }

    protected Vehicle(string registrationNumber, Guid branchId, double maxPayloadKg)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(registrationNumber);
        RegistrationNumber = registrationNumber;
        BranchId = branchId;
        MaxPayloadKg = maxPayloadKg;
    }

    public bool CanCarry(decimal weightKg) => weightKg <= (decimal)MaxPayloadKg;

    public void SetStatus(string status) => CurrentStatus = status;

    public void SetBranch(Guid branchId) => BranchId = branchId;
}
