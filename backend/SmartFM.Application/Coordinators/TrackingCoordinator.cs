using SmartFM.Application.Abstractions;
using SmartFM.Domain.Entities;
using SmartFM.Domain.Records;
using SmartFM.Domain.ValueObjects;

namespace SmartFM.Application.Coordinators;

public class TrackingCoordinator
{
    private readonly IRepository<TrackingRecord> _trackingRecords;
    private readonly IRepository<Notification> _notifications;
    private readonly IUnitOfWork _unitOfWork;

    public TrackingCoordinator(
        IRepository<TrackingRecord> trackingRecords,
        IRepository<Notification> notifications,
        IUnitOfWork unitOfWork)
    {
        _trackingRecords = trackingRecords;
        _notifications = notifications;
        _unitOfWork = unitOfWork;
    }

    public Task InitializeTrackingSubsystem()
    {
        Console.WriteLine("TrackingCoordinator initialized");
        return Task.CompletedTask;
    }

    public Task<IEnumerable<TrackingRecord>> GetTrackingRecordsAsync() => _trackingRecords.GetAllAsync();

    public async Task<IEnumerable<TrackingRecord>> GetTrackingRecordsByEntityAsync(string entityType, Guid entityId)
    {
        var all = await _trackingRecords.GetAllAsync();
        return all.Where(r => r.EntityType == entityType && r.EntityId == entityId);
    }

    public Task<IEnumerable<Notification>> GetNotificationsAsync() => _notifications.GetAllAsync();

    public async Task RecordStatusChangeAsync(
        string entityType, Guid entityId,
        string? fromStatus, string toStatus,
        string? changedBy = null)
    {
        var record = new TrackingRecord
        {
            EntityType = entityType,
            EntityId = entityId,
            FromStatus = fromStatus,
            ToStatus = toStatus,
            ChangedBy = changedBy
        };
        await _trackingRecords.AddAsync(record);
        await _unitOfWork.SaveChangesAsync();
    }
}
