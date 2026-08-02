using System.ComponentModel.DataAnnotations;
using SmartFM.Domain.Records;

namespace SmartFM.Api.Dtos.Incidents;

public record ReportIncidentRequest
{
    [Required]
    public Guid ShipmentId { get; init; }

    [Required]
    public string Description { get; init; } = string.Empty;

    [Required]
    public string Severity { get; init; } = string.Empty;

    [Required]
    public string Category { get; init; } = string.Empty;
}

public record IncidentRecordResponse(Guid Id, Guid VehicleId, Guid? ShipmentId, string Description, string Severity, string Category, DateTime CreatedAt)
{
    public static IncidentRecordResponse FromEntity(IncidentRecord record) =>
        new(record.Id, record.VehicleId, record.ShipmentId, record.Description, record.Severity, record.Category, record.CreatedAt);
}
