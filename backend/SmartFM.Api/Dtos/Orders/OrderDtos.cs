using System.ComponentModel.DataAnnotations;
using SmartFM.Domain.Entities;

namespace SmartFM.Api.Dtos.Orders;

public record CargoItemRequest
{
    [Required]
    public string Description { get; init; } = string.Empty;

    [Range(typeof(decimal), "0.01", "79228162514264337593543950335")]
    public decimal WeightKg { get; init; }

    [Range(typeof(decimal), "0.01", "79228162514264337593543950335")]
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
    public List<CargoItemRequest> CargoItems { get; init; } = [];
}

public record CargoResponse(Guid Id, string Description, decimal WeightKg, decimal? VolumeCbm, bool IsHazardous)
{
    public static CargoResponse FromEntity(Cargo cargo) =>
        new(cargo.Id, cargo.Description, cargo.WeightKg, cargo.VolumeCbm, cargo.IsHazardous);
}

public record ShipmentSummaryResponse(Guid Id, string Status, DateTime CreatedAt, IReadOnlyList<CargoResponse> Cargoes)
{
    public static ShipmentSummaryResponse FromEntity(Shipment shipment, IReadOnlyList<Cargo> cargoes) =>
        new(shipment.Id, shipment.Status, shipment.CreatedAt, cargoes.Select(CargoResponse.FromEntity).ToList());
}

public record OrderDetailsResponse(Guid Id, Guid CustomerId, Guid OfferingId, string Status, DateTime CreatedAt, ShipmentSummaryResponse? Shipment)
{
    public static OrderDetailsResponse FromEntity(Order order, Shipment? shipment, IReadOnlyList<Cargo> cargoes) =>
        new(order.Id, order.CustomerId, order.OfferingId, order.Status, order.CreatedAt,
            shipment is null ? null : ShipmentSummaryResponse.FromEntity(shipment, cargoes));
}

public record OrderSummaryResponse(Guid Id, Guid CustomerId, Guid OfferingId, string Status, DateTime CreatedAt)
{
    public static OrderSummaryResponse FromEntity(Order order) =>
        new(order.Id, order.CustomerId, order.OfferingId, order.Status, order.CreatedAt);
}
