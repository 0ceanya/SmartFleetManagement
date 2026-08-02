namespace SmartFM.Domain.Entities;

public class Assignment
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid DriverId { get; private set; }
    public Guid VehicleId { get; private set; }
    public Guid? RouteId { get; private set; }
    public string Status { get; private set; } = AssignmentStatus.Pending;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    private Assignment() { }

    public Assignment(IReadOnlyList<Shipment> shipments, Driver driver, Vehicle vehicle, Route? route)
    {
        ArgumentNullException.ThrowIfNull(shipments);
        if (shipments.Count == 0) throw new ArgumentException("At least one shipment is required.", nameof(shipments));
        ArgumentNullException.ThrowIfNull(driver);
        ArgumentNullException.ThrowIfNull(vehicle);
        DriverId = driver.Id;
        VehicleId = vehicle.Id;
        RouteId = route?.Id;
    }

    public void Approve()
    {
        if (Status != AssignmentStatus.Pending) throw new InvalidOperationException("Only a pending assignment can be approved.");
        Status = AssignmentStatus.Assigned;
    }

    public void MarkLoaded()
    {
        if (Status != AssignmentStatus.Assigned) throw new InvalidOperationException("Only an assigned assignment can be marked loaded.");
        Status = AssignmentStatus.Loaded;
    }

    public void MarkDelivering()
    {
        if (Status != AssignmentStatus.Loaded) throw new InvalidOperationException("Only a loaded assignment can start delivering.");
        Status = AssignmentStatus.Delivering;
    }

    public void Deliver() => Status = AssignmentStatus.Delivered;

    public void Reject()
    {
        if (Status == AssignmentStatus.Delivered) throw new InvalidOperationException("Cannot reject an already-delivered assignment.");
        Status = AssignmentStatus.Rejected;
    }
}
