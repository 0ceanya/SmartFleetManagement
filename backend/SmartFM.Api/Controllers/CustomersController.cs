using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SmartFM.Api.Dtos.Customers;
using SmartFM.Domain.Entities;
using SmartFM.Infrastructure.Persistence;

namespace SmartFM.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CustomersController : ControllerBase
{
    private readonly SmartFMDbContext _dbContext;

    public CustomersController(SmartFMDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpPost]
    public async Task<ActionResult<CustomerResponse>> CreateCustomer([FromBody] CreateCustomerRequest request)
    {
        var customer = new Customer(request.Name, request.Email, request.Phone);

        _dbContext.Customers.Add(customer);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCustomerById), new { id = customer.Id }, CustomerResponse.FromEntity(customer));
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CustomerResponse>> GetCustomerById(Guid id)
    {
        var customer = await _dbContext.Customers.FindAsync(id);

        if (customer == null)
            return NotFound($"Customer with ID {id} not found.");

        return Ok(CustomerResponse.FromEntity(customer));
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CustomerResponse>>> GetCustomers()
    {
        var customers = await _dbContext.Customers.ToListAsync();
        return Ok(customers.Select(CustomerResponse.FromEntity));
    }
}
