using SmartFM.Application.Abstractions;
using SmartFM.Domain.Records;
using SmartFM.Domain.ValueObjects;

namespace SmartFM.Application.Coordinators;

public class ReportingCoordinator
{
    private readonly IRepository<TrackingRecord> _trackingRecords;
    private readonly IRepository<IncidentRecord> _incidentRecords;
    private readonly IRepository<AuditRecord> _auditRecords;
    private readonly IRepository<Report> _reports;
    private readonly IUnitOfWork _unitOfWork;

    public ReportingCoordinator(
        IRepository<TrackingRecord> trackingRecords,
        IRepository<IncidentRecord> incidentRecords,
        IRepository<AuditRecord> auditRecords,
        IRepository<Report> reports,
        IUnitOfWork unitOfWork)
    {
        _trackingRecords = trackingRecords;
        _incidentRecords = incidentRecords;
        _auditRecords = auditRecords;
        _reports = reports;
        _unitOfWork = unitOfWork;
    }

    public Task InitializeReportingSubsystem()
    {
        Console.WriteLine("ReportingCoordinator initialized");
        return Task.CompletedTask;
    }

    public async Task<Report> GenerateReportAsync(string reportType, DateTime from, DateTime to)
    {
        var trackingRecords = await _trackingRecords.GetAllAsync();
        var incidentRecords = await _incidentRecords.GetAllAsync();
        var auditRecords = await _auditRecords.GetAllAsync();

        var trackingCount = trackingRecords.Count(r => r.CreatedAt >= from && r.CreatedAt <= to);
        var incidentCount = incidentRecords.Count(r => r.CreatedAt >= from && r.CreatedAt <= to);
        var auditCount = auditRecords.Count(r => r.CreatedAt >= from && r.CreatedAt <= to);

        var content = $"TrackingRecords: {trackingCount}, IncidentRecords: {incidentCount}, AuditRecords: {auditCount}";
        var report = new Report(reportType, from, to, content, DateTime.UtcNow);
        await _reports.AddAsync(report);

        var audit = new AuditRecord
        {
            Action = "ReportGenerated",
            PerformedBy = "ReportingCoordinator",
            Details = $"Report {reportType} generated for range {from:o} to {to:o}."
        };
        await _auditRecords.AddAsync(audit);

        await _unitOfWork.SaveChangesAsync();
        return report;
    }

    public Task<IEnumerable<Report>> GetReportsAsync() => _reports.GetAllAsync();
}
