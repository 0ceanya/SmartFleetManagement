namespace SmartFM.Domain.Entities;

public class Shipment
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid OrderId { get; private set; }
    public Guid WarehouseId { get; private set; }
    public Guid? AssignmentId { get; private set; }
    public string Status { get; private set; } = ShipmentStatus.Created;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;
    public List<Cargo> Cargoes { get; private set; } = [];

    private Shipment() { }

    public Shipment(Order order, Guid warehouseId)
    {
        ArgumentNullException.ThrowIfNull(order);
        OrderId = order.Id;
        WarehouseId = warehouseId;
    }

    public void AddCargo(Cargo cargo)
    {
        ArgumentNullException.ThrowIfNull(cargo);
        Cargoes.Add(cargo);
    }

    public void SetStatus(string status) => Status = status;

    public void AssignTo(Guid assignmentId)
    {
        if (AssignmentId is not null) throw new InvalidOperationException("Shipment is already assigned.");
        AssignmentId = assignmentId;
    }
}
