namespace SmartFM.Domain.Entities;

public class Route
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public Guid OriginWarehouseId { get; private set; }
    public Guid DestinationWarehouseId { get; private set; }
    public decimal EstimatedDistanceKm { get; private set; }
    public decimal EstimatedDurationHours { get; private set; }

    private Route() { }

    public Route(Guid originWarehouseId, Guid destinationWarehouseId, decimal estimatedDistanceKm)
    {
        if (originWarehouseId == destinationWarehouseId)
            throw new ArgumentException("Origin and destination must differ.");
        if (estimatedDistanceKm <= 0)
            throw new ArgumentException("Distance must be positive.", nameof(estimatedDistanceKm));
        OriginWarehouseId = originWarehouseId;
        DestinationWarehouseId = destinationWarehouseId;
        EstimatedDistanceKm = estimatedDistanceKm;
        EstimatedDurationHours = estimatedDistanceKm / 50m;
    }
}
