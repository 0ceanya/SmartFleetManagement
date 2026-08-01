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
        var assignment = await _coordinator.CreateAssignmentAsync(
            request.ShipmentIds, request.DriverId, request.VehicleId, request.Route?.ToRouteData(), request.WarehouseId);
        var route = assignment.RouteId is null ? null : await _coordinator.GetRouteByIdAsync(assignment.RouteId.Value);
        var response = AssignmentResponse.FromEntity(assignment, request.ShipmentIds, route);
        return CreatedAtAction(nameof(GetAssignmentById), new { id = assignment.Id }, response);
    }

    [HttpPost("assignments/{id:guid}/approve")]
    [ProducesResponseType(typeof(AssignmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<AssignmentResponse>> ApproveAssignment(Guid id)
    {
        var assignment = await _coordinator.ApproveAssignmentAsync(id);
        var details = await _coordinator.GetAssignmentDetailsAsync(id);
        return Ok(AssignmentResponse.FromEntity(assignment, details!.Value.ShipmentIds, details.Value.Route));
    }

    [HttpPost("assignments/{id:guid}/complete")]
    [ProducesResponseType(typeof(AssignmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssignmentResponse>> CompleteAssignment(Guid id)
    {
        var assignment = await _coordinator.CompleteAssignmentAsync(id);
        var details = await _coordinator.GetAssignmentDetailsAsync(id);
        return Ok(AssignmentResponse.FromEntity(assignment, details!.Value.ShipmentIds, details.Value.Route));
    }

    [HttpGet("assignments/{id:guid}")]
    [ProducesResponseType(typeof(AssignmentResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<AssignmentResponse>> GetAssignmentById(Guid id)
    {
        var details = await _coordinator.GetAssignmentDetailsAsync(id);
        if (details is null)
            return Problem(detail: $"Assignment {id} not found.", statusCode: StatusCodes.Status404NotFound);
        return Ok(AssignmentResponse.FromEntity(details.Value.Assignment, details.Value.ShipmentIds, details.Value.Route));
    }

    [HttpGet("assignments")]
    [ProducesResponseType(typeof(IEnumerable<AssignmentResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<AssignmentResponse>>> GetAssignments([FromQuery] string? status, [FromQuery] Guid? driverId)
    {
        var assignments = await _coordinator.GetAssignmentsAsync(status, driverId);
        return Ok(assignments.Select(a => AssignmentResponse.FromEntity(a.Assignment, a.ShipmentIds, a.Route)));
    }

    [HttpPost("shipments/{shipmentId:guid}/delivery-confirmation")]
    [ProducesResponseType(typeof(DeliveryConfirmationResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DeliveryConfirmationResponse>> CreateDeliveryConfirmation(Guid shipmentId, CreateDeliveryConfirmationRequest request)
    {
        var confirmation = await _coordinator.CreateDeliveryConfirmationAsync(
            shipmentId, request.DriverId, request.RecipientName, request.ProofSignature, request.GpsLatitude, request.GpsLongitude);
        var response = DeliveryConfirmationResponse.FromEntity(confirmation);
        return CreatedAtAction(nameof(GetDeliveryConfirmation), new { shipmentId }, response);
    }

    [HttpGet("shipments/{shipmentId:guid}/delivery-confirmation")]
    [ProducesResponseType(typeof(DeliveryConfirmationResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<DeliveryConfirmationResponse>> GetDeliveryConfirmation(Guid shipmentId)
    {
        var confirmation = await _coordinator.GetDeliveryConfirmationByShipmentIdAsync(shipmentId);
        if (confirmation is null)
            return Problem(detail: $"Delivery confirmation for shipment {shipmentId} not found.", statusCode: StatusCodes.Status404NotFound);
        return Ok(DeliveryConfirmationResponse.FromEntity(confirmation));
    }

    [HttpPost("shipments/{id:guid}/load-manifest")]
    [ProducesResponseType(typeof(LoadManifestResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LoadManifestResponse>> CreateLoadManifest(Guid id)
    {
        var manifest = await _coordinator.GenerateAndResolveLoadManifestAsync(id);
        return CreatedAtAction(nameof(CreateLoadManifest), new { id }, LoadManifestResponse.FromEntity(manifest));
    }

    [HttpPut("shipments/{id:guid}/load-manifest/resolve")]
    [ProducesResponseType(typeof(LoadManifestResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<LoadManifestResponse>> ResolveLoadManifestAtDropoff(Guid id, ResolveLoadManifestRequest request)
    {
        var updatedManifest = await _coordinator.ResolveLoadManifestAtDropoffAsync(id, request.DamagedOrMissingItems);
        return Ok(LoadManifestResponse.FromEntity(updatedManifest));
    }
}
