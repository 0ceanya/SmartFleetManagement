using Microsoft.AspNetCore.Mvc;
using SmartFM.Api.Dtos.Fleet;
using SmartFM.Application.Coordinators;

namespace SmartFM.Api.Controllers;

[ApiController]
[Route("api/fleet")]
public class FleetController : ControllerBase
{
    private readonly FleetAssignmentCoordinator _coordinator;

    public FleetController(FleetAssignmentCoordinator coordinator)
    {
        _coordinator = coordinator;
    }

    [HttpPost("routes")]
    [ProducesResponseType(typeof(RouteResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<RouteResponse>> CreateRoute(CreateRouteRequest request)
    {
        var route = await _coordinator.CreateRouteAsync(request.OriginWarehouseId, request.DestinationWarehouseId, request.EstimatedDistanceKm);
        var response = RouteResponse.FromEntity(route);
        return CreatedAtAction(nameof(GetRouteById), new { id = route.Id }, response);
    }

    [HttpGet("routes/{id:guid}")]
    [ProducesResponseType(typeof(RouteResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<RouteResponse>> GetRouteById(Guid id)
    {
        var route = await _coordinator.GetRouteByIdAsync(id);
        if (route is null)
            return Problem(detail: $"Route {id} not found.", statusCode: StatusCodes.Status404NotFound);
        return Ok(RouteResponse.FromEntity(route));
    }

    [HttpPost("assignments")]
    [ProducesResponseType(typeof(AssignmentResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AssignmentResponse>> CreateAssignment(CreateAssignmentRequest request)
    {
        var assignment = await _coordinator.CreateAssignmentAsync(request.ShipmentId, request.DriverId, request.VehicleId, request.RouteId);
        var response = AssignmentResponse.FromEntity(assignment);
        return CreatedAtAction(nameof(GetAssignmentById), new { id = assignment.Id }, response);
    }

    [HttpPost("assignments/{id:guid}/complete")]
    [ProducesResponseType(typeof(AssignmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssignmentResponse>> CompleteAssignment(Guid id)
    {
        var assignment = await _coordinator.CompleteAssignmentAsync(id);
        return Ok(AssignmentResponse.FromEntity(assignment));
    }

    [HttpGet("assignments/{id:guid}")]
    [ProducesResponseType(typeof(AssignmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssignmentResponse>> GetAssignmentById(Guid id)
    {
        var assignment = await _coordinator.GetAssignmentByIdAsync(id);
        if (assignment is null)
            return Problem(detail: $"Assignment {id} not found.", statusCode: StatusCodes.Status404NotFound);
        return Ok(AssignmentResponse.FromEntity(assignment));
    }

    [HttpGet("assignments")]
    [ProducesResponseType(typeof(IEnumerable<AssignmentResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AssignmentResponse>>> GetAssignments([FromQuery] string? status)
    {
        var assignments = await _coordinator.GetAssignmentsAsync(status);
        return Ok(assignments.Select(AssignmentResponse.FromEntity));
    }
}
