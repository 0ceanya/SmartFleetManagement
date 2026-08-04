using Microsoft.EntityFrameworkCore;
using SmartFM.Domain.Entities;
using SmartFM.Domain.Records;
using SmartFM.Domain.ValueObjects;
using SmartFM.Infrastructure.Persistence;

namespace SmartFM.Infrastructure.Seed;

public static class SeedData
{
    private static readonly (double Lat, double Lon, string Waypoint)[] HanoiHaiPhongCorridor =
    {
        (21.0245, 105.8412, "Hanoi Warehouse"),
        (21.0350, 105.9000, "Gia Lam"),
        (20.9500, 106.0600, "Hung Yen"),
        (20.9000, 106.2500, "Highway QL5A"),
        (20.9373, 106.3145, "Hai Duong"),
        (20.8800, 106.5500, "Approaching Hai Phong"),
        (20.8449, 106.6881, "Hai Phong City"),
        (20.8600, 106.6800, "Customer Site"),
    };

    private static readonly (double Lat, double Lon, string Waypoint)[] HanoiDaNangCorridor =
    {
        (21.0245, 105.8412, "Hanoi Warehouse"),
        (20.5400, 105.9139, "Phu Ly"),
        (20.2506, 105.9744, "Ninh Binh"),
        (19.8067, 105.7764, "Thanh Hoa"),
        (18.6796, 105.6813, "Vinh"),
        (18.3428, 105.9057, "Ha Tinh"),
        (17.4680, 106.6220, "Dong Hoi"),
        (16.8163, 107.1000, "Dong Ha"),
        (16.4637, 107.5909, "Hue"),
        (16.2133, 108.1167, "Hai Van Pass"),
        (16.0544, 108.2022, "Da Nang City"),
    };

    private sealed record AssignmentPair(Driver Driver, Vehicle Vehicle, Staff Staff, string City, (double Lat, double Lon, string Waypoint)[] Corridor);

    public static async Task SeedAsync(SmartFMDbContext context)
    {
        if (await context.Branches.AnyAsync())
            return;

        var (drivers, staffMembers, vehicles, offeringsByClass) = await SeedBaselineAsync(context);
        await SeedOperationalDataAsync(context, drivers, staffMembers, vehicles, offeringsByClass);

        Console.WriteLine("Seed completed");
    }

    private static async Task<(List<Driver> Drivers, List<Staff> Staff, List<Vehicle> Vehicles, Dictionary<string, Offering> OfferingsByClass)> SeedBaselineAsync(
        SmartFMDbContext context)
    {
        var hanoi = new Branch("Hanoi Branch", "Hanoi");
        var haiPhong = new Branch("Hai Phong Branch", "Hai Phong");
        var daNang = new Branch("Da Nang Branch", "Da Nang");
        context.Branches.AddRange(hanoi, haiPhong, daNang);

        context.Warehouses.AddRange(
            new Warehouse("Hanoi Warehouse", "Đường Giải Phóng, Hoàng Mai, Hà Nội", hanoi.Id, 50000m),
            new Warehouse("Hai Phong Warehouse", "Đường Nguyễn Văn Linh, Hải Phòng", haiPhong.Id, 50000m),
            new Warehouse("Da Nang Warehouse", "Đường Ngô Quyền, Đà Nẵng", daNang.Id, 50000m));

        var drivers = new List<Driver>
        {
            new("Nguyen Van A", "driver.a@smartfm.vn", hanoi.Id, "D-0001"),
            new("Tran Thi B", "driver.b@smartfm.vn", hanoi.Id, "D-0002"),
            new("Le Van C", "driver.c@smartfm.vn", haiPhong.Id, "D-0003"),
            new("Pham Thi D", "driver.d@smartfm.vn", haiPhong.Id, "D-0004"),
            new("Hoang Van E", "driver.e@smartfm.vn", daNang.Id, "D-0005"),
            new("Do Thi F", "driver.f@smartfm.vn", daNang.Id, "D-0006"),
        };
        context.Employees.AddRange(drivers);

        var staffMembers = new List<Staff>
        {
            new("Bui Van G", "staff.g@smartfm.vn", hanoi.Id, "Operations"),
            new("Vu Thi H", "staff.h@smartfm.vn", haiPhong.Id, "Operations"),
            new("Dang Van I", "staff.i@smartfm.vn", daNang.Id, "Operations"),
        };
        context.Employees.AddRange(staffMembers);

        context.Employees.Add(new Manager("Ngo Van K", "manager.k@smartfm.vn", hanoi.Id));

        // 3 Light / 3 Medium / 2 Heavy across 3 branches
        var vehicles = new List<Vehicle>
        {
            new LightVehicle("29A-00001", hanoi.Id),
            new MediumVehicle("29A-00002", hanoi.Id),
            new HeavyVehicle("29A-00003", hanoi.Id),
            new LightVehicle("15A-00001", haiPhong.Id),
            new MediumVehicle("15A-00002", haiPhong.Id),
            new HeavyVehicle("15A-00003", haiPhong.Id),
            new LightVehicle("43A-00001", daNang.Id),
            new MediumVehicle("43A-00002", daNang.Id),
        };
        context.Vehicles.AddRange(vehicles);

        var lightOffering = new Offering("Light Delivery", "Small parcels and light cargo", 150000m, 1000m, 3m, "Light");
        var mediumOffering = new Offering("Medium Delivery", "Palletized and medium cargo", 400000m, 5000m, 12m, "Medium");
        var heavyOffering = new Offering("Heavy Delivery", "Bulk and heavy freight", 900000m, 20000m, 40m, "Heavy");
        context.Offerings.AddRange(lightOffering, mediumOffering, heavyOffering);

        await context.SaveChangesAsync();

        var offeringsByClass = new Dictionary<string, Offering>
        {
            ["Light"] = lightOffering,
            ["Medium"] = mediumOffering,
            ["Heavy"] = heavyOffering,
        };
        return (drivers, staffMembers, vehicles, offeringsByClass);
    }

