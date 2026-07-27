using Microsoft.EntityFrameworkCore;
using SmartFM.Domain.Entities;
using SmartFM.Infrastructure.Persistence;

namespace SmartFM.Infrastructure.Seed;

public static class SeedData
{
    public static async Task SeedAsync(SmartFMDbContext context)
    {
        if (await context.Branches.AnyAsync())
            return;

        var hanoi = new Branch("Hanoi Branch", "Hanoi");
        var hcmc = new Branch("Ho Chi Minh City Branch", "Ho Chi Minh City");
        context.Branches.AddRange(hanoi, hcmc);

        var hanoiWarehouse = new Warehouse("Hanoi Warehouse", "1 Giai Phong Street, Hanoi", hanoi.Id, 50000m);
        var hcmcWarehouse = new Warehouse("Ho Chi Minh City Warehouse", "1 Nguyen Van Linh Street, Ho Chi Minh City", hcmc.Id, 50000m);
        context.Warehouses.AddRange(hanoiWarehouse, hcmcWarehouse);

        var driver1 = new Driver("Nguyen Van A", "driver.a@smartfm.vn", hanoi.Id, "D-0001");
        var driver2 = new Driver("Tran Thi B", "driver.b@smartfm.vn", hcmc.Id, "D-0002");
        var staff1 = new Staff("Le Van C", "staff.c@smartfm.vn", hanoi.Id, "Operations");
        var staff2 = new Staff("Pham Thi D", "staff.d@smartfm.vn", hcmc.Id, "Operations");
        var manager = new Manager("Hoang Van E", "manager.e@smartfm.vn", hanoi.Id);
        context.Employees.AddRange(driver1, driver2, staff1, staff2, manager);

        var light1 = new LightVehicle("29A-00001", hanoi.Id);
        var light2 = new LightVehicle("51A-00001", hcmc.Id);
        var medium1 = new MediumVehicle("29A-00002", hanoi.Id);
        var medium2 = new MediumVehicle("51A-00002", hcmc.Id);
        var heavy1 = new HeavyVehicle("29A-00003", hanoi.Id);
        var heavy2 = new HeavyVehicle("51A-00003", hcmc.Id);
        context.Vehicles.AddRange(light1, light2, medium1, medium2, heavy1, heavy2);

        var lightOffering = new Offering("Light Delivery", "Small parcels and light cargo", 150000m, 1000m, 3m, "Light");
        var mediumOffering = new Offering("Medium Delivery", "Palletized and medium cargo", 400000m, 5000m, 12m, "Medium");
        var heavyOffering = new Offering("Heavy Delivery", "Bulk and heavy freight", 900000m, 20000m, 40m, "Heavy");
        context.Offerings.AddRange(lightOffering, mediumOffering, heavyOffering);

        await context.SaveChangesAsync();
        Console.WriteLine("Seed completed");
    }
}
