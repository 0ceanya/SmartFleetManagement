using System.ComponentModel.DataAnnotations;
using SmartFM.Domain.Entities;

namespace SmartFM.Api.Dtos.MasterData;

public record CreateOfferingRequest
{
    [Required]
    public string Name { get; init; } = string.Empty;

    public string Description { get; init; } = string.Empty;

    [Range(typeof(decimal), "0.01", "79228162514264337593543950335", ParseLimitsInInvariantCulture = true)]
    public decimal BasePrice { get; init; }

    [Range(typeof(decimal), "0.01", "79228162514264337593543950335", ParseLimitsInInvariantCulture = true)]
    public decimal MaxWeightKg { get; init; }

    [Range(typeof(decimal), "0", "79228162514264337593543950335", ParseLimitsInInvariantCulture = true)]
    public decimal MaxVolumeCbm { get; init; }

    [Required, AllowedValues("Light", "Medium", "Heavy")]
    public string VehicleClass { get; init; } = string.Empty;
}

public record UpdateOfferingRequest
{
    public string Description { get; init; } = string.Empty;

    [Range(typeof(decimal), "0.01", "79228162514264337593543950335", ParseLimitsInInvariantCulture = true)]
    public decimal BasePrice { get; init; }

    [Range(typeof(decimal), "0.01", "79228162514264337593543950335", ParseLimitsInInvariantCulture = true)]
    public decimal MaxWeightKg { get; init; }

    [Range(typeof(decimal), "0", "79228162514264337593543950335", ParseLimitsInInvariantCulture = true)]
    public decimal MaxVolumeCbm { get; init; }
}

public record OfferingResponse(Guid Id, string Name, string Description, decimal BasePrice, decimal MaxWeightKg, decimal MaxVolumeCbm, string VehicleClass)
{
    public static OfferingResponse FromEntity(Offering offering) =>
        new(offering.Id, offering.Name, offering.Description, offering.BasePrice, offering.MaxWeightKg, offering.MaxVolumeCbm, offering.VehicleClass);
}
