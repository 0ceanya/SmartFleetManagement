namespace SmartFM.Domain.Entities;

public abstract class Employee
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Name { get; private set; } = string.Empty;
    public string Email { get; private set; } = string.Empty;
    public Guid BranchId { get; private set; }

    protected Employee() { }

    protected Employee(string name, string email, Guid branchId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        Name = name;
        Email = email;
        BranchId = branchId;
    }

    public void UpdateContactInfo(string name, string email)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(email);
        Name = name;
        Email = email;
    }
}
