using System.ComponentModel.DataAnnotations;
using SmartFM.Domain.Entities;

namespace SmartFM.Api.Dtos.MasterData;

public record CreateWarehouseRequest
{
    [Required]
    public string Name { get; init; } = string.Empty;

    [Required]
    public string Address { get; init; } = string.Empty;

    [Required]
    public Guid BranchId { get; init; }

    [Range(typeof(decimal), "0.01", "79228162514264337593543950335", ParseLimitsInInvariantCulture = true)]
    public decimal CapacityKg { get; init; }
}

public record UpdateWarehouseRequest
{
    [Required]
    public string Name { get; init; } = string.Empty;

    [Required]
    public string Address { get; init; } = string.Empty;
}

public record PatchWarehouseRequest
{
    public string? Name { get; init; }
    public string? Address { get; init; }
    public Guid? BranchId { get; init; }
    public decimal? CapacityKg { get; init; }
}

public record WarehouseResponse(Guid Id, string Name, string Address, Guid BranchId, decimal CapacityKg)
{
    public static WarehouseResponse FromEntity(Warehouse warehouse) =>
        new(warehouse.Id, warehouse.Name, warehouse.Address, warehouse.BranchId, warehouse.CapacityKg);
}
