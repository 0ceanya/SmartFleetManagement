using System.ComponentModel.DataAnnotations;
using SmartFM.Domain.Entities;
using SmartFM.Domain.ValueObjects;
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
    [Required, MinLength(1)]
    public List<Guid> ShipmentIds { get; init; } = [];

    [Required]
    public Guid DriverId { get; init; }

    [Required]
    public Guid VehicleId { get; init; }

    [Required]
    public Guid RouteId { get; init; }
}

public record AssignmentResponse(Guid Id, IReadOnlyList<Guid> ShipmentIds, Guid DriverId, Guid VehicleId, Guid RouteId, string Status, DateTime CreatedAt)
{
    public static AssignmentResponse FromEntity(Assignment assignment, IReadOnlyList<Guid> shipmentIds) =>
        new(assignment.Id, shipmentIds, assignment.DriverId, assignment.VehicleId, assignment.RouteId, assignment.Status, assignment.CreatedAt);
}

public record CreateDeliveryConfirmationRequest
{
    [Required]
    public Guid DriverId { get; init; }

    [Required]
    public string RecipientName { get; init; } = string.Empty;

    [Required]
    public string ProofSignature { get; init; } = string.Empty;

    [Range(-90, 90)]
    public double GpsLatitude { get; init; }

    [Range(-180, 180)]
    public double GpsLongitude { get; init; }
}

public record DeliveryConfirmationResponse(Guid ShipmentId, Guid DriverId, string RecipientName, string ProofSignature, double GpsLatitude, double GpsLongitude, DateTime ConfirmedAt)
{
    public static DeliveryConfirmationResponse FromEntity(DeliveryConfirmation confirmation) =>
        new(confirmation.ShipmentId, confirmation.DriverId, confirmation.RecipientName, confirmation.ProofSignature,
            confirmation.GpsLatitude, confirmation.GpsLongitude, confirmation.ConfirmedAt);
}
