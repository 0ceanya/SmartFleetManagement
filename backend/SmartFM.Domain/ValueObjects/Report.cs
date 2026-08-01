namespace SmartFM.Domain.ValueObjects;

public record Report(
    string ReportType,
    DateTime From,
    DateTime To,
    string Content,
    DateTime GeneratedAt,
    Guid? BranchId,
    int TotalAssignments,
    int ActiveVehicles,
    int IncidentCount,
    decimal TotalCargoWeightKg,
    decimal Revenue,
    string AssignmentsByDayJson,
    string AssignmentsByBranchJson,
    string AssignmentsByDriverJson);
