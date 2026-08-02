namespace SmartFM.Domain.Entities;

public class Manager : Employee
{
    private Manager() { }

    public Manager(string name, string email, Guid branchId)
        : base(name, email, branchId) { }

    public Manager(Guid id, string name, string email, Guid branchId)
        : base(id, name, email, branchId) { }
}
