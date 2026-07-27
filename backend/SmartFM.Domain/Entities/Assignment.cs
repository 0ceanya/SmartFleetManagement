namespace SmartFM.Domain.Entities;

public class Assignment
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid DriverId { get; private set; }
    public Guid VehicleId { get; private set; }
    public Guid RouteId { get; private set; }
    public string Status { get; private set; } = AssignmentStatus.Pending;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    private Assignment() { }

    public Assignment(IReadOnlyList<Shipment> shipments, Driver driver, Vehicle vehicle, Route route)
    {
        ArgumentNullException.ThrowIfNull(shipments);
        if (shipments.Count == 0) throw new ArgumentException("At least one shipment is required.", nameof(shipments));
        ArgumentNullException.ThrowIfNull(driver);
        ArgumentNullException.ThrowIfNull(vehicle);
        ArgumentNullException.ThrowIfNull(route);
        DriverId = driver.Id;
        VehicleId = vehicle.Id;
        RouteId = route.Id;
    }

    public void Approve()
    {
        if (Status != AssignmentStatus.Pending) throw new InvalidOperationException("Only a pending assignment can be approved.");
        Status = AssignmentStatus.Active;
    }

    public void Complete() => Status = AssignmentStatus.Completed;
}
