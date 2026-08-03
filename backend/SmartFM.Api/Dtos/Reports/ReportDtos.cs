using System.ComponentModel.DataAnnotations;
using SmartFM.Domain.Records;
using SmartFM.Domain.ValueObjects;

namespace SmartFM.Api.Dtos.Reports;

public record GenerateReportRequest : IValidatableObject
{
    [Required]
    public string ReportType { get; init; } = string.Empty;

    [Required]
    public DateTime From { get; init; }

    [Required]
    public DateTime To { get; init; }

    public Guid? BranchId { get; init; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (To < From)
            yield return new ValidationResult("To must not be earlier than From.", [nameof(To)]);
    }
}

public record ReportResponse(
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
    string AssignmentsByDriverJson)
{
    public static ReportResponse FromEntity(Report report) =>
        new(
            ReportType: report.ReportType,
            From: report.From,
            To: report.To,
            Content: report.Content,
            GeneratedAt: report.GeneratedAt,
            BranchId: report.BranchId,
            TotalAssignments: report.TotalAssignments,
            ActiveVehicles: report.ActiveVehicles,
            IncidentCount: report.IncidentCount,
            TotalCargoWeightKg: report.TotalCargoWeightKg,
            Revenue: report.Revenue,
            AssignmentsByDayJson: report.AssignmentsByDayJson,
            AssignmentsByBranchJson: report.AssignmentsByBranchJson,
            AssignmentsByDriverJson: report.AssignmentsByDriverJson);
}

