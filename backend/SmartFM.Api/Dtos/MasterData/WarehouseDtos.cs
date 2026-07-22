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
}

public record UpdateWarehouseRequest
{
    [Required]
    public string Name { get; init; } = string.Empty;

    [Required]
    public string Address { get; init; } = string.Empty;
}

public record WarehouseResponse(Guid Id, string Name, string Address, Guid BranchId)
{
    public static WarehouseResponse FromEntity(Warehouse warehouse) =>
        new(warehouse.Id, warehouse.Name, warehouse.Address, warehouse.BranchId);
}