    private static async Task SeedOperationalDataAsync(
        SmartFMDbContext context, List<Driver> drivers, List<Staff> staffMembers, List<Vehicle> vehicles, Dictionary<string, Offering> offeringsByClass)
    {
        var pairs = new[]
        {
            new AssignmentPair(drivers[0], vehicles[0], staffMembers[0], "Hai Phong", HanoiHaiPhongCorridor),
            new AssignmentPair(drivers[1], vehicles[2], staffMembers[0], "Hai Phong", HanoiHaiPhongCorridor),
            new AssignmentPair(drivers[2], vehicles[3], staffMembers[1], "Hai Phong", HanoiHaiPhongCorridor),
            new AssignmentPair(drivers[3], vehicles[5], staffMembers[1], "Hai Phong", HanoiHaiPhongCorridor),
            new AssignmentPair(drivers[4], vehicles[6], staffMembers[2], "Da Nang", HanoiDaNangCorridor),
            new AssignmentPair(drivers[5], vehicles[7], staffMembers[2], "Da Nang", HanoiDaNangCorridor),
        };

        // Weighted round-robin (sums to 45) so Hanoi-based pairs get noticeably more volume than
        // Da Nang-based pairs, for realistic-looking, uneven trend/branch/driver charts.
        var weights = new[] { 10, 9, 8, 7, 6, 5 };
        var pairOrder = new List<int>();
        for (var round = 0; round < weights.Max(); round++)
            for (var idx = 0; idx < weights.Length; idx++)
                if (weights[idx] > round)
                    pairOrder.Add(idx);

        var slots = new List<(int PairIndex, DateTime CreatedAt, string TargetStatus)>();
        for (var i = 0; i < 40; i++)
        {
            var daysAgo = 1 + i * 29 / 39;
            var hoursAgo = (i * 7) % 20;
            slots.Add((pairOrder[i], DateTime.UtcNow.AddDays(-daysAgo).AddHours(-hoursAgo), AssignmentStatus.Delivered));
        }

        var activeStatuses = new[] { AssignmentStatus.Pending, AssignmentStatus.Assigned, AssignmentStatus.Loaded, AssignmentStatus.Delivering, AssignmentStatus.Delivering };
        var activeHoursAgo = new[] { 2, 6, 12, 20, 30 };
        for (var i = 0; i < 5; i++)
            slots.Add((pairOrder[40 + i], DateTime.UtcNow.AddHours(-activeHoursAgo[i]), activeStatuses[i]));

        // Build in chronological order so each driver/vehicle's final in-memory status reflects
        // their most recent assignment, not loop order.
        slots = slots.OrderBy(s => s.CreatedAt).ToList();

        var auditRecords = new List<AuditRecord>();
        var trackingRecords = new List<TrackingRecord>();
        var timestampOverrides = new List<(object Entity, DateTime CreatedAt)>();
        var incidentVehicleIds = new List<Guid>();

        var seedIndex = 0;
        foreach (var slot in slots)
        {
            var pair = pairs[slot.PairIndex];
            var offering = offeringsByClass[VehicleClassOf(pair.Vehicle)];
            BuildAssignmentLifecycle(
                context, pair.Driver, pair.Vehicle, pair.Staff, offering, pair.City, pair.Corridor,
                ++seedIndex, slot.CreatedAt, slot.TargetStatus, auditRecords, trackingRecords, timestampOverrides);

            if (slot.TargetStatus == AssignmentStatus.Delivered)
                incidentVehicleIds.Add(pair.Vehicle.Id);
        }

        SeedIncidents(context, incidentVehicleIds, auditRecords);
        SeedStandaloneOrders(context, offeringsByClass["Light"], auditRecords, timestampOverrides);

        await context.SaveChangesAsync();

        foreach (var (entity, createdAt) in timestampOverrides)
            context.Entry(entity).Property("CreatedAt").CurrentValue = createdAt;
        await context.SaveChangesAsync();

        context.Set<AuditRecord>().AddRange(auditRecords);
        context.Set<TrackingRecord>().AddRange(trackingRecords);
        await context.SaveChangesAsync();

        Console.WriteLine("Operational data seed completed");
    }

