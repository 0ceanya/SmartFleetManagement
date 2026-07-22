using SmartFM.Application.Abstractions;
using SmartFM.Domain.Entities;

namespace SmartFM.Application.Coordinators;

public class MasterDataCoordinator
{
    private readonly IRepository<Branch> _branches;
    private readonly IRepository<Warehouse> _warehouses;
    private readonly IRepository<Employee> _employees;
    private readonly IRepository<Vehicle> _vehicles;
    private readonly IRepository<Offering> _offerings;
    private readonly IUnitOfWork _unitOfWork;

    public MasterDataCoordinator(
        IRepository<Branch> branches,
        IRepository<Warehouse> warehouses,
        IRepository<Employee> employees,
        IRepository<Vehicle> vehicles,
        IRepository<Offering> offerings,
        IUnitOfWork unitOfWork)
    {
        _branches = branches;
        _warehouses = warehouses;
        _employees = employees;
        _vehicles = vehicles;
        _offerings = offerings;
        _unitOfWork = unitOfWork;
    }

    public Task InitializeMasterDataSubsystem()
    {
        Console.WriteLine("MasterDataCoordinator initialized");
        return Task.CompletedTask;
    }

    public async Task<Branch> CreateBranchAsync(string name, string city)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        await EnsureBranchNameAvailableAsync(name, excludeId: null);
        var branch = new Branch(name, city);
        await _branches.AddAsync(branch);
        await _unitOfWork.SaveChangesAsync();
        return branch;
    }

    public async Task<Branch> UpdateBranchAsync(Guid id, string name, string city)
    {
        var branch = await _branches.GetByIdAsync(id)
            ?? throw new InvalidOperationException($"Branch {id} not found.");
        await EnsureBranchNameAvailableAsync(name, excludeId: id);
        branch.Rename(name, city);
        _branches.Update(branch);
        await _unitOfWork.SaveChangesAsync();
        return branch;
    }

    public async Task DeleteBranchAsync(Guid id)
    {
        var branch = await _branches.GetByIdAsync(id)
            ?? throw new InvalidOperationException($"Branch {id} not found.");
        _branches.Remove(branch);
        await _unitOfWork.SaveChangesAsync();
    }

    public Task<IEnumerable<Branch>> GetBranchesAsync() => _branches.GetAllAsync();

    public async Task<Warehouse> CreateWarehouseAsync(string name, string address, Guid branchId)
    {
        var warehouse = new Warehouse(name, address, branchId);
        await _warehouses.AddAsync(warehouse);
        await _unitOfWork.SaveChangesAsync();
        return warehouse;
    }

    public async Task<Warehouse> UpdateWarehouseAsync(Guid id, string name, string address)
    {
        var warehouse = await _warehouses.GetByIdAsync(id)
            ?? throw new InvalidOperationException($"Warehouse {id} not found.");
        warehouse.UpdateDetails(name, address);
        _warehouses.Update(warehouse);
        await _unitOfWork.SaveChangesAsync();
        return warehouse;
    }

    public async Task DeleteWarehouseAsync(Guid id)
    {
        var warehouse = await _warehouses.GetByIdAsync(id)
            ?? throw new InvalidOperationException($"Warehouse {id} not found.");
        _warehouses.Remove(warehouse);
        await _unitOfWork.SaveChangesAsync();
    }

    public Task<IEnumerable<Warehouse>> GetWarehousesAsync() => _warehouses.GetAllAsync();

    public async Task<Driver> CreateDriverAsync(string name, string email, Guid branchId, string licenseNumber)
    {
        var driver = new Driver(name, email, branchId, licenseNumber);
        await _employees.AddAsync(driver);
        await _unitOfWork.SaveChangesAsync();
        return driver;
    }

    public async Task<Staff> CreateStaffAsync(string name, string email, Guid branchId, string department)
    {
        var staff = new Staff(name, email, branchId, department);
        await _employees.AddAsync(staff);
        await _unitOfWork.SaveChangesAsync();
        return staff;
    }

    public async Task<Manager> CreateManagerAsync(string name, string email, Guid branchId)
    {
        var manager = new Manager(name, email, branchId);
        await _employees.AddAsync(manager);
        await _unitOfWork.SaveChangesAsync();
        return manager;
    }

    public async Task<Employee> UpdateEmployeeContactAsync(Guid id, string name, string email)
    {
        var employee = await _employees.GetByIdAsync(id)
            ?? throw new InvalidOperationException($"Employee {id} not found.");
        employee.UpdateContactInfo(name, email);
        _employees.Update(employee);
        await _unitOfWork.SaveChangesAsync();
        return employee;
    }

    public async Task DeleteEmployeeAsync(Guid id)
    {
        var employee = await _employees.GetByIdAsync(id)
            ?? throw new InvalidOperationException($"Employee {id} not found.");
        _employees.Remove(employee);
        await _unitOfWork.SaveChangesAsync();
    }

    public Task<IEnumerable<Employee>> GetEmployeesAsync() => _employees.GetAllAsync();

    public async Task<Vehicle> CreateVehicleAsync(string registrationNumber, Guid branchId, string vehicleClass)
    {
        Vehicle vehicle = vehicleClass switch
        {
            "Light" => new LightVehicle(registrationNumber, branchId),
            "Medium" => new MediumVehicle(registrationNumber, branchId),
            "Heavy" => new HeavyVehicle(registrationNumber, branchId),
            _ => throw new ArgumentException($"Unknown vehicle class: {vehicleClass}")
        };
        await _vehicles.AddAsync(vehicle);
        await _unitOfWork.SaveChangesAsync();
        return vehicle;
    }

    public async Task<Vehicle> UpdateVehicleStatusAsync(Guid id, string status)
    {
        var vehicle = await _vehicles.GetByIdAsync(id)
            ?? throw new InvalidOperationException($"Vehicle {id} not found.");
        vehicle.SetStatus(status);
        _vehicles.Update(vehicle);
        await _unitOfWork.SaveChangesAsync();
        return vehicle;
    }

    public async Task DeleteVehicleAsync(Guid id)
    {
        var vehicle = await _vehicles.GetByIdAsync(id)
            ?? throw new InvalidOperationException($"Vehicle {id} not found.");
        _vehicles.Remove(vehicle);
        await _unitOfWork.SaveChangesAsync();
    }

    public Task<IEnumerable<Vehicle>> GetVehiclesAsync() => _vehicles.GetAllAsync();

    public async Task<Offering> CreateOfferingAsync(string name, string description, decimal basePrice, decimal maxWeightKg, decimal maxVolumeCbm, string vehicleClass)
    {
        var offering = new Offering(name, description, basePrice, maxWeightKg, maxVolumeCbm, vehicleClass);
        await _offerings.AddAsync(offering);
        await _unitOfWork.SaveChangesAsync();
        return offering;
    }

    public async Task<Offering> UpdateOfferingAsync(Guid id, string description, decimal basePrice, decimal maxWeightKg, decimal maxVolumeCbm)
    {
        var offering = await _offerings.GetByIdAsync(id)
            ?? throw new InvalidOperationException($"Offering {id} not found.");
        offering.UpdateDetails(description, basePrice, maxWeightKg, maxVolumeCbm);
        _offerings.Update(offering);
        await _unitOfWork.SaveChangesAsync();
        return offering;
    }

    public async Task DeleteOfferingAsync(Guid id)
    {
        var offering = await _offerings.GetByIdAsync(id)
            ?? throw new InvalidOperationException($"Offering {id} not found.");
        _offerings.Remove(offering);
        await _unitOfWork.SaveChangesAsync();
    }

    public Task<IEnumerable<Offering>> GetOfferingsAsync() => _offerings.GetAllAsync();

    public async Task<Offering?> GetOfferingByIdAsync(Guid id) => await _offerings.GetByIdAsync(id);

    public async Task<Vehicle?> GetVehicleByIdAsync(Guid id) => await _vehicles.GetByIdAsync(id);

    public async Task<Employee?> GetEmployeeByIdAsync(Guid id) => await _employees.GetByIdAsync(id);

    public async Task<Warehouse?> GetWarehouseByIdAsync(Guid id) => await _warehouses.GetByIdAsync(id);

    private async Task EnsureBranchNameAvailableAsync(string name, Guid? excludeId)
    {
        var branches = await _branches.GetAllAsync();
        var duplicate = branches.Any(b => b.Id != excludeId && string.Equals(b.Name, name, StringComparison.OrdinalIgnoreCase));
        if (duplicate)
            throw new InvalidOperationException($"Branch name '{name}' is already in use.");
    }
}
