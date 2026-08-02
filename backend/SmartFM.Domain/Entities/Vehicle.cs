using SmartFM.Domain.Interfaces;
using SmartFM.Domain.ValueObjects;

namespace SmartFM.Domain.Entities;

public abstract class Vehicle : ITrackable
{
    private readonly List<ITelemetryObserver> _observers = [];

    public Guid Id { get; private set; } = Guid.NewGuid();
    public string RegistrationNumber { get; private set; } = string.Empty;
    public string CurrentStatus { get; private set; } = VehicleStatus.Available;
    public Guid BranchId { get; private set; }
    public double MaxPayloadKg { get; private set; }

    protected Vehicle() { }

    protected Vehicle(string registrationNumber, Guid branchId, double maxPayloadKg)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(registrationNumber);
        RegistrationNumber = registrationNumber;
        BranchId = branchId;
        MaxPayloadKg = maxPayloadKg;
    }

    public void RegisterObserver(ITelemetryObserver observer) => _observers.Add(observer);

    public void NotifyObservers(TelemetryData data)
    {
        foreach (var observer in _observers)
            observer.OnTelemetryReceived(this, data);
    }

    public void SetStatus(string status) => CurrentStatus = status;

    public void SetBranch(Guid branchId) => BranchId = branchId;
}
