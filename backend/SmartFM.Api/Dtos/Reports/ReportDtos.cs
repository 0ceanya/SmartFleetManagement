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

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (To < From)
            yield return new ValidationResult("To must not be earlier than From.", [nameof(To)]);
    }
}

public record ReportResponse(string ReportType, DateTime From, DateTime To, string Content, DateTime GeneratedAt)
{
    public static ReportResponse FromEntity(Report report) =>
        new(report.ReportType, report.From, report.To, report.Content, report.GeneratedAt);
}

public record AuditRecordResponse(Guid Id, string Action, string PerformedBy, string Details, DateTime CreatedAt)
{
    public static AuditRecordResponse FromEntity(AuditRecord record) =>
        new(record.Id, record.Action, record.PerformedBy, record.Details, record.CreatedAt);
}
