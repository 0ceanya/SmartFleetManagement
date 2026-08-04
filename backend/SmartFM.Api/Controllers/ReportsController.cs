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
    [HttpPost("generate")]
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

    [HttpGet("summary")]
    [ProducesResponseType(typeof(DashboardSummaryResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DashboardSummaryResponse>> GetSummary(
        [FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] Guid? branchId, [FromQuery] string? vehicleType)
    {
        var summary = await _coordinator.GetDashboardSummaryAsync(from, to, branchId, vehicleType);
        return Ok(DashboardSummaryResponse.FromDomain(summary));
    }

    [HttpGet("trips-over-time")]
    [ProducesResponseType(typeof(IEnumerable<TripsPerDayResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TripsPerDayResponse>>> GetTripsOverTime(
        [FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] Guid? branchId, [FromQuery] string? vehicleType)
    {
        var entries = await _coordinator.GetTripsOverTimeAsync(from, to, branchId, vehicleType);
        return Ok(entries.Select(TripsPerDayResponse.FromDomain));
    }

    [HttpGet("trips-by-vehicle-type")]
    [ProducesResponseType(typeof(IEnumerable<TripsByVehicleTypeResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TripsByVehicleTypeResponse>>> GetTripsByVehicleType(
        [FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] Guid? branchId)
    {
        var entries = await _coordinator.GetTripsByVehicleTypeAsync(from, to, branchId);
        return Ok(entries.Select(TripsByVehicleTypeResponse.FromDomain));
    }

    [HttpGet("vehicles")]
    [ProducesResponseType(typeof(VehicleReportResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<VehicleReportResponse>> GetVehicleReport(
        [FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] string? search, [FromQuery] string? vehicleType, [FromQuery] string? status)
    {
        var (cards, rows) = await _coordinator.GetVehicleReportAsync(from, to, search, vehicleType, status);
        return Ok(new VehicleReportResponse(VehicleReportCardsResponse.FromDomain(cards), rows.Select(VehicleReportRowResponse.FromDomain).ToList()));
    }

    [HttpGet("drivers")]
    [ProducesResponseType(typeof(DriverReportResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<DriverReportResponse>> GetDriverReport(
        [FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] string? search, [FromQuery] Guid? branchId, [FromQuery] string? status)
    {
        var (cards, rows) = await _coordinator.GetDriverReportAsync(from, to, search, branchId, status);
        return Ok(new DriverReportResponse(DriverReportCardsResponse.FromDomain(cards), rows.Select(DriverReportRowResponse.FromDomain).ToList()));
    }

    [HttpGet("staff")]
    [ProducesResponseType(typeof(StaffReportResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<StaffReportResponse>> GetStaffReport(
        [FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] string? search, [FromQuery] Guid? branchId)
    {
        var (cards, rows) = await _coordinator.GetStaffReportAsync(from, to, search, branchId);
        return Ok(new StaffReportResponse(StaffReportCardsResponse.FromDomain(cards), rows.Select(StaffReportRowResponse.FromDomain).ToList()));
    }

    [HttpGet("orders")]
    [ProducesResponseType(typeof(OrderReportResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<OrderReportResponse>> GetOrderReport(
        [FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] string? search, [FromQuery] string? status)
    {
        var (cards, rows) = await _coordinator.GetOrderReportAsync(from, to, search, status);
        return Ok(new OrderReportResponse(OrderReportCardsResponse.FromDomain(cards), rows.Select(OrderReportRowResponse.FromDomain).ToList()));
    }

    [HttpGet("assignments")]
    [ProducesResponseType(typeof(AssignmentReportResponse), StatusCodes.Status200OK)]
    public async Task<ActionResult<AssignmentReportResponse>> GetAssignmentReport(
        [FromQuery] DateTime from, [FromQuery] DateTime to, [FromQuery] string? search, [FromQuery] string? status)
    {
        var (cards, rows) = await _coordinator.GetAssignmentReportAsync(from, to, search, status);
        return Ok(new AssignmentReportResponse(AssignmentReportCardsResponse.FromDomain(cards), rows.Select(AssignmentReportRowResponse.FromDomain).ToList()));
    }
}
