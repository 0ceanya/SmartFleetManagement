namespace SmartFM.Domain.Entities;

public class Shipment
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid OrderId { get; private set; }
    public string PickupAddress { get; private set; } = string.Empty;
    public string DeliveryAddress { get; private set; } = string.Empty;
    public Guid? WarehouseId { get; private set; }
    public Guid? AssignmentId { get; private set; }
    public string Status { get; private set; } = ShipmentStatus.Created;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    private Shipment() { }

    public Shipment(Order order, string pickupAddress, string deliveryAddress)
    {
        ArgumentNullException.ThrowIfNull(order);
        ArgumentException.ThrowIfNullOrWhiteSpace(pickupAddress);
        ArgumentException.ThrowIfNullOrWhiteSpace(deliveryAddress);
        OrderId = order.Id;
        PickupAddress = pickupAddress;
        DeliveryAddress = deliveryAddress;
    }

    public void SetStatus(string status) => Status = status;

    public void AssignTo(Guid assignmentId)
    {
        if (AssignmentId is not null) throw new InvalidOperationException("Shipment is already assigned.");
        AssignmentId = assignmentId;
    }

    public void SetWarehouse(Guid warehouseId) => WarehouseId = warehouseId;
}
