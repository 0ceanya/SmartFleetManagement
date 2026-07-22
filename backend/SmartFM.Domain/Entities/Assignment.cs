namespace SmartFM.Domain.Entities;

public class Assignment
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid ShipmentId { get; private set; }
    public Guid DriverId { get; private set; }
    public Guid VehicleId { get; private set; }
    public Guid RouteId { get; private set; }
    public string Status { get; private set; } = AssignmentStatus.Active;
    public DateTime CreatedAt { get; private set; } = DateTime.UtcNow;

    private Assignment() { }

    public Assignment(Shipment shipment, Driver driver, Vehicle vehicle, Route route)
    {
        ArgumentNullException.ThrowIfNull(shipment);
        ArgumentNullException.ThrowIfNull(driver);
        ArgumentNullException.ThrowIfNull(vehicle);
        ArgumentNullException.ThrowIfNull(route);
        ShipmentId = shipment.Id;
        DriverId = driver.Id;
        VehicleId = vehicle.Id;
        RouteId = route.Id;
    }

    public void Complete() => Status = AssignmentStatus.Completed;
}
