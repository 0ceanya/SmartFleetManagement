using Microsoft.EntityFrameworkCore;
using SmartFM.Domain.Entities;
using SmartFM.Domain.Records;
using SmartFM.Domain.ValueObjects;
using SmartFM.Infrastructure.Persistence;

namespace SmartFM.Infrastructure.Seed;

public static class SeedData
{
    public static async Task SeedAsync(SmartFMDbContext context)
    {
        if (await context.Branches.AnyAsync())
        {
            await SeedDriverOrderHistoryAsync(context);
            return;
        }

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

        await SeedDriverOrderHistoryAsync(context);
    }

    private static async Task SeedDriverOrderHistoryAsync(SmartFMDbContext context)
    {
        if (await context.Orders.AnyAsync() && await context.Set<AuditRecord>().AnyAsync())
            return;

        if (await context.Orders.AnyAsync())
            return; // orders exist but no audit records — delete smartfm.db to reseed

        var offering = await context.Offerings.FirstOrDefaultAsync(o => o.Name == "Light Delivery");
        if (offering is null)
            return;

        // (Order, Shipment, Assignment, CreatedAt, IsDelivered, DriverId)
        var trackedOrders = new List<(Order Order, Shipment Shipment, Assignment Assignment, DateTime CreatedAt, bool IsDelivered, Guid DriverId)>();
        var seedIndex = 0;

        var driverA = await context.Employees.OfType<Driver>().FirstOrDefaultAsync(d => d.Email == "driver.a@smartfm.vn");
        var vehicleA = await context.Vehicles.FirstOrDefaultAsync(v => v.RegistrationNumber == "29A-00001");
        if (driverA is not null && vehicleA is not null)
        {
            var olderDaysAgo = new[] { 3, 10, 25, 40, 65, 95, 130, 200, 380 };
            foreach (var daysAgo in olderDaysAgo)
            {
                var (o, s, a, t) = SeedDeliveredOrder(context, driverA, vehicleA, offering, "Hanoi", ++seedIndex, DateTime.UtcNow.AddDays(-daysAgo));
                trackedOrders.Add((o, s, a, t, true, driverA.Id));
            }

            var augustDatesA = new[]
            {
                new DateTime(2026, 8, 1, 6, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 8, 1, 11, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 8, 1, 16, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 8, 1, 21, 0, 0, DateTimeKind.Utc),
            };
            var incidentDescriptionsA = new[] { "Customer reported a scuffed box on arrival", "Recipient asked about a missing accessory" };
            for (var i = 0; i < augustDatesA.Length; i++)
            {
                var (o, s, a, t) = SeedDeliveredOrder(context, driverA, vehicleA, offering, "Hanoi", ++seedIndex, augustDatesA[i]);
                trackedOrders.Add((o, s, a, t, true, driverA.Id));
                if (i == 0 || i == 2)
                {
                    context.Set<IncidentRecord>().Add(new IncidentRecord
                    {
                        VehicleId = vehicleA.Id,
                        ShipmentId = s.Id,
                        Description = incidentDescriptionsA[i == 0 ? 0 : 1],
                        Severity = "Low",
                        Category = "CustomerComplaint",
                        CreatedAt = augustDatesA[i].AddHours(2),
                    });
                }
            }

            var (pendingO, pendingS, pendingA, pendingT) = SeedPendingAssignment(context, driverA, vehicleA, offering, "Hanoi", ++seedIndex, DateTime.UtcNow.AddHours(-2));
            trackedOrders.Add((pendingO, pendingS, pendingA, pendingT, false, driverA.Id));
        }

        var driverB = await context.Employees.OfType<Driver>().FirstOrDefaultAsync(d => d.Email == "driver.b@smartfm.vn");
        var vehicleB = await context.Vehicles.FirstOrDefaultAsync(v => v.RegistrationNumber == "51A-00001");
        if (driverB is not null && vehicleB is not null)
        {
            var augustDatesB = new[]
            {
                new DateTime(2026, 8, 1, 7, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 8, 1, 12, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 8, 1, 17, 0, 0, DateTimeKind.Utc),
                new DateTime(2026, 8, 1, 22, 0, 0, DateTimeKind.Utc),
            };
            var incidentDescriptionsB = new[] { "Customer reported the driver was delayed by traffic", "Cargo box slightly damaged in transit" };
            for (var i = 0; i < augustDatesB.Length; i++)
            {
                var (o, s, a, t) = SeedDeliveredOrder(context, driverB, vehicleB, offering, "Ho Chi Minh City", ++seedIndex, augustDatesB[i]);
                trackedOrders.Add((o, s, a, t, true, driverB.Id));
                if (i == 1 || i == 3)
                {
                    context.Set<IncidentRecord>().Add(new IncidentRecord
                    {
                        VehicleId = vehicleB.Id,
                        ShipmentId = s.Id,
                        Description = incidentDescriptionsB[i == 1 ? 0 : 1],
                        Severity = i == 1 ? "Low" : "Medium",
                        Category = i == 1 ? "CustomerComplaint" : "CargoDamage",
                        CreatedAt = augustDatesB[i].AddHours(2),
                    });
                }
            }

            var (pendingO, pendingS, pendingA, pendingT) = SeedPendingAssignment(context, driverB, vehicleB, offering, "Ho Chi Minh City", ++seedIndex, DateTime.UtcNow.AddHours(-1));
            trackedOrders.Add((pendingO, pendingS, pendingA, pendingT, false, driverB.Id));
        }

        await context.SaveChangesAsync();

        foreach (var (order, shipment, assignment, createdAt, _, _) in trackedOrders)
        {
            context.Entry(order).Property(nameof(Order.CreatedAt)).CurrentValue = createdAt;
            context.Entry(shipment).Property(nameof(Shipment.CreatedAt)).CurrentValue = createdAt;
            context.Entry(assignment).Property(nameof(Assignment.CreatedAt)).CurrentValue = createdAt;
        }

        await context.SaveChangesAsync();

        // Seed AuditRecords reflecting every status transition per order/assignment
        foreach (var (order, _, assignment, createdAt, isDelivered, driverId) in trackedOrders)
        {
            var auditRecords = BuildAuditRecords(order.Id, assignment.Id, driverId, createdAt, isDelivered);
            context.Set<AuditRecord>().AddRange(auditRecords);

            if (isDelivered)
            {
                var gpsRecords = BuildGpsTrackingRecords(assignment.VehicleId, assignment.Id, createdAt);
                context.Set<TrackingRecord>().AddRange(gpsRecords);
            }
        }

        await context.SaveChangesAsync();
        Console.WriteLine("Driver order history seed completed");
    }

