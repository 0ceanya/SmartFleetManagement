using SmartFM.Application.Coordinators;

namespace SmartFM.Api.Dtos.Reports;

public record DashboardSummaryResponse(
    int TripsCompleted, int TripsCompletedPrevPeriod,
    double FleetUtilizationPct, double FleetUtilizationPctPrevPeriod,
    double TotalKm, double TotalKmPrevPeriod,
    int OpenIncidents, int OpenIncidentsPrevPeriod)
{
    public static DashboardSummaryResponse FromDomain(DashboardSummary s) =>
        new(s.TripsCompleted, s.TripsCompletedPrevPeriod, s.FleetUtilizationPct, s.FleetUtilizationPctPrevPeriod,
            s.TotalKm, s.TotalKmPrevPeriod, s.OpenIncidents, s.OpenIncidentsPrevPeriod);
}

public record TripsPerDayResponse(DateOnly Day, int Count)
{
    public static TripsPerDayResponse FromDomain(TripsPerDayEntry e) => new(e.Day, e.Count);
}

public record TripsByVehicleTypeResponse(string VehicleType, int Count)
{
    public static TripsByVehicleTypeResponse FromDomain(TripsByVehicleTypeEntry e) => new(e.VehicleType, e.Count);
}

public record VehicleReportCardsResponse(int ActiveVehicles, double TotalKmPeriod, int VehiclesUnderMaintenance)
{
    public static VehicleReportCardsResponse FromDomain(VehicleReportCards c) => new(c.ActiveVehicles, c.TotalKmPeriod, c.VehiclesUnderMaintenance);
}

public record VehicleReportRowResponse(Guid Id, string RegistrationNumber, string VehicleType, string CurrentStatus, Guid BranchId, int TripsPeriod, double KmPeriod, int Incidents)
{
    public static VehicleReportRowResponse FromDomain(VehicleReportRow r) =>
        new(r.Id, r.RegistrationNumber, r.VehicleType, r.CurrentStatus, r.BranchId, r.TripsPeriod, r.KmPeriod, r.Incidents);
}

public record VehicleReportResponse(VehicleReportCardsResponse Cards, IReadOnlyList<VehicleReportRowResponse> Rows);

public record DriverReportCardsResponse(int ActiveDrivers, int TripsCompletedPeriod, int DriversInvolvedInIncidents)
{
    public static DriverReportCardsResponse FromDomain(DriverReportCards c) => new(c.ActiveDrivers, c.TripsCompletedPeriod, c.DriversInvolvedInIncidents);
}

public record DriverReportRowResponse(Guid Id, string Name, Guid BranchId, int Trips, double Km, int DeliveryConfirmations, int Incidents)
{
    public static DriverReportRowResponse FromDomain(DriverReportRow r) => new(r.Id, r.Name, r.BranchId, r.Trips, r.Km, r.DeliveryConfirmations, r.Incidents);
}

public record DriverReportResponse(DriverReportCardsResponse Cards, IReadOnlyList<DriverReportRowResponse> Rows);

public record StaffReportCardsResponse(int TotalStaff, int AssignmentsCreatedPeriod, int OrdersProcessedPeriod)
{
    public static StaffReportCardsResponse FromDomain(StaffReportCards c) => new(c.TotalStaff, c.AssignmentsCreatedPeriod, c.OrdersProcessedPeriod);
}

public record StaffReportRowResponse(Guid Id, string Name, Guid BranchId, int AssignmentsCreated, int OrdersProcessed, DateTime? LastActivity)
{
    public static StaffReportRowResponse FromDomain(StaffReportRow r) => new(r.Id, r.Name, r.BranchId, r.AssignmentsCreated, r.OrdersProcessed, r.LastActivity);
}

public record StaffReportResponse(StaffReportCardsResponse Cards, IReadOnlyList<StaffReportRowResponse> Rows);

public record OrderReportCardsResponse(int OrdersPeriod, int PendingApproval, int Completed)
{
    public static OrderReportCardsResponse FromDomain(OrderReportCards c) => new(c.OrdersPeriod, c.PendingApproval, c.Completed);
}

public record OrderReportRowResponse(Guid Id, string CustomerName, string Status, DateTime CreatedAt, int CargoCount, string PaymentStatus)
{
    public static OrderReportRowResponse FromDomain(OrderReportRow r) => new(r.Id, r.CustomerName, r.Status, r.CreatedAt, r.CargoCount, r.PaymentStatus);
}

public record OrderReportResponse(OrderReportCardsResponse Cards, IReadOnlyList<OrderReportRowResponse> Rows);

public record AssignmentReportCardsResponse(int ActiveAssignments, int CompletedPeriod, int AwaitingDriverOrVehicle)
{
    public static AssignmentReportCardsResponse FromDomain(AssignmentReportCards c) => new(c.ActiveAssignments, c.CompletedPeriod, c.AwaitingDriverOrVehicle);
}

public record AssignmentReportRowResponse(Guid Id, string DriverName, string VehicleRegistration, string? RouteSummary, string Status, string CreatedByStaff, DateTime CreatedAt)
{
    public static AssignmentReportRowResponse FromDomain(AssignmentReportRow r) =>
        new(r.Id, r.DriverName, r.VehicleRegistration, r.RouteSummary, r.Status, r.CreatedByStaff, r.CreatedAt);
}

public record AssignmentReportResponse(AssignmentReportCardsResponse Cards, IReadOnlyList<AssignmentReportRowResponse> Rows);
