using SmartFM.Application.Coordinators;
using SmartFM.Domain.Entities;
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
            new Repository<Assignment>(_context),
            new UnitOfWork(_context));
    }

    [Fact]
    public void TrackingCoordinatorWritesTrackingRecordOnTelemetryReceived()
    {
        var branch = new Branch("Hanoi Branch", "Hanoi");
        _context.Branches.Add(branch);
        var vehicle = new LightVehicle("29A-00001", branch.Id);
        _context.Vehicles.Add(vehicle);
        _context.SaveChanges();

        var data = new TelemetryData(vehicle.Id, 21.0, 105.8, DateTime.UtcNow);

        _coordinator.OnTelemetryReceived(vehicle, data);

        var records = _context.Set<TrackingRecord>().ToList();
        Assert.Single(records);
        Assert.Equal(vehicle.Id, records[0].VehicleId);
        Assert.Equal(21.0, records[0].Lat);
    }

    public void Dispose()
    {
        _context.Dispose();
        _factory.Dispose();
    }
}
