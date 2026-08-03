using Microsoft.AspNetCore.Mvc;
using SmartFM.Api.Dtos.Tracking;
using SmartFM.Application.Abstractions;
using SmartFM.Domain.Records;

namespace SmartFM.Api.Controllers;

[ApiController]
[Route("api/tracking")]
public class TrackingController : ControllerBase
{
    private readonly IRepository<TrackingRecord> _trackingRecords;

    public TrackingController(IRepository<TrackingRecord> trackingRecords)
    {
        _trackingRecords = trackingRecords;
    }

    /// <summary>
    /// Get mock GPS waypoint records for a vehicle or assignment.
    /// Example: GET /api/tracking/records?vehicleId={id}
    /// </summary>
    [HttpGet("records")]
    [ProducesResponseType(typeof(IEnumerable<TrackingRecordResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<TrackingRecordResponse>>> GetTrackingRecords(
        [FromQuery] Guid? vehicleId,
        [FromQuery] Guid? assignmentId)
    {
        var all = await _trackingRecords.GetAllAsync();

        if (vehicleId is not null)
            all = all.Where(r => r.VehicleId == vehicleId.Value);
        if (assignmentId is not null)
            all = all.Where(r => r.AssignmentId == assignmentId.Value);

        return Ok(all.OrderBy(r => r.CreatedAt).Select(TrackingRecordResponse.FromEntity));
    }
}