    private static string VehicleClassOf(Vehicle vehicle) => vehicle switch
    {
        LightVehicle => "Light",
        MediumVehicle => "Medium",
        HeavyVehicle => "Heavy",
        _ => "Light"
    };

    private static void BuildAssignmentLifecycle(
        SmartFMDbContext context, Driver driver, Vehicle vehicle, Staff staff, Offering offering,
        string city, (double Lat, double Lon, string Waypoint)[] corridor,
        int seedIndex, DateTime createdAt, string targetStatus,
        List<AuditRecord> auditRecords, List<TrackingRecord> trackingRecords, List<(object Entity, DateTime CreatedAt)> timestampOverrides)
    {
        var customer = new Customer($"Customer {seedIndex}", $"customer{seedIndex}@example.com", $"0900{seedIndex:D6}");
        context.Customers.Add(customer);

        var order = new Order(customer, offering);
        var cargo = new Cargo(order.Id, $"Parcel {seedIndex}", 8m + seedIndex % 20, 1m, false);
        order.AddCargo(cargo);
        context.Cargoes.Add(cargo);

        var shipment = new Shipment(order, $"{city} Warehouse", $"Customer address {seedIndex}, {city}");
        order.AttachShipment(shipment);
        context.Orders.Add(order);
        context.Shipments.Add(shipment);
        context.Invoices.Add(new Invoice(order, offering.BasePrice));

        var route = new Route($"{city} Warehouse", $"Customer address {seedIndex}, {city}", null, 8.0, 20);
        context.Routes.Add(route);

        var staffTag = $"Staff:{staff.Id}";
        var driverTag = $"Driver:{driver.Id}";

        auditRecords.Add(new AuditRecord { EntityType = AuditEntityType.Order, EntityId = order.Id, FromStatus = null, ToStatus = OrderStatus.Pending, ChangedBy = "Customer", CreatedAt = createdAt });

        var assignment = new Assignment(new[] { shipment }, driver, vehicle, route);
        context.Assignments.Add(assignment);
        shipment.AssignTo(assignment.Id);
        shipment.SetStatus(ShipmentStatus.Assigned);
        order.SetStatus(OrderStatus.Approved);
        driver.SetAvailability(false);
        vehicle.SetStatus(VehicleStatus.Assigned);

        var assignedCreatedAt = createdAt.AddMinutes(5);
        auditRecords.Add(new AuditRecord { EntityType = AuditEntityType.Assignment, EntityId = assignment.Id, FromStatus = null, ToStatus = AssignmentStatus.Pending, ChangedBy = staffTag, CreatedAt = assignedCreatedAt });
        auditRecords.Add(new AuditRecord { EntityType = AuditEntityType.Driver, EntityId = driver.Id, FromStatus = "Available", ToStatus = "Unavailable", ChangedBy = "System", CreatedAt = assignedCreatedAt });
        auditRecords.Add(new AuditRecord { EntityType = AuditEntityType.Vehicle, EntityId = vehicle.Id, FromStatus = VehicleStatus.Available, ToStatus = VehicleStatus.Assigned, ChangedBy = "System", CreatedAt = assignedCreatedAt });

        timestampOverrides.Add((order, createdAt));
        timestampOverrides.Add((shipment, createdAt));
        timestampOverrides.Add((assignment, createdAt));

        if (targetStatus == AssignmentStatus.Pending)
            return;

        assignment.Approve();
        order.Activate();
        var approvedAt = createdAt.AddMinutes(30);
        auditRecords.Add(new AuditRecord { EntityType = AuditEntityType.Assignment, EntityId = assignment.Id, FromStatus = AssignmentStatus.Pending, ToStatus = AssignmentStatus.Assigned, ChangedBy = staffTag, CreatedAt = approvedAt });
        auditRecords.Add(new AuditRecord { EntityType = AuditEntityType.Order, EntityId = order.Id, FromStatus = OrderStatus.Approved, ToStatus = OrderStatus.Active, ChangedBy = staffTag, CreatedAt = approvedAt });

        if (targetStatus == AssignmentStatus.Assigned)
            return;

        var manifest = new LoadManifest(
            shipment.Id, new[] { cargo.Id }, new[] { cargo.Description }, cargo.WeightKg, false, createdAt,
            LoadedCargoIds: new[] { cargo.Id }, IsPickupResolved: true);
        context.LoadManifests.Add(manifest);
        assignment.MarkLoaded();
        var loadedAt = createdAt.AddMinutes(60);
        auditRecords.Add(new AuditRecord { EntityType = AuditEntityType.Assignment, EntityId = assignment.Id, FromStatus = AssignmentStatus.Assigned, ToStatus = AssignmentStatus.Loaded, ChangedBy = driverTag, CreatedAt = loadedAt });

        if (targetStatus == AssignmentStatus.Loaded)
            return;

        assignment.MarkDelivering();
        shipment.SetStatus(ShipmentStatus.InTransit);
        var deliveringAt = createdAt.AddMinutes(90);
        auditRecords.Add(new AuditRecord { EntityType = AuditEntityType.Assignment, EntityId = assignment.Id, FromStatus = AssignmentStatus.Loaded, ToStatus = AssignmentStatus.Delivering, ChangedBy = driverTag, CreatedAt = deliveringAt });

        var isStillDelivering = targetStatus == AssignmentStatus.Delivering;
        var pointCount = isStillDelivering ? Math.Max(3, corridor.Length * 2 / 3) : corridor.Length;
        AddTrackingPoints(trackingRecords, vehicle.Id, assignment.Id, corridor, createdAt, pointCount);

        if (isStillDelivering)
            return;

        var confirmedAt = createdAt.AddHours(3);
        context.DeliveryConfirmations.Add(new DeliveryConfirmation(shipment.Id, driver.Id, customer.Name, "Confirmed by driver", null, null, confirmedAt));
        shipment.SetStatus(ShipmentStatus.Delivered);
        assignment.Deliver();
        driver.SetAvailability(true);
        vehicle.SetStatus(VehicleStatus.Available);
        order.Fulfil();

        auditRecords.Add(new AuditRecord { EntityType = AuditEntityType.Assignment, EntityId = assignment.Id, FromStatus = AssignmentStatus.Delivering, ToStatus = AssignmentStatus.Delivered, ChangedBy = driverTag, CreatedAt = confirmedAt });
        auditRecords.Add(new AuditRecord { EntityType = AuditEntityType.Driver, EntityId = driver.Id, FromStatus = "Unavailable", ToStatus = "Available", ChangedBy = "System", CreatedAt = confirmedAt });
        auditRecords.Add(new AuditRecord { EntityType = AuditEntityType.Vehicle, EntityId = vehicle.Id, FromStatus = VehicleStatus.Assigned, ToStatus = VehicleStatus.Available, ChangedBy = "System", CreatedAt = confirmedAt });
        auditRecords.Add(new AuditRecord { EntityType = AuditEntityType.Order, EntityId = order.Id, FromStatus = OrderStatus.Active, ToStatus = OrderStatus.Fulfilled, ChangedBy = "System", CreatedAt = confirmedAt });
    }

