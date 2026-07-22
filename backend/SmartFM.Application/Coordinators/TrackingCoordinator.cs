using SmartFM.Application.Abstractions;
using SmartFM.Domain.Entities;
using SmartFM.Domain.Interfaces;
using SmartFM.Domain.Records;
using SmartFM.Domain.ValueObjects;

namespace SmartFM.Application.Coordinators;

public class TrackingCoordinator : ITelemetryObserver
{
    private readonly IRepository<TrackingRecord> _trackingRecords;
    private readonly IRepository<Notification> _notifications;
    private readonly IRepository<Assignment> _assignments;
    private readonly IUnitOfWork _unitOfWork;

    public TrackingCoordinator(
        IRepository<TrackingRecord> trackingRecords,
        IRepository<Notification> notifications,
        IRepository<Assignment> assignments,
        IUnitOfWork unitOfWork)
    {
        _trackingRecords = trackingRecords;
        _notifications = notifications;
        _assignments = assignments;
        _unitOfWork = unitOfWork;
    }

    public Task InitializeTrackingSubsystem()
    {
        Console.WriteLine("TrackingCoordinator initialized");
        return Task.CompletedTask;
    }

    public void OnTelemetryReceived(Vehicle vehicle, TelemetryData data)
    {
        // ITelemetryObserver is synchronous; the async write is awaited before returning.
        RecordTelemetryAsync(vehicle, data).GetAwaiter().GetResult();
    }

    public Task<IEnumerable<TrackingRecord>> GetTrackingRecordsAsync() => _trackingRecords.GetAllAsync();

    public async Task<IEnumerable<TrackingRecord>> GetTrackingRecordsByShipmentIdAsync(Guid shipmentId)
    {
        var records = await _trackingRecords.GetAllAsync();
        return records.Where(r => r.ShipmentId == shipmentId);
    }

    public Task<IEnumerable<Notification>> GetNotificationsAsync() => _notifications.GetAllAsync();

    private async Task RecordTelemetryAsync(Vehicle vehicle, TelemetryData data)
    {
        var assignments = await _assignments.GetAllAsync();
        var activeAssignment = assignments.FirstOrDefault(a => a.VehicleId == vehicle.Id && a.Status == AssignmentStatus.Active);

        var record = new TrackingRecord
        {
            VehicleId = vehicle.Id,
            ShipmentId = activeAssignment?.ShipmentId ?? Guid.Empty,
            Lat = data.Lat,
            Lon = data.Lon,
            Status = vehicle.CurrentStatus
        };
        await _trackingRecords.AddAsync(record);

        if (activeAssignment is not null)
        {
            var notification = new Notification(
                activeAssignment.DriverId,
                $"Vehicle {vehicle.RegistrationNumber} location updated",
                DateTime.UtcNow);
            await _notifications.AddAsync(notification);
        }

        await _unitOfWork.SaveChangesAsync();
    }
}