    private static List<AuditRecord> BuildAuditRecords(
        Guid orderId, Guid assignmentId, Guid driverId, DateTime createdAt, bool isDelivered)
    {
        var records = new List<AuditRecord>
        {
            new() { EntityType = "Assignment", EntityId = assignmentId, FromStatus = null,        ToStatus = "Pending",     ChangedBy = "Seed", CreatedAt = createdAt },
            new() { EntityType = "Driver",     EntityId = driverId,     FromStatus = "Available", ToStatus = "Unavailable", ChangedBy = "Seed", CreatedAt = createdAt },
            new() { EntityType = "Order",      EntityId = orderId,      FromStatus = "Pending",   ToStatus = "Approved",    ChangedBy = "Seed", CreatedAt = createdAt },
        };

        if (!isDelivered)
            return records;

        records.AddRange(new[]
        {
            new AuditRecord { EntityType = "Assignment", EntityId = assignmentId, FromStatus = "Pending",     ToStatus = "Assigned",   ChangedBy = "Seed", CreatedAt = createdAt.AddMinutes(30) },
            new AuditRecord { EntityType = "Order",      EntityId = orderId,      FromStatus = "Approved",    ToStatus = "Active",     ChangedBy = "Seed", CreatedAt = createdAt.AddMinutes(30) },
            new AuditRecord { EntityType = "Assignment", EntityId = assignmentId, FromStatus = "Assigned",    ToStatus = "Loaded",     ChangedBy = "Seed", CreatedAt = createdAt.AddMinutes(60) },
            new AuditRecord { EntityType = "Assignment", EntityId = assignmentId, FromStatus = "Loaded",      ToStatus = "Delivering", ChangedBy = "Seed", CreatedAt = createdAt.AddMinutes(90) },
            new AuditRecord { EntityType = "Assignment", EntityId = assignmentId, FromStatus = "Delivering",  ToStatus = "Delivered",  ChangedBy = "Seed", CreatedAt = createdAt.AddHours(3) },
            new AuditRecord { EntityType = "Driver",     EntityId = driverId,     FromStatus = "Unavailable", ToStatus = "Available",  ChangedBy = "Seed", CreatedAt = createdAt.AddHours(3) },
            new AuditRecord { EntityType = "Order",      EntityId = orderId,      FromStatus = "Active",      ToStatus = "Fulfilled",  ChangedBy = "Seed", CreatedAt = createdAt.AddHours(3) },
        });

        return records;
    }

