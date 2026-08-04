using System.Text.Json;
using SmartFM.Application.Abstractions;
using SmartFM.Domain.Entities;
using SmartFM.Domain.Records;
using SmartFM.Domain.ValueObjects;

namespace SmartFM.Application.Coordinators;

public record AssignmentsByDayEntry(DateOnly Day, int Count);
public record AssignmentsByBranchEntry(Guid BranchId, int Count);
public record AssignmentsByDriverEntry(Guid DriverId, int Count);

public record DashboardSummary(
    int TripsCompleted, int TripsCompletedPrevPeriod,
    double FleetUtilizationPct, double FleetUtilizationPctPrevPeriod,
    double TotalKm, double TotalKmPrevPeriod,
    int OpenIncidents, int OpenIncidentsPrevPeriod);

public record TripsPerDayEntry(DateOnly Day, int Count);
public record TripsByVehicleTypeEntry(string VehicleType, int Count);

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
    private readonly IRepository<Employee> _employees;
    private readonly IRepository<AuditRecord> _auditRecords;
    private readonly IRepository<Shipment> _shipments;
    private readonly IRepository<Cargo> _cargoes;
    private readonly IUnitOfWork _unitOfWork;

    public ReportingCoordinator(
        IRepository<TrackingRecord> trackingRecords,
        IRepository<IncidentRecord> incidentRecords,
        IRepository<Report> reports,
        IRepository<Assignment> assignments,
        IRepository<Vehicle> vehicles,
        IRepository<Order> orders,
        IRepository<Invoice> invoices,
        IRepository<Employee> employees,
        IRepository<AuditRecord> auditRecords,
        IRepository<Shipment> shipments,
        IRepository<Cargo> cargoes,
        IUnitOfWork unitOfWork)
    {
        _trackingRecords = trackingRecords;
        _incidentRecords = incidentRecords;
        _reports = reports;
        _assignments = assignments;
        _vehicles = vehicles;
        _orders = orders;
        _invoices = invoices;
        _employees = employees;
        _auditRecords = auditRecords;
        _shipments = shipments;
        _cargoes = cargoes;
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

    public async Task<DashboardSummary> GetDashboardSummaryAsync(DateTime from, DateTime to, Guid? branchId, string? vehicleClass)
    {
        var previousSpan = to - from;
        var prevFrom = from - previousSpan;
        var prevTo = from;

        var current = await ComputePeriodMetricsAsync(from, to, branchId, vehicleClass);
        var previous = await ComputePeriodMetricsAsync(prevFrom, prevTo, branchId, vehicleClass);

        return new DashboardSummary(
            current.TripsCompleted, previous.TripsCompleted,
            current.FleetUtilizationPct, previous.FleetUtilizationPct,
            current.TotalKm, previous.TotalKm,
            current.OpenIncidents, previous.OpenIncidents);
    }

    public async Task<IReadOnlyList<TripsPerDayEntry>> GetTripsOverTimeAsync(DateTime from, DateTime to, Guid? branchId, string? vehicleClass)
    {
        var scopedVehicleIds = (await ScopedVehiclesAsync(branchId, vehicleClass)).Select(v => v.Id).ToHashSet();

        var assignments = await _assignments.GetAllAsync();
        return assignments
            .Where(a => scopedVehicleIds.Contains(a.VehicleId) && a.Status == AssignmentStatus.Delivered && a.CreatedAt >= from && a.CreatedAt <= to)
            .GroupBy(a => DateOnly.FromDateTime(a.CreatedAt))
            .OrderBy(g => g.Key)
            .Select(g => new TripsPerDayEntry(g.Key, g.Count()))
            .ToList();
    }

    public async Task<IReadOnlyList<TripsByVehicleTypeEntry>> GetTripsByVehicleTypeAsync(DateTime from, DateTime to, Guid? branchId)
    {
        var scopedVehicles = await ScopedVehiclesAsync(branchId, vehicleClass: null);
        var vehicleTypeMap = scopedVehicles.ToDictionary(v => v.Id, VehicleTypeName);

        var assignments = await _assignments.GetAllAsync();
        return assignments
            .Where(a => vehicleTypeMap.ContainsKey(a.VehicleId) && a.Status == AssignmentStatus.Delivered && a.CreatedAt >= from && a.CreatedAt <= to)
            .GroupBy(a => vehicleTypeMap[a.VehicleId])
            .Select(g => new TripsByVehicleTypeEntry(g.Key, g.Count()))
            .ToList();
    }

    private async Task<(int TripsCompleted, double FleetUtilizationPct, double TotalKm, int OpenIncidents)> ComputePeriodMetricsAsync(
        DateTime from, DateTime to, Guid? branchId, string? vehicleClass)
    {
        var scopedVehicles = await ScopedVehiclesAsync(branchId, vehicleClass);
        var scopedVehicleIds = scopedVehicles.Select(v => v.Id).ToHashSet();

        var assignments = await _assignments.GetAllAsync();
        var scopedAssignments = assignments.Where(a => scopedVehicleIds.Contains(a.VehicleId)).ToList();

        var tripsCompleted = scopedAssignments.Count(a =>
            a.Status == AssignmentStatus.Delivered && a.CreatedAt >= from && a.CreatedAt <= to);

        var utilizedVehicleCount = scopedAssignments
            .Where(a => a.CreatedAt >= from && a.CreatedAt <= to)
            .Select(a => a.VehicleId)
            .Distinct()
            .Count();
        var fleetUtilizationPct = scopedVehicles.Count == 0 ? 0 : (double)utilizedVehicleCount / scopedVehicles.Count * 100;

        var scopedAssignmentIds = scopedAssignments.Select(a => a.Id).ToHashSet();
        var trackingRecords = await _trackingRecords.GetAllAsync();
        var periodTracking = trackingRecords.Where(r =>
            r.CreatedAt >= from && r.CreatedAt <= to &&
            ((r.AssignmentId is not null && scopedAssignmentIds.Contains(r.AssignmentId.Value)) ||
             (r.AssignmentId is null && scopedVehicleIds.Contains(r.VehicleId))));
        var totalKm = SumTrackKm(periodTracking);

        var incidentRecords = await _incidentRecords.GetAllAsync();
        // No resolved/open flag exists on IncidentRecord - "open" here means recorded within the
        // period, matching GenerateReportAsync's existing IncidentCount semantics.
        var openIncidents = incidentRecords.Count(r =>
            scopedVehicleIds.Contains(r.VehicleId) && r.CreatedAt >= from && r.CreatedAt <= to);

        return (tripsCompleted, fleetUtilizationPct, totalKm, openIncidents);
    }

    private async Task<IReadOnlyList<Vehicle>> ScopedVehiclesAsync(Guid? branchId, string? vehicleClass)
    {
        var vehicles = await _vehicles.GetAllAsync();
        return vehicles
            .Where(v => (branchId is null || v.BranchId == branchId) && (vehicleClass is null || VehicleTypeName(v) == vehicleClass))
            .ToList();
    }

    private static string VehicleTypeName(Vehicle vehicle) => vehicle switch
    {
        LightVehicle => "Light",
        MediumVehicle => "Medium",
        HeavyVehicle => "Heavy",
        _ => "Unknown"
    };

    private static double HaversineKm(double lat1, double lon1, double lat2, double lon2)
    {
        const double earthRadiusKm = 6371;
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return earthRadiusKm * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    private static double SumTrackKm(IEnumerable<TrackingRecord> records)
    {
        double total = 0;
        foreach (var group in records.GroupBy(r => r.AssignmentId ?? Guid.Empty))
        {
            var ordered = group.OrderBy(r => r.CreatedAt).ToList();
            for (var i = 1; i < ordered.Count; i++)
                total += HaversineKm(ordered[i - 1].Lat, ordered[i - 1].Lon, ordered[i].Lat, ordered[i].Lon);
        }
        return total;
    }
}