    private static void AddTrackingPoints(
        List<TrackingRecord> trackingRecords, Guid vehicleId, Guid assignmentId,
        (double Lat, double Lon, string Waypoint)[] corridor, DateTime startedAt, int pointCount)
    {
        var totalMinutes = corridor.Length <= 8 ? 180 : 720;
        for (var i = 0; i < pointCount; i++)
        {
            var offsetMinutes = corridor.Length <= 1 ? 0 : totalMinutes * i / (corridor.Length - 1);
            var point = corridor[i];
            trackingRecords.Add(new TrackingRecord
            {
                VehicleId = vehicleId,
                AssignmentId = assignmentId,
                Lat = point.Lat,
                Lon = point.Lon,
                Waypoint = point.Waypoint,
                CreatedAt = startedAt.AddMinutes(offsetMinutes),
            });
        }
    }

    private static void SeedIncidents(SmartFMDbContext context, List<Guid> deliveredVehicleIds, List<AuditRecord> auditRecords)
    {
        var incidents = new[]
        {
            (Severity: "Low", Category: "CustomerComplaint", Description: "Customer reported a scuffed box on arrival"),
            (Severity: "Medium", Category: "CargoDamage", Description: "Cargo box slightly damaged in transit"),
            (Severity: "High", Category: "VehicleBreakdown", Description: "Engine overheating during delivery"),
            (Severity: "Critical", Category: "TrafficAccident", Description: "Minor collision at an intersection, no injuries"),
        };

        for (var i = 0; i < incidents.Length && i < deliveredVehicleIds.Count; i++)
        {
            var vehicleId = deliveredVehicleIds[(i * 7) % deliveredVehicleIds.Count];
            var (severity, category, description) = incidents[i];
            var createdAt = DateTime.UtcNow.AddDays(-(i + 1) * 2);

            context.Set<IncidentRecord>().Add(new IncidentRecord
            {
                VehicleId = vehicleId,
                ShipmentId = null,
                Description = description,
                Severity = severity,
                Category = category,
                CreatedAt = createdAt,
            });

            auditRecords.Add(new AuditRecord { EntityType = AuditEntityType.Vehicle, EntityId = vehicleId, FromStatus = null, ToStatus = "IncidentReported", ChangedBy = "Staff", CreatedAt = createdAt });
        }
    }

