namespace SmartFM.Domain.Entities;

public class Warehouse
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Name { get; private set; } = string.Empty;
    public string Address { get; private set; } = string.Empty;
    public Guid BranchId { get; private set; }
    public decimal CapacityKg { get; private set; }

    private Warehouse() { }

    public Warehouse(string name, string address, Guid branchId, decimal capacityKg)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(address);
        if (capacityKg <= 0) throw new ArgumentException("CapacityKg must be positive.", nameof(capacityKg));
        Name = name;
        Address = address;
        BranchId = branchId;
        CapacityKg = capacityKg;
    }

    public void UpdateDetails(string name, string address)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(address);
        Name = name;
        Address = address;
    }
}
