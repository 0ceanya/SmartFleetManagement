using SmartFM.Application.Coordinators;
using SmartFM.Domain.Records;
using SmartFM.Domain.ValueObjects;
using SmartFM.Infrastructure.Persistence;
using SmartFM.Infrastructure.Persistence.Repositories;
using SmartFM.Tests.TestSupport;
using Xunit;

namespace SmartFM.Tests.Coordinators;

public class ReportingCoordinatorTests : IDisposable
{
    private readonly InMemoryDbContextFactory _factory = new();
    private readonly SmartFMDbContext _context;
    private readonly ReportingCoordinator _coordinator;
    private readonly Repository<TrackingRecord> _trackingRecords;
    private readonly Repository<IncidentRecord> _incidentRecords;
    private readonly Repository<AuditRecord> _auditRecords;

    public ReportingCoordinatorTests()
    {
        _context = _factory.CreateContext();
        _trackingRecords = new Repository<TrackingRecord>(_context);
        _incidentRecords = new Repository<IncidentRecord>(_context);
        _auditRecords = new Repository<AuditRecord>(_context);
        _coordinator = new ReportingCoordinator(
            _trackingRecords,
            _incidentRecords,
            _auditRecords,
            new Repository<Report>(_context),
            new UnitOfWork(_context));
    }

    [Fact]
    public async Task ReportingCoordinatorGeneratesReportAggregatingRecordsAndWritesAuditRecord()
    {
        var from = DateTime.UtcNow.AddMinutes(-5);

        await _trackingRecords.AddAsync(new TrackingRecord { VehicleId = Guid.NewGuid(), ShipmentId = Guid.NewGuid(), Lat = 1, Lon = 1, Status = "Available" });
        await _incidentRecords.AddAsync(new IncidentRecord { VehicleId = Guid.NewGuid(), Description = "Breakdown", Severity = "High" });
        await _context.SaveChangesAsync();

        var to = DateTime.UtcNow.AddMinutes(5);

        var report = await _coordinator.GenerateReportAsync("FleetSummary", from, to);

        Assert.Equal("FleetSummary", report.ReportType);
        Assert.Contains("TrackingRecords: 1", report.Content);
        Assert.Contains("IncidentRecords: 1", report.Content);

        var audits = _context.Set<AuditRecord>().ToList();
        Assert.Contains(audits, a => a.Action == "ReportGenerated");
    }

    public void Dispose()
    {
        _context.Dispose();
        _factory.Dispose();
    }
}
