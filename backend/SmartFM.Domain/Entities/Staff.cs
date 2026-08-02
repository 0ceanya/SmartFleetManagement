namespace SmartFM.Domain.Entities;

public class Staff : Employee
{
    public string Department { get; private set; } = string.Empty;

    private Staff() { }

    public Staff(string name, string email, Guid branchId, string department)
        : base(name, email, branchId)
    {
        Department = department;
    }

    public void UpdateDepartment(string department)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(department);
        Department = department;
    }
}
