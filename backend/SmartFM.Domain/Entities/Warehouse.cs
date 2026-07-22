namespace SmartFM.Domain.Entities;

public class Warehouse
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Name { get; private set; } = string.Empty;
    public string Address { get; private set; } = string.Empty;
    public Guid BranchId { get; private set; }

    private Warehouse() { }

    public Warehouse(string name, string address, Guid branchId)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(address);
        Name = name;
        Address = address;
        BranchId = branchId;
    }
}
