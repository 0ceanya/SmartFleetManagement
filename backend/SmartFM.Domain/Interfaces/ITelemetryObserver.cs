using SmartFM.Domain.Entities;
using SmartFM.Domain.ValueObjects;

namespace SmartFM.Domain.Interfaces;

public interface ITelemetryObserver
{
    void OnTelemetryReceived(Vehicle vehicle, TelemetryData data);
}
