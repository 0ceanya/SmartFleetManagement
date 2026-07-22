namespace SmartFM.Domain.Entities;

public class Driver : Employee
{
    public string LicenseNumber { get; private set; } = string.Empty;
    public bool IsAvailable { get; private set; } = true;

    private Driver() { }

    public Driver(string name, string email, Guid branchId, string licenseNumber)
        : base(name, email, branchId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(licenseNumber);
        LicenseNumber = licenseNumber;
    }

    public void SetAvailability(bool available) => IsAvailable = available;
}
