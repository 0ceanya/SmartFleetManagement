namespace SmartFM.Domain.ValueObjects;

public record Report(
    string ReportType,
    DateTime From,
    DateTime To,
    string Content,
    DateTime GeneratedAt);
