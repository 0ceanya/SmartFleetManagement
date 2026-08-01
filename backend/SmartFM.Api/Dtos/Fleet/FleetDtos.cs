using System.ComponentModel.DataAnnotations;
using System.Text.Json;
using SmartFM.Application.Coordinators;
using SmartFM.Domain.Entities;
using SmartFM.Domain.ValueObjects;
using Route = SmartFM.Domain.Entities.Route;

namespace SmartFM.Api.Dtos.Fleet;

public record RouteRequest
{
    [Required]
    public string OriginAddress { get; init; } = string.Empty;

    [Required]
    public string DestinationAddress { get; init; } = string.Empty;

    public List<string>? Waypoints { get; init; }

    [Range(typeof(double), "0.01", "1.7976931348623157E+308", ParseLimitsInInvariantCulture = true)]
    public double? DistanceKm { get; init; }

    [Range(1, int.MaxValue)]
    public int? EstimatedDurationMinutes { get; init; }

    public Application.Coordinators.RouteData ToRouteData() => new(OriginAddress, DestinationAddress, Waypoints, DistanceKm, EstimatedDurationMinutes);
}

public record RouteResponse(Guid Id, string OriginAddress, string DestinationAddress, IReadOnlyList<string>? Waypoints, double? DistanceKm, int? EstimatedDurationMinutes)
{
    public static RouteResponse FromEntity(Route route) =>
        new(route.Id, route.OriginAddress, route.DestinationAddress,
            route.WaypointsJson is null ? null : JsonSerializer.Deserialize<List<string>>(route.WaypointsJson),
            route.DistanceKm, route.EstimatedDurationMinutes);
}

public record CreateAssignmentRequest
{
    [Required, MinLength(1)]
    public List<Guid> ShipmentIds { get; init; } = [];

    [Required]
    public Guid DriverId { get; init; }

    [Required]
    public Guid VehicleId { get; init; }

    public RouteRequest? Route { get; init; }

    public Guid? WarehouseId { get; init; }
}

public record AssignmentResponse(Guid Id, IReadOnlyList<Guid> ShipmentIds, Guid DriverId, Guid VehicleId, RouteResponse? Route, string Status, DateTime CreatedAt)
{
    public static AssignmentResponse FromEntity(Assignment assignment, IReadOnlyList<Guid> shipmentIds, Route? route) =>
        new(assignment.Id, shipmentIds, assignment.DriverId, assignment.VehicleId,
            route is null ? null : RouteResponse.FromEntity(route), assignment.Status, assignment.CreatedAt);
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

public record DeliveryConfirmationResponse(Guid ShipmentId, Guid DriverId, string RecipientName, string ProofSignature, double GpsLatitude, double GpsLongitude, DateTime ConfirmedAt, IReadOnlyList<string>? DamagedOrMissingItems)
{
    public static DeliveryConfirmationResponse FromEntity(DeliveryConfirmation confirmation) =>
        new(confirmation.ShipmentId, confirmation.DriverId, confirmation.RecipientName, confirmation.ProofSignature,
            confirmation.GpsLatitude, confirmation.GpsLongitude, confirmation.ConfirmedAt, confirmation.DamagedOrMissingItems);
}

public record ResolveLoadManifestRequest
{
    public List<string>? DamagedOrMissingItems { get; init; }
}

public record LoadManifestResponse(
    Guid ShipmentId,
    IReadOnlyList<string> CargoDescriptions,
    decimal TotalWeightKg,
    bool ContainsHazardous,
    DateTime CreatedAt,
    bool IsPickupResolved,
    bool IsDropoffResolved,
    IReadOnlyList<string>? DamagedOrMissingItems)
{
    public static LoadManifestResponse FromEntity(LoadManifest manifest) =>
        new(manifest.ShipmentId, manifest.CargoDescriptions, manifest.TotalWeightKg,
            manifest.ContainsHazardous, manifest.CreatedAt, manifest.IsPickupResolved, 
            manifest.IsDropoffResolved, manifest.DamagedOrMissingItems);
}
