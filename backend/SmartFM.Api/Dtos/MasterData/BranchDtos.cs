using System.ComponentModel.DataAnnotations;
using SmartFM.Domain.Entities;

namespace SmartFM.Api.Dtos.MasterData;

public record CreateBranchRequest
{
    [Required]
    public string Name { get; init; } = string.Empty;

    [Required]
    public string City { get; init; } = string.Empty;
}

public record UpdateBranchRequest
{
    [Required]
    public string Name { get; init; } = string.Empty;

    [Required]
    public string City { get; init; } = string.Empty;
}

public record PatchBranchRequest
{
    public string? Name { get; init; }
    public string? City { get; init; }
}

public record BranchResponse(Guid Id, string Name, string City)
{
    public static BranchResponse FromEntity(Branch branch) => new(branch.Id, branch.Name, branch.City);
}