    private static List<TrackingRecord> BuildGpsTrackingRecords(Guid vehicleId, Guid assignmentId, DateTime startedAt)
    {
        // Mock GPS waypoints for a delivered trip (Hanoi area — lat/lon realistic for Vietnam)
        return new List<TrackingRecord>
        {
            new() { VehicleId = vehicleId, AssignmentId = assignmentId, Lat = 21.0245, Lon = 105.8412, Waypoint = "Hanoi Warehouse", CreatedAt = startedAt.AddMinutes(5) },
            new() { VehicleId = vehicleId, AssignmentId = assignmentId, Lat = 20.9800, Lon = 105.8600, Waypoint = "City Outskirts",  CreatedAt = startedAt.AddMinutes(35) },
            new() { VehicleId = vehicleId, AssignmentId = assignmentId, Lat = 20.8500, Lon = 106.0200, Waypoint = "Highway",         CreatedAt = startedAt.AddMinutes(80) },
            new() { VehicleId = vehicleId, AssignmentId = assignmentId, Lat = 20.7000, Lon = 106.1800, Waypoint = "Approaching",     CreatedAt = startedAt.AddMinutes(140) },
            new() { VehicleId = vehicleId, AssignmentId = assignmentId, Lat = 20.5992, Lon = 106.3500, Waypoint = "Customer Site",   CreatedAt = startedAt.AddHours(3) },
        };
    }

    private static (Order Order, Shipment Shipment, Assignment Assignment, DateTime CreatedAt) SeedDeliveredOrder(
        SmartFMDbContext context, Driver driver, Vehicle vehicle, Offering offering, string city, int seedIndex, DateTime createdAt)
    {
        var customer = new Customer($"Historical Customer {seedIndex}", $"history.customer{seedIndex}@example.com", $"0900{seedIndex:D6}");
        context.Customers.Add(customer);

        var order = new Order(customer, offering);
        var cargo = new Cargo(order.Id, $"Historical parcel {seedIndex}", 8m, 1m, false);
        order.AddCargo(cargo);
        context.Cargoes.Add(cargo);

        var shipment = new Shipment(order, $"Warehouse {seedIndex}, {city}", $"Customer address {seedIndex}, {city}");
        order.AttachShipment(shipment);
        context.Orders.Add(order);
        context.Shipments.Add(shipment);

        var route = new Route($"Warehouse {seedIndex}, {city}", $"Customer address {seedIndex}, {city}", null, 8.0, 20);
        context.Routes.Add(route);

        var assignment = new Assignment(new[] { shipment }, driver, vehicle, route);
        context.Assignments.Add(assignment);

        shipment.AssignTo(assignment.Id);
        shipment.SetStatus(ShipmentStatus.Assigned);

        order.SetStatus(OrderStatus.Approved);

        assignment.Approve();
        var manifest = new LoadManifest(
            shipment.Id,
            new[] { cargo.Id },
            new[] { cargo.Description },
            cargo.WeightKg,
            false,
            createdAt,
            LoadedCargoIds: new[] { cargo.Id },
            IsPickupResolved: true);
        context.LoadManifests.Add(manifest);
        assignment.MarkLoaded();
        assignment.MarkDelivering();
        shipment.SetStatus(ShipmentStatus.InTransit);

        var confirmedAt = createdAt.AddHours(3);
        var confirmation = new DeliveryConfirmation(
            shipment.Id, driver.Id, customer.Name, "Confirmed by driver", null, null, confirmedAt);
        context.DeliveryConfirmations.Add(confirmation);
        shipment.SetStatus(ShipmentStatus.Delivered);
        assignment.Deliver();

        order.Activate();
        order.Fulfil();

        return (order, shipment, assignment, createdAt);
    }

    private static (Order Order, Shipment Shipment, Assignment Assignment, DateTime CreatedAt) SeedPendingAssignment(
        SmartFMDbContext context, Driver driver, Vehicle vehicle, Offering offering, string city, int seedIndex, DateTime createdAt)
    {
        var customer = new Customer($"New Customer {seedIndex}", $"new.customer{seedIndex}@example.com", $"0900{seedIndex:D6}");
        context.Customers.Add(customer);

        var order = new Order(customer, offering);
        var cargo = new Cargo(order.Id, $"New parcel {seedIndex}", 12m, 1.5m, false);
        order.AddCargo(cargo);
        context.Cargoes.Add(cargo);

        var shipment = new Shipment(order, $"Warehouse {seedIndex}, {city}", $"Customer address {seedIndex}, {city}");
        order.AttachShipment(shipment);
        context.Orders.Add(order);
        context.Shipments.Add(shipment);

        var route = new Route($"Warehouse {seedIndex}, {city}", $"Customer address {seedIndex}, {city}", null, 9.5, 22);
        context.Routes.Add(route);

        // Just created by staff - assignment stays Pending (awaiting driver acceptance), order becomes
        // Approved (vehicle scheduled), matching FleetAssignmentCoordinator.CreateAssignmentAsync exactly.
        var assignment = new Assignment(new[] { shipment }, driver, vehicle, route);
        context.Assignments.Add(assignment);

        shipment.AssignTo(assignment.Id);
        shipment.SetStatus(ShipmentStatus.Assigned);
        order.SetStatus(OrderStatus.Approved);

        driver.SetAvailability(false);
        vehicle.SetStatus(VehicleStatus.Assigned);

        return (order, shipment, assignment, createdAt);
    }
}
