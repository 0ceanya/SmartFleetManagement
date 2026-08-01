using Microsoft.AspNetCore.Mvc;
using SmartFM.Api.Dtos.Reports;
using SmartFM.Application.Coordinators;

namespace SmartFM.Api.Controllers;

[ApiController]
[Route("api/reports")]
public class ReportsController : ControllerBase
{
    private readonly ReportingCoordinator _coordinator;

    public ReportsController(ReportingCoordinator coordinator)
    {
        _coordinator = coordinator;
    }

    [HttpPost]
    [ProducesResponseType(typeof(ReportResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<ReportResponse>> GenerateReport(GenerateReportRequest request)
    {
        var report = await _coordinator.GenerateReportAsync(request.ReportType, request.From, request.To, request.BranchId);
        var response = ReportResponse.FromEntity(report);
        return CreatedAtAction(nameof(GetReports), response);
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<ReportResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<ReportResponse>>> GetReports()
    {
        var reports = await _coordinator.GetReportsAsync();
        return Ok(reports.Select(ReportResponse.FromEntity));
    }

    [HttpGet("audit-records")]
    [ProducesResponseType(typeof(IEnumerable<AuditRecordResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AuditRecordResponse>>> GetAuditRecords()
    {
        var records = await _coordinator.GetAuditRecordsAsync();
        return Ok(records.Select(AuditRecordResponse.FromEntity));
    }
}
