using System.Text.Json;
using SmartFM.Application.Abstractions;
using SmartFM.Domain.Entities;
using SmartFM.Domain.Records;
using SmartFM.Domain.ValueObjects;

namespace SmartFM.Application.Coordinators;

public record AssignmentsByDayEntry(DateOnly Day, int Count);
public record AssignmentsByBranchEntry(Guid BranchId, int Count);
public record AssignmentsByDriverEntry(Guid DriverId, int Count);

public class ReportingCoordinator
{
    private static readonly JsonSerializerOptions BreakdownJsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    private readonly IRepository<TrackingRecord> _trackingRecords;
    private readonly IRepository<IncidentRecord> _incidentRecords;
    private readonly IRepository<Report> _reports;
    private readonly IRepository<Assignment> _assignments;
    private readonly IRepository<Vehicle> _vehicles;
    private readonly IRepository<Order> _orders;
    private readonly IRepository<Invoice> _invoices;
    private readonly IUnitOfWork _unitOfWork;

    public ReportingCoordinator(
        IRepository<TrackingRecord> trackingRecords,
        IRepository<IncidentRecord> incidentRecords,
        IRepository<Report> reports,
        IRepository<Assignment> assignments,
        IRepository<Vehicle> vehicles,
        IRepository<Order> orders,
        IRepository<Invoice> invoices,
        IUnitOfWork unitOfWork)
    {
        _trackingRecords = trackingRecords;
        _incidentRecords = incidentRecords;
        _reports = reports;
        _assignments = assignments;
        _vehicles = vehicles;
        _orders = orders;
        _invoices = invoices;
        _unitOfWork = unitOfWork;
    }

    public Task InitializeReportingSubsystem()
    {
        Console.WriteLine("ReportingCoordinator initialized");
        return Task.CompletedTask;
    }

    public async Task<Report> GenerateReportAsync(string reportType, DateTime from, DateTime to, Guid? branchId)
    {
        var trackingRecords = await _trackingRecords.GetAllAsync();
        var incidentRecords = await _incidentRecords.GetAllAsync();

        var trackingCount = trackingRecords.Count(r => r.CreatedAt >= from && r.CreatedAt <= to);
        var incidentCount = incidentRecords.Count(r => r.CreatedAt >= from && r.CreatedAt <= to);

        var content = $"TrackingRecords: {trackingCount}, IncidentRecords: {incidentCount}";

        var assignments = await _assignments.GetAllAsync();
        var vehicles = await _vehicles.GetAllAsync();
        var orders = await _orders.GetAllAsync();
        var invoices = await _invoices.GetAllAsync();

        var vehicleBranchMap = vehicles.ToDictionary(v => v.Id, v => v.BranchId);

        var rangedAssignments = assignments.Where(a => a.CreatedAt >= from && a.CreatedAt <= to);
        var scopedAssignments = (branchId is null
            ? rangedAssignments
            : rangedAssignments.Where(a => vehicleBranchMap.TryGetValue(a.VehicleId, out var b) && b == branchId))
            .ToList();

        var totalAssignments = scopedAssignments.Count;

        var scopedVehicles = branchId is null ? vehicles : vehicles.Where(v => v.BranchId == branchId);
        var activeVehicles = scopedVehicles.Count(v => v.CurrentStatus != VehicleStatus.UnderMaintenance);

        var scopedIncidentCount = incidentRecords.Count(r =>
            r.CreatedAt >= from && r.CreatedAt <= to &&
            (branchId is null || (vehicleBranchMap.TryGetValue(r.VehicleId, out var b) && b == branchId)));

        var totalCargoWeightKg = orders
            .Where(o => o.CreatedAt >= from && o.CreatedAt <= to)
            .SelectMany(o => o.Cargoes)
            .Sum(c => c.WeightKg);

        var revenue = invoices
            .Where(i => i.Status == InvoiceStatus.Paid && i.CreatedAt >= from && i.CreatedAt <= to)
            .Sum(i => i.Amount);

        var assignmentsByDay = scopedAssignments
            .GroupBy(a => DateOnly.FromDateTime(a.CreatedAt))
            .OrderBy(g => g.Key)
            .Select(g => new AssignmentsByDayEntry(g.Key, g.Count()))
            .ToList();

        var assignmentsByBranch = scopedAssignments
            .Where(a => vehicleBranchMap.ContainsKey(a.VehicleId))
            .GroupBy(a => vehicleBranchMap[a.VehicleId])
            .Select(g => new AssignmentsByBranchEntry(g.Key, g.Count()))
            .ToList();

        var assignmentsByDriver = scopedAssignments
            .GroupBy(a => a.DriverId)
            .Select(g => new AssignmentsByDriverEntry(g.Key, g.Count()))
            .ToList();

        var report = new Report(
            ReportType: reportType,
            From: from,
            To: to,
            Content: content,
            GeneratedAt: DateTime.UtcNow,
            BranchId: branchId,
            TotalAssignments: totalAssignments,
            ActiveVehicles: activeVehicles,
            IncidentCount: scopedIncidentCount,
            TotalCargoWeightKg: totalCargoWeightKg,
            Revenue: revenue,
            AssignmentsByDayJson: JsonSerializer.Serialize(assignmentsByDay, BreakdownJsonOptions),
            AssignmentsByBranchJson: JsonSerializer.Serialize(assignmentsByBranch, BreakdownJsonOptions),
            AssignmentsByDriverJson: JsonSerializer.Serialize(assignmentsByDriver, BreakdownJsonOptions));
        await _reports.AddAsync(report);

        await _unitOfWork.SaveChangesAsync();
        return report;
    }

    public Task<IEnumerable<Report>> GetReportsAsync() => _reports.GetAllAsync();
}
