using System.ComponentModel.DataAnnotations;
using SmartFM.Domain.Entities;

namespace SmartFM.Api.Dtos.MasterData;

public record CreateDriverRequest
{
    [Required]
    public string Name { get; init; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    public Guid BranchId { get; init; }

    [Required]
    public string LicenseNumber { get; init; } = string.Empty;
}

public record CreateStaffRequest
{
    [Required]
    public string Name { get; init; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    public Guid BranchId { get; init; }

    [Required]
    public string Department { get; init; } = string.Empty;
}

public record CreateManagerRequest
{
    [Required]
    public string Name { get; init; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    public Guid BranchId { get; init; }
}

public record UpdateEmployeeRequest
{
    [Required]
    public string Name { get; init; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; init; } = string.Empty;
}

public record EmployeeResponse(
    Guid Id,
    string Type,
    string Name,
    string Email,
    Guid BranchId,
    string? LicenseNumber,
    bool? IsAvailable,
    string? Department)
{
    public static EmployeeResponse FromEntity(Employee employee) => employee switch
    {
        Driver driver => new(driver.Id, "Driver", driver.Name, driver.Email, driver.BranchId, driver.LicenseNumber, driver.IsAvailable, null),
        Staff staff => new(staff.Id, "Staff", staff.Name, staff.Email, staff.BranchId, null, null, staff.Department),
        Manager manager => new(manager.Id, "Manager", manager.Name, manager.Email, manager.BranchId, null, null, null),
        _ => new(employee.Id, "Unknown", employee.Name, employee.Email, employee.BranchId, null, null, null)
    };
}
