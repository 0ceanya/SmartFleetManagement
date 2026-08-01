namespace SmartFM.Domain.Entities;

public class Route
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string OriginAddress { get; private set; } = string.Empty;
    public string DestinationAddress { get; private set; } = string.Empty;
    public string? WaypointsJson { get; private set; }
    public double? DistanceKm { get; private set; }
    public int? EstimatedDurationMinutes { get; private set; }

    private Route() { }

    public Route(string originAddress, string destinationAddress, string? waypointsJson, double? distanceKm, int? estimatedDurationMinutes)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(originAddress);
        ArgumentException.ThrowIfNullOrWhiteSpace(destinationAddress);
        if (distanceKm is <= 0)
            throw new ArgumentException("DistanceKm must be positive when provided.", nameof(distanceKm));
        if (estimatedDurationMinutes is <= 0)
            throw new ArgumentException("EstimatedDurationMinutes must be positive when provided.", nameof(estimatedDurationMinutes));

        OriginAddress = originAddress;
        DestinationAddress = destinationAddress;
        WaypointsJson = waypointsJson;
        DistanceKm = distanceKm;
        EstimatedDurationMinutes = estimatedDurationMinutes;
    }
}
