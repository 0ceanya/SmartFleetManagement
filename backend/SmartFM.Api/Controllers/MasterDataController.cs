using Microsoft.AspNetCore.Mvc;
using SmartFM.Api.Dtos.MasterData;
using SmartFM.Application.Coordinators;

namespace SmartFM.Api.Controllers;

[ApiController]
[Route("api/master-data")]
public class MasterDataController : ControllerBase
{
    private readonly MasterDataCoordinator _coordinator;

    public MasterDataController(MasterDataCoordinator coordinator)
    {
        _coordinator = coordinator;
    }

    [HttpGet("branches")]
    [ProducesResponseType(typeof(IEnumerable<BranchResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<BranchResponse>>> GetBranches()
    {
        var branches = await _coordinator.GetBranchesAsync();
        return Ok(branches.Select(BranchResponse.FromEntity));
    }

    [HttpGet("branches/{id:guid}")]
    [ProducesResponseType(typeof(BranchResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<BranchResponse>> GetBranchById(Guid id)
    {
        var branch = await _coordinator.GetBranchByIdAsync(id);
        if (branch is null)
            return Problem(detail: $"Branch {id} not found.", statusCode: StatusCodes.Status404NotFound);
        return Ok(BranchResponse.FromEntity(branch));
    }

    [HttpPost("branches")]
    [ProducesResponseType(typeof(BranchResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<BranchResponse>> CreateBranch(CreateBranchRequest request)
    {
        var branch = await _coordinator.CreateBranchAsync(request.Name, request.City);
        var response = BranchResponse.FromEntity(branch);
        return CreatedAtAction(nameof(GetBranchById), new { id = branch.Id }, response);
    }

    [HttpPut("branches/{id:guid}")]
    [ProducesResponseType(typeof(BranchResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status409Conflict)]
    public async Task<ActionResult<BranchResponse>> UpdateBranch(Guid id, UpdateBranchRequest request)
    {
        var branch = await _coordinator.UpdateBranchAsync(id, request.Name, request.City);
        return Ok(BranchResponse.FromEntity(branch));
    }

    [HttpDelete("branches/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteBranch(Guid id)
    {
        await _coordinator.DeleteBranchAsync(id);
        return NoContent();
    }


    [HttpGet("warehouses")]
    [ProducesResponseType(typeof(IEnumerable<WarehouseResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<WarehouseResponse>>> GetWarehouses()
    {
        var warehouses = await _coordinator.GetWarehousesAsync();
        return Ok(warehouses.Select(WarehouseResponse.FromEntity));
    }

    [HttpGet("warehouses/{id:guid}")]
    [ProducesResponseType(typeof(WarehouseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WarehouseResponse>> GetWarehouseById(Guid id)
    {
        var warehouse = await _coordinator.GetWarehouseByIdAsync(id);
        if (warehouse is null)
            return Problem(detail: $"Warehouse {id} not found.", statusCode: StatusCodes.Status404NotFound);
        return Ok(WarehouseResponse.FromEntity(warehouse));
    }

    [HttpPost("warehouses")]
    [ProducesResponseType(typeof(WarehouseResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<WarehouseResponse>> CreateWarehouse(CreateWarehouseRequest request)
    {
        var warehouse = await _coordinator.CreateWarehouseAsync(request.Name, request.Address, request.BranchId, request.CapacityKg);
        var response = WarehouseResponse.FromEntity(warehouse);
        return CreatedAtAction(nameof(GetWarehouseById), new { id = warehouse.Id }, response);
    }

    [HttpPut("warehouses/{id:guid}")]
    [ProducesResponseType(typeof(WarehouseResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<WarehouseResponse>> UpdateWarehouse(Guid id, UpdateWarehouseRequest request)
    {
        var warehouse = await _coordinator.UpdateWarehouseAsync(id, request.Name, request.Address);
        return Ok(WarehouseResponse.FromEntity(warehouse));
    }

    [HttpDelete("warehouses/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteWarehouse(Guid id)
    {
        await _coordinator.DeleteWarehouseAsync(id);
        return NoContent();
    }


    [HttpGet("employees")]
    [ProducesResponseType(typeof(IEnumerable<EmployeeResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<EmployeeResponse>>> GetEmployees()
    {
        var employees = await _coordinator.GetEmployeesAsync();
        return Ok(employees.Select(EmployeeResponse.FromEntity));
    }

    [HttpGet("employees/{id:guid}")]
    [ProducesResponseType(typeof(EmployeeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EmployeeResponse>> GetEmployeeById(Guid id)
    {
        var employee = await _coordinator.GetEmployeeByIdAsync(id);
        if (employee is null)
            return Problem(detail: $"Employee {id} not found.", statusCode: StatusCodes.Status404NotFound);
        return Ok(EmployeeResponse.FromEntity(employee));
    }

    [HttpPost("employees/drivers")]
    [ProducesResponseType(typeof(EmployeeResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EmployeeResponse>> CreateDriver(CreateDriverRequest request)
    {
        var driver = await _coordinator.CreateDriverAsync(request.Name, request.Email, request.BranchId, request.LicenseNumber);
        var response = EmployeeResponse.FromEntity(driver);
        return CreatedAtAction(nameof(GetEmployeeById), new { id = driver.Id }, response);
    }

    [HttpPost("employees/staff")]
    [ProducesResponseType(typeof(EmployeeResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EmployeeResponse>> CreateStaff(CreateStaffRequest request)
    {
        var staff = await _coordinator.CreateStaffAsync(request.Name, request.Email, request.BranchId, request.Department);
        var response = EmployeeResponse.FromEntity(staff);
        return CreatedAtAction(nameof(GetEmployeeById), new { id = staff.Id }, response);
    }

    [HttpPost("employees/managers")]
    [ProducesResponseType(typeof(EmployeeResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<EmployeeResponse>> CreateManager(CreateManagerRequest request)
    {
        var manager = await _coordinator.CreateManagerAsync(request.Name, request.Email, request.BranchId);
        var response = EmployeeResponse.FromEntity(manager);
        return CreatedAtAction(nameof(GetEmployeeById), new { id = manager.Id }, response);
    }

    [HttpPut("employees/{id:guid}")]
    [ProducesResponseType(typeof(EmployeeResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<EmployeeResponse>> UpdateEmployee(Guid id, UpdateEmployeeRequest request)
    {
        var employee = await _coordinator.UpdateEmployeeContactAsync(id, request.Name, request.Email);
        return Ok(EmployeeResponse.FromEntity(employee));
    }

    [HttpDelete("employees/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteEmployee(Guid id)
    {
        await _coordinator.DeleteEmployeeAsync(id);
        return NoContent();
    }


    [HttpGet("vehicles")]
    [ProducesResponseType(typeof(IEnumerable<VehicleResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<VehicleResponse>>> GetVehicles()
    {
        var vehicles = await _coordinator.GetVehiclesAsync();
        return Ok(vehicles.Select(VehicleResponse.FromEntity));
    }

    [HttpGet("vehicles/{id:guid}")]
    [ProducesResponseType(typeof(VehicleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VehicleResponse>> GetVehicleById(Guid id)
    {
        var vehicle = await _coordinator.GetVehicleByIdAsync(id);
        if (vehicle is null)
            return Problem(detail: $"Vehicle {id} not found.", statusCode: StatusCodes.Status404NotFound);
        return Ok(VehicleResponse.FromEntity(vehicle));
    }

    [HttpPost("vehicles")]
    [ProducesResponseType(typeof(VehicleResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<VehicleResponse>> CreateVehicle(CreateVehicleRequest request)
    {
        var vehicle = await _coordinator.CreateVehicleAsync(request.RegistrationNumber, request.BranchId, request.VehicleClass);
        var response = VehicleResponse.FromEntity(vehicle);
        return CreatedAtAction(nameof(GetVehicleById), new { id = vehicle.Id }, response);
    }

    [HttpPut("vehicles/{id:guid}/status")]
    [ProducesResponseType(typeof(VehicleResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<VehicleResponse>> UpdateVehicleStatus(Guid id, UpdateVehicleStatusRequest request)
    {
        var vehicle = await _coordinator.UpdateVehicleStatusAsync(id, request.Status);
        return Ok(VehicleResponse.FromEntity(vehicle));
    }

    [HttpDelete("vehicles/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteVehicle(Guid id)
    {
        await _coordinator.DeleteVehicleAsync(id);
        return NoContent();
    }


    [HttpGet("offerings")]
    [ProducesResponseType(typeof(IEnumerable<OfferingResponse>), StatusCodes.Status200OK)]
    public async Task<ActionResult<IEnumerable<OfferingResponse>>> GetOfferings()
    {
        var offerings = await _coordinator.GetOfferingsAsync();
        return Ok(offerings.Select(OfferingResponse.FromEntity));
    }

    [HttpGet("offerings/{id:guid}")]
    [ProducesResponseType(typeof(OfferingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OfferingResponse>> GetOfferingById(Guid id)
    {
        var offering = await _coordinator.GetOfferingByIdAsync(id);
        if (offering is null)
            return Problem(detail: $"Offering {id} not found.", statusCode: StatusCodes.Status404NotFound);
        return Ok(OfferingResponse.FromEntity(offering));
    }

    [HttpPost("offerings")]
    [ProducesResponseType(typeof(OfferingResponse), StatusCodes.Status201Created)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<OfferingResponse>> CreateOffering(CreateOfferingRequest request)
    {
        var offering = await _coordinator.CreateOfferingAsync(
            request.Name, request.Description, request.BasePrice, request.MaxWeightKg, request.MaxVolumeCbm, request.VehicleClass);
        var response = OfferingResponse.FromEntity(offering);
        return CreatedAtAction(nameof(GetOfferingById), new { id = offering.Id }, response);
    }

    [HttpPut("offerings/{id:guid}")]
    [ProducesResponseType(typeof(OfferingResponse), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status400BadRequest)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<ActionResult<OfferingResponse>> UpdateOffering(Guid id, UpdateOfferingRequest request)
    {
        var offering = await _coordinator.UpdateOfferingAsync(id, request.Description, request.BasePrice, request.MaxWeightKg, request.MaxVolumeCbm);
        return Ok(OfferingResponse.FromEntity(offering));
    }

    [HttpDelete("offerings/{id:guid}")]
    [ProducesResponseType(StatusCodes.Status204NoContent)]
    [ProducesResponseType(typeof(ProblemDetails), StatusCodes.Status404NotFound)]
    public async Task<IActionResult> DeleteOffering(Guid id)
    {
        await _coordinator.DeleteOfferingAsync(id);
        return NoContent();
    }

}
