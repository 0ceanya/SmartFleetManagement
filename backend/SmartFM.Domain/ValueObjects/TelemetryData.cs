namespace SmartFM.Domain.ValueObjects;

public record TelemetryData(Guid VehicleId, double Lat, double Lon, DateTime Timestamp);
