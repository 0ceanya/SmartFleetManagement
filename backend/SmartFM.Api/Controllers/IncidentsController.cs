using Microsoft.AspNetCore.Mvc;
using SmartFM.Api.Dtos.Incidents;
using SmartFM.Application.Coordinators;

namespace SmartFM.Api.Controllers;

[ApiController]
[Route("api/incidents")]
public class IncidentsController : ControllerBase
{
    private readonly IncidentCoordinator _coordinator;

    public IncidentsController(IncidentCoordinator coordinator)
    {
        _coordinator = coordinator;
    }

    [HttpGet]
    [ProducesResponseType(typeof(IEnumerable<IncidentRecordResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<IncidentRecordResponse>>> GetIncidentRecords()
    {
        var records = await _coordinator.GetIncidentRecordsAsync();
        return Ok(records.Select(IncidentRecordResponse.FromEntity));
    }

    [HttpPost]
    [ProducesResponseType(typeof(IncidentRecordResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<IncidentRecordResponse>> ReportIncident(ReportIncidentRequest request)
    {
        var incident = await _coordinator.ReportIncidentForShipmentAsync(request.ShipmentId, request.Description, request.Severity);
        var response = IncidentRecordResponse.FromEntity(incident);
        return CreatedAtAction(nameof(GetIncidentRecords), response);
    }
}
