using System.ComponentModel.DataAnnotations;
using SmartFM.Domain.Entities;

namespace SmartFM.Api.Dtos.MasterData;

public record CreateVehicleRequest
{
    [Required]
    public string RegistrationNumber { get; init; } = string.Empty;

    [Required]
    public Guid BranchId { get; init; }

    [Required, AllowedValues("Light", "Medium", "Heavy")]
    public string VehicleClass { get; init; } = string.Empty;
}

public record UpdateVehicleStatusRequest
{
    [Required, AllowedValues("Available", "Assigned", "UnderMaintenance")]
    public string Status { get; init; } = string.Empty;
}

public record VehicleResponse(Guid Id, string RegistrationNumber, string CurrentStatus, Guid BranchId, double MaxPayloadKg, string VehicleClass)
{
    public static VehicleResponse FromEntity(Vehicle vehicle)
    {
        var vehicleClass = vehicle switch
        {
            LightVehicle => "Light",
            MediumVehicle => "Medium",
            HeavyVehicle => "Heavy",
            _ => "Unknown"
        };
        return new(vehicle.Id, vehicle.RegistrationNumber, vehicle.CurrentStatus, vehicle.BranchId, vehicle.MaxPayloadKg, vehicleClass);
    }
}
