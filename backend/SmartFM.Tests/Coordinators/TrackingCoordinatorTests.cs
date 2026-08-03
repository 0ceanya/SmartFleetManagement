using SmartFM.Application.Coordinators;
using SmartFM.Domain.Records;
using SmartFM.Domain.ValueObjects;
using SmartFM.Infrastructure.Persistence;
using SmartFM.Infrastructure.Persistence.Repositories;
using SmartFM.Tests.TestSupport;
using Xunit;

namespace SmartFM.Tests.Coordinators;

public class TrackingCoordinatorTests : IDisposable
{
    private readonly InMemoryDbContextFactory _factory = new();
    private readonly SmartFMDbContext _context;
    private readonly TrackingCoordinator _coordinator;
    private readonly Repository<TrackingRecord> _trackingRecords;

    public TrackingCoordinatorTests()
    {
        _context = _factory.CreateContext();
        _trackingRecords = new Repository<TrackingRecord>(_context);
        _coordinator = new TrackingCoordinator(
            _trackingRecords,
            new Repository<Notification>(_context),
            new UnitOfWork(_context));
    }

    [Fact]
    public async Task RecordStatusChangeAsync_CreatesTrackingRecord()
    {
        var entityId = Guid.NewGuid();

        await _coordinator.RecordStatusChangeAsync(TrackingEntityType.Assignment, entityId, null, "Pending", "FleetAssignmentCoordinator");

        var records = _context.Set<TrackingRecord>().ToList();
        Assert.Single(records);
        Assert.Equal(TrackingEntityType.Assignment, records[0].EntityType);
        Assert.Equal(entityId, records[0].EntityId);
        Assert.Null(records[0].FromStatus);
        Assert.Equal("Pending", records[0].ToStatus);
        Assert.Equal("FleetAssignmentCoordinator", records[0].ChangedBy);
    }

    [Fact]
    public async Task GetTrackingRecordsByEntityAsync_FiltersCorrectly()
    {
        var assignmentId = Guid.NewGuid();
        var otherId = Guid.NewGuid();

        await _coordinator.RecordStatusChangeAsync(TrackingEntityType.Assignment, assignmentId, null, "Pending");
        await _coordinator.RecordStatusChangeAsync(TrackingEntityType.Assignment, assignmentId, "Pending", "Assigned");
        await _coordinator.RecordStatusChangeAsync(TrackingEntityType.Order, otherId, null, "Active");

        var results = (await _coordinator.GetTrackingRecordsByEntityAsync(TrackingEntityType.Assignment, assignmentId)).ToList();

        Assert.Equal(2, results.Count);
        Assert.All(results, r => Assert.Equal(TrackingEntityType.Assignment, r.EntityType));
        Assert.All(results, r => Assert.Equal(assignmentId, r.EntityId));
    }

    [Fact]
    public async Task RecordStatusChangeAsync_SetsCreatedAtTimestamp()
    {
        var before = DateTime.UtcNow;
        await _coordinator.RecordStatusChangeAsync(TrackingEntityType.Invoice, Guid.NewGuid(), "Unpaid", "Paid");
        var after = DateTime.UtcNow;

        var record = _context.Set<TrackingRecord>().Single();
        Assert.InRange(record.CreatedAt, before, after);
    }

    public void Dispose()
    {
        _context.Dispose();
        _factory.Dispose();
    }
}
