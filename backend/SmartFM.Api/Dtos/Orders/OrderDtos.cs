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
    public string PickupAddress { get; init; } = string.Empty;

    [Required]
    public string DeliveryAddress { get; init; } = string.Empty;

    [Range(typeof(decimal), "0.01", "79228162514264337593543950335", ParseLimitsInInvariantCulture = true)]
    public decimal? OrderWeightKg { get; init; }

    [Required]
    [MinLength(1)]
    public List<CargoItemRequest> CargoItems { get; init; } = [];
}

public record CargoResponse(Guid Id, string Description, decimal WeightKg, decimal? VolumeCbm, bool IsHazardous)
{
    public static CargoResponse FromEntity(Cargo cargo) =>
        new(cargo.Id, cargo.Description, cargo.WeightKg, cargo.VolumeCbm, cargo.IsHazardous);
}

public record ShipmentSummaryResponse(Guid Id, string PickupAddress, string DeliveryAddress, Guid? WarehouseId, string Status, DateTime CreatedAt)
{
    public static ShipmentSummaryResponse FromEntity(Shipment shipment) =>
        new(shipment.Id, shipment.PickupAddress, shipment.DeliveryAddress, shipment.WarehouseId, shipment.Status, shipment.CreatedAt);
}

public record OrderDetailsResponse(Guid Id, Guid CustomerId, Guid OfferingId, decimal OrderWeightKg, string Status, DateTime CreatedAt, IReadOnlyList<CargoResponse> Cargoes, IReadOnlyList<ShipmentSummaryResponse> Shipments)
{
    public static OrderDetailsResponse FromEntity(Order order, IReadOnlyList<Cargo> cargoes, IReadOnlyList<Shipment> shipments) =>
        new(order.Id, order.CustomerId, order.OfferingId, order.OrderWeightKg, order.Status, order.CreatedAt,
            cargoes.Select(CargoResponse.FromEntity).ToList(),
            shipments.Select(ShipmentSummaryResponse.FromEntity).ToList());
}

public record OrderSummaryResponse(Guid Id, Guid CustomerId, Guid OfferingId, decimal OrderWeightKg, string Status, DateTime CreatedAt)
{
    public static OrderSummaryResponse FromEntity(Order order) =>
        new(order.Id, order.CustomerId, order.OfferingId, order.OrderWeightKg, order.Status, order.CreatedAt);
}