    private static void SeedStandaloneOrders(
        SmartFMDbContext context, Offering offering, List<AuditRecord> auditRecords, List<(object Entity, DateTime CreatedAt)> timestampOverrides)
    {
        var cities = new[] { "Hanoi", "Hai Phong", "Da Nang" };

        for (var i = 0; i < 15; i++)
        {
            var city = cities[i % cities.Length];
            var customer = new Customer($"New Customer {i + 1}", $"newcustomer{i + 1}@example.com", $"0901{i + 1:D6}");
            context.Customers.Add(customer);

            var order = new Order(customer, offering);
            var cargo = new Cargo(order.Id, $"New parcel {i + 1}", 5m + i, 1m, false);
            order.AddCargo(cargo);
            context.Cargoes.Add(cargo);

            var shipment = new Shipment(order, $"{city} Warehouse", $"Customer address New {i + 1}, {city}");
            order.AttachShipment(shipment);
            context.Orders.Add(order);
            context.Shipments.Add(shipment);
            context.Invoices.Add(new Invoice(order, offering.BasePrice));

            var createdAt = DateTime.UtcNow.AddDays(-(i % 20 + 1)).AddHours(-i);
            auditRecords.Add(new AuditRecord { EntityType = AuditEntityType.Order, EntityId = order.Id, FromStatus = null, ToStatus = OrderStatus.Pending, ChangedBy = "Customer", CreatedAt = createdAt });

            // 10 stay Pending (awaiting staff to create an assignment), 5 get cancelled before dispatch.
            if (i >= 10)
            {
                order.Cancel(hasDispatchedShipment: false);
                var cancelledAt = createdAt.AddHours(4);
                auditRecords.Add(new AuditRecord { EntityType = AuditEntityType.Order, EntityId = order.Id, FromStatus = OrderStatus.Pending, ToStatus = OrderStatus.Cancelled, ChangedBy = "Staff", CreatedAt = cancelledAt });
            }

            timestampOverrides.Add((order, createdAt));
            timestampOverrides.Add((shipment, createdAt));
        }
    }
}
