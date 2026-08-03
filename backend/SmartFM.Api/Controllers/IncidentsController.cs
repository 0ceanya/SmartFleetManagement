using Microsoft.AspNetCore.Mvc;
using SmartFM.Api.Dtos.Incidents;
using SmartFM.Application.Coordinators;

namespace SmartFM.Api.Controllers;

[ApiController]
[Route("api/incidents")]
public class IncidentsController : ControllerBase
{
    private readonly RecordCoordinator _coordinator;

    public IncidentsController(RecordCoordinator coordinator)
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

    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(IncidentRecordResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<IncidentRecordResponse>> GetIncidentRecordById(Guid id)
    {
        var incident = await _coordinator.GetIncidentRecordByIdAsync(id);
        if (incident is null)
            return Problem(detail: $"Incident record {id} not found.", statusCode: StatusCodes.Status404NotFound);
        return Ok(IncidentRecordResponse.FromEntity(incident));
    }

    [HttpPost]
    [ProducesResponseType(typeof(IncidentRecordResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<IncidentRecordResponse>> ReportIncident(ReportIncidentRequest request)
    {
        var incident = await _coordinator.ReportIncidentForShipmentAsync(request.ShipmentId, request.Description, request.Severity, request.Category);
        var response = IncidentRecordResponse.FromEntity(incident);
        return CreatedAtAction(nameof(GetIncidentRecordById), new { id = incident.Id }, response);
    }
}
