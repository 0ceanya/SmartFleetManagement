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

public record VehicleReportCards(int ActiveVehicles, double TotalKmPeriod, int VehiclesUnderMaintenance);
public record VehicleReportRow(Guid Id, string RegistrationNumber, string VehicleType, string CurrentStatus, Guid BranchId, int TripsPeriod, double KmPeriod, int Incidents);

public record DriverReportCards(int ActiveDrivers, int TripsCompletedPeriod, int DriversInvolvedInIncidents);
public record DriverReportRow(Guid Id, string Name, Guid BranchId, int Trips, double Km, int DeliveryConfirmations, int Incidents);

public record StaffReportCards(int TotalStaff, int AssignmentsCreatedPeriod, int OrdersProcessedPeriod);
public record StaffReportRow(Guid Id, string Name, Guid BranchId, int AssignmentsCreated, int OrdersProcessed, DateTime? LastActivity);

public record OrderReportCards(int OrdersPeriod, int PendingApproval, int Completed);
public record OrderReportRow(Guid Id, string CustomerName, string Status, DateTime CreatedAt, int CargoCount, string PaymentStatus);

public record AssignmentReportCards(int ActiveAssignments, int CompletedPeriod, int AwaitingDriverOrVehicle);
public record AssignmentReportRow(Guid Id, string DriverName, string VehicleRegistration, string? RouteSummary, string Status, string CreatedByStaff, DateTime CreatedAt);

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
    private readonly IRepository<DeliveryConfirmation> _deliveryConfirmations;
    private readonly IRepository<Customer> _customers;
    private readonly IRepository<Route> _routes;
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
        IRepository<DeliveryConfirmation> deliveryConfirmations,
        IRepository<Customer> customers,
        IRepository<Route> routes,
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
        _deliveryConfirmations = deliveryConfirmations;
        _customers = customers;
        _routes = routes;
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

    public async Task<(VehicleReportCards Cards, IReadOnlyList<VehicleReportRow> Rows)> GetVehicleReportAsync(
        DateTime from, DateTime to, string? search, string? vehicleType, string? status)
    {
        var vehicles = await _vehicles.GetAllAsync();
        var filtered = vehicles.Where(v =>
            (search is null || v.RegistrationNumber.Contains(search, StringComparison.OrdinalIgnoreCase)) &&
            (vehicleType is null || VehicleTypeName(v) == vehicleType) &&
            (status is null || v.CurrentStatus == status))
            .ToList();

        var assignments = await _assignments.GetAllAsync();
        var trackingRecords = await _trackingRecords.GetAllAsync();
        var incidentRecords = await _incidentRecords.GetAllAsync();

        var rows = filtered.Select(v =>
        {
            var vehicleAssignments = assignments.Where(a => a.VehicleId == v.Id).ToList();
            var trips = vehicleAssignments.Count(a => a.Status == AssignmentStatus.Delivered && a.CreatedAt >= from && a.CreatedAt <= to);
            var km = SumTrackKm(trackingRecords.Where(r => r.VehicleId == v.Id && r.CreatedAt >= from && r.CreatedAt <= to));
            var incidents = incidentRecords.Count(r => r.VehicleId == v.Id && r.CreatedAt >= from && r.CreatedAt <= to);
            return new VehicleReportRow(v.Id, v.RegistrationNumber, VehicleTypeName(v), v.CurrentStatus, v.BranchId, trips, km, incidents);
        }).ToList();

        var cards = new VehicleReportCards(
            ActiveVehicles: filtered.Count(v => v.CurrentStatus != VehicleStatus.UnderMaintenance),
            TotalKmPeriod: rows.Sum(r => r.KmPeriod),
            VehiclesUnderMaintenance: filtered.Count(v => v.CurrentStatus == VehicleStatus.UnderMaintenance));

        return (cards, rows);
    }

    public async Task<(DriverReportCards Cards, IReadOnlyList<DriverReportRow> Rows)> GetDriverReportAsync(
        DateTime from, DateTime to, string? search, Guid? branchId, string? status)
    {
        var employees = await _employees.GetAllAsync();
        var drivers = employees.OfType<Driver>()
            .Where(d =>
                (search is null || d.Name.Contains(search, StringComparison.OrdinalIgnoreCase)) &&
                (branchId is null || d.BranchId == branchId) &&
                (status is null || (status == "Available") == d.IsAvailable))
            .ToList();

        var assignments = await _assignments.GetAllAsync();
        var trackingRecords = await _trackingRecords.GetAllAsync();
        var incidentRecords = await _incidentRecords.GetAllAsync();
        var deliveryConfirmations = await _deliveryConfirmations.GetAllAsync();

        var rows = drivers.Select(d =>
        {
            var driverAssignments = assignments.Where(a => a.DriverId == d.Id).ToList();
            var periodAssignments = driverAssignments.Where(a => a.CreatedAt >= from && a.CreatedAt <= to).ToList();
            var trips = periodAssignments.Count(a => a.Status == AssignmentStatus.Delivered);
            var assignmentIds = periodAssignments.Select(a => a.Id).ToHashSet();
            var km = SumTrackKm(trackingRecords.Where(r => r.AssignmentId is not null && assignmentIds.Contains(r.AssignmentId.Value)));
            var confirmations = deliveryConfirmations.Count(c => c.DriverId == d.Id && c.ConfirmedAt >= from && c.ConfirmedAt <= to);
            var driverVehicleIds = periodAssignments.Select(a => a.VehicleId).ToHashSet();
            var incidents = incidentRecords.Count(r => r.CreatedAt >= from && r.CreatedAt <= to && driverVehicleIds.Contains(r.VehicleId));
            return new DriverReportRow(d.Id, d.Name, d.BranchId, trips, km, confirmations, incidents);
        }).ToList();

        var incidentVehicleIds = incidentRecords.Where(r => r.CreatedAt >= from && r.CreatedAt <= to).Select(r => r.VehicleId).ToHashSet();
        var driversInvolvedInIncidents = drivers.Count(d =>
            assignments.Any(a => a.DriverId == d.Id && incidentVehicleIds.Contains(a.VehicleId)));

        var cards = new DriverReportCards(
            ActiveDrivers: drivers.Count(d => !d.IsAvailable),
            TripsCompletedPeriod: rows.Sum(r => r.Trips),
            DriversInvolvedInIncidents: driversInvolvedInIncidents);

        return (cards, rows);
    }

    public async Task<(StaffReportCards Cards, IReadOnlyList<StaffReportRow> Rows)> GetStaffReportAsync(
        DateTime from, DateTime to, string? search, Guid? branchId)
    {
        var employees = await _employees.GetAllAsync();
        var staffMembers = employees.OfType<Staff>()
            .Where(s =>
                (search is null || s.Name.Contains(search, StringComparison.OrdinalIgnoreCase)) &&
                (branchId is null || s.BranchId == branchId))
            .ToList();

        var auditRecords = (await _auditRecords.GetAllAsync())
            .Where(r => r.CreatedAt >= from && r.CreatedAt <= to && r.ChangedBy is not null && r.ChangedBy.StartsWith("Staff:"))
            .ToList();

        var rows = staffMembers.Select(s =>
        {
            var staffTag = $"Staff:{s.Id}";
            var staffAudits = auditRecords.Where(r => r.ChangedBy == staffTag).ToList();
            var assignmentsCreated = staffAudits.Count(r => r.EntityType == AuditEntityType.Assignment && r.FromStatus is null);
            var ordersProcessed = staffAudits.Count(r => r.EntityType == AuditEntityType.Order);
            var lastActivity = staffAudits.Count > 0 ? staffAudits.Max(r => r.CreatedAt) : (DateTime?)null;
            return new StaffReportRow(s.Id, s.Name, s.BranchId, assignmentsCreated, ordersProcessed, lastActivity);
        }).ToList();

        var cards = new StaffReportCards(
            TotalStaff: staffMembers.Count,
            AssignmentsCreatedPeriod: rows.Sum(r => r.AssignmentsCreated),
            OrdersProcessedPeriod: rows.Sum(r => r.OrdersProcessed));

        return (cards, rows);
    }

    public async Task<(OrderReportCards Cards, IReadOnlyList<OrderReportRow> Rows)> GetOrderReportAsync(
        DateTime from, DateTime to, string? search, string? status)
    {
        var orders = await _orders.GetAllAsync();
        var customers = (await _customers.GetAllAsync()).ToDictionary(c => c.Id);
        var invoices = (await _invoices.GetAllAsync()).ToList();

        var periodOrders = orders.Where(o => o.CreatedAt >= from && o.CreatedAt <= to).ToList();

        var filtered = periodOrders.Where(o =>
        {
            var customerName = customers.TryGetValue(o.CustomerId, out var c) ? c.Name : string.Empty;
            var matchesSearch = search is null ||
                o.Id.ToString().Contains(search, StringComparison.OrdinalIgnoreCase) ||
                customerName.Contains(search, StringComparison.OrdinalIgnoreCase);
            var matchesStatus = status is null || o.Status == status;
            return matchesSearch && matchesStatus;
        }).ToList();

        var rows = filtered.Select(o =>
        {
            var customerName = customers.TryGetValue(o.CustomerId, out var c) ? c.Name : string.Empty;
            var invoice = invoices.FirstOrDefault(i => i.OrderId == o.Id);
            return new OrderReportRow(o.Id, customerName, o.Status, o.CreatedAt, o.Cargoes.Count, invoice?.Status ?? "NoInvoice");
        }).ToList();

        var cards = new OrderReportCards(
            OrdersPeriod: periodOrders.Count,
            PendingApproval: periodOrders.Count(o => o.Status == OrderStatus.Pending),
            Completed: periodOrders.Count(o => o.Status == OrderStatus.Fulfilled));

        return (cards, rows);
    }

    public async Task<(AssignmentReportCards Cards, IReadOnlyList<AssignmentReportRow> Rows)> GetAssignmentReportAsync(
        DateTime from, DateTime to, string? search, string? status)
    {
        var assignments = await _assignments.GetAllAsync();
        var drivers = (await _employees.GetAllAsync()).OfType<Driver>().ToDictionary(d => d.Id);
        var vehicles = (await _vehicles.GetAllAsync()).ToDictionary(v => v.Id);
        var routes = (await _routes.GetAllAsync()).ToDictionary(r => r.Id);
        var auditRecords = (await _auditRecords.GetAllAsync())
            .Where(r => r.EntityType == AuditEntityType.Assignment && r.FromStatus is null)
            .ToDictionary(r => r.EntityId, r => r.ChangedBy);

        var filtered = assignments.Where(a =>
        {
            var driverName = drivers.TryGetValue(a.DriverId, out var d) ? d.Name : string.Empty;
            var vehicleRegistration = vehicles.TryGetValue(a.VehicleId, out var v) ? v.RegistrationNumber : string.Empty;
            var matchesSearch = search is null ||
                a.Id.ToString().Contains(search, StringComparison.OrdinalIgnoreCase) ||
                driverName.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                vehicleRegistration.Contains(search, StringComparison.OrdinalIgnoreCase);
            var matchesStatus = status is null || a.Status == status;
            return matchesSearch && matchesStatus;
        }).ToList();

        var rows = filtered.Select(a =>
        {
            var driverName = drivers.TryGetValue(a.DriverId, out var d) ? d.Name : string.Empty;
            var vehicleRegistration = vehicles.TryGetValue(a.VehicleId, out var v) ? v.RegistrationNumber : string.Empty;
            var routeSummary = a.RouteId is not null && routes.TryGetValue(a.RouteId.Value, out var route)
                ? $"{route.OriginAddress} -> {route.DestinationAddress}"
                : null;
            var createdByStaff = auditRecords.TryGetValue(a.Id, out var changedBy) ? (changedBy ?? "Staff") : "Staff";
            return new AssignmentReportRow(a.Id, driverName, vehicleRegistration, routeSummary, a.Status, createdByStaff, a.CreatedAt);
        }).ToList();

        var cards = new AssignmentReportCards(
            ActiveAssignments: assignments.Count(a => a.Status is not (AssignmentStatus.Delivered or AssignmentStatus.Rejected)),
            CompletedPeriod: assignments.Count(a => a.Status == AssignmentStatus.Delivered && a.CreatedAt >= from && a.CreatedAt <= to),
            AwaitingDriverOrVehicle: assignments.Count(a => a.Status == AssignmentStatus.Pending));

        return (cards, rows);
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
