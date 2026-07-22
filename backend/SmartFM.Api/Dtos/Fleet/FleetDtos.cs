using System.ComponentModel.DataAnnotations;
using SmartFM.Domain.Entities;
using Route = SmartFM.Domain.Entities.Route;

namespace SmartFM.Api.Dtos.Fleet;

public record CreateRouteRequest
{
    [Required]
    public Guid OriginWarehouseId { get; init; }

    [Required]
    public Guid DestinationWarehouseId { get; init; }

    [Range(typeof(decimal), "0.01", "79228162514264337593543950335", ParseLimitsInInvariantCulture = true)]
    public decimal EstimatedDistanceKm { get; init; }
}

public record RouteResponse(Guid Id, Guid OriginWarehouseId, Guid DestinationWarehouseId, decimal EstimatedDistanceKm, decimal EstimatedDurationHours)
{
    public static RouteResponse FromEntity(Route route) =>
        new(route.Id, route.OriginWarehouseId, route.DestinationWarehouseId, route.EstimatedDistanceKm, route.EstimatedDurationHours);
}

public record CreateAssignmentRequest
{
    [Required]
    public Guid ShipmentId { get; init; }

    [Required]
    public Guid DriverId { get; init; }

    [Required]
    public Guid VehicleId { get; init; }

    [Required]
    public Guid RouteId { get; init; }
}

public record AssignmentResponse(Guid Id, Guid ShipmentId, Guid DriverId, Guid VehicleId, Guid RouteId, string Status, DateTime CreatedAt)
{
    public static AssignmentResponse FromEntity(Assignment assignment) =>
        new(assignment.Id, assignment.ShipmentId, assignment.DriverId, assignment.VehicleId, assignment.RouteId, assignment.Status, assignment.CreatedAt);
}
