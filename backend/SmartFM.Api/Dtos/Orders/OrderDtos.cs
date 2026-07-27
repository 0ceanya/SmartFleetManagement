using System.ComponentModel.DataAnnotations;
using SmartFM.Domain.Entities;

namespace SmartFM.Api.Dtos.Orders;

public record CargoItemRequest
{
    [Required]
    public string Description { get; init; } = string.Empty;

    [Range(typeof(decimal), "0.01", "79228162514264337593543950335", ParseLimitsInInvariantCulture = true)]
    public decimal WeightKg { get; init; }

    [Range(typeof(decimal), "0.01", "79228162514264337593543950335", ParseLimitsInInvariantCulture = true)]
    public decimal? VolumeCbm { get; init; }

    public bool IsHazardous { get; init; }
}

public record PlaceOrderRequest
{
    [Required]
    public string CustomerName { get; init; } = string.Empty;

    [Required, EmailAddress]
    public string CustomerEmail { get; init; } = string.Empty;

    [Required]
    public string CustomerPhone { get; init; } = string.Empty;

    [Required]
    public Guid OfferingId { get; init; }

    [Required]
    public Guid WarehouseId { get; init; }

    [Required]
    public List<CargoItemRequest> CargoItems { get; init; } = [];
}

public record CargoResponse(Guid Id, string Description, decimal WeightKg, decimal? VolumeCbm, bool IsHazardous)
{
    public static CargoResponse FromEntity(Cargo cargo) =>
        new(cargo.Id, cargo.Description, cargo.WeightKg, cargo.VolumeCbm, cargo.IsHazardous);
}

public record ShipmentSummaryResponse(Guid Id, Guid WarehouseId, string Status, DateTime CreatedAt, IReadOnlyList<CargoResponse> CargoItems)
{
    public static ShipmentSummaryResponse FromEntity(Shipment shipment, IReadOnlyList<Cargo> cargoItems) =>
        new(shipment.Id, shipment.WarehouseId, shipment.Status, shipment.CreatedAt, cargoItems.Select(CargoResponse.FromEntity).ToList());
}

public record OrderDetailsResponse(Guid Id, Guid CustomerId, Guid OfferingId, string Status, DateTime CreatedAt, IReadOnlyList<ShipmentSummaryResponse> Shipments)
{
    public static OrderDetailsResponse FromEntity(Order order, IReadOnlyList<(Shipment Shipment, IReadOnlyList<Cargo> Cargoes)> shipments) =>
        new(order.Id, order.CustomerId, order.OfferingId, order.Status, order.CreatedAt,
            shipments.Select(s => ShipmentSummaryResponse.FromEntity(s.Shipment, s.Cargoes)).ToList());
}

public record OrderSummaryResponse(Guid Id, Guid CustomerId, Guid OfferingId, string Status, DateTime CreatedAt)
{
    public static OrderSummaryResponse FromEntity(Order order) =>
        new(order.Id, order.CustomerId, order.OfferingId, order.Status, order.CreatedAt);
}
