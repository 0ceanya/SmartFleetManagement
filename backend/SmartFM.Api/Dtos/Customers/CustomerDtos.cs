using System.ComponentModel.DataAnnotations;
using SmartFM.Domain.Entities;

namespace SmartFM.Api.Dtos.Customers;

public record CreateCustomerRequest
{
    [Required]
    public string Name { get; init; } = string.Empty;

    [Required, EmailAddress]
    public string Email { get; init; } = string.Empty;

    [Required]
    public string Phone { get; init; } = string.Empty;
}

public record CustomerResponse(
    Guid Id,
    string Name,
    string Email,
    string Phone)
{
    public static CustomerResponse FromEntity(Customer customer) => 
        new(customer.Id, customer.Name, customer.Email, customer.Phone);
}
