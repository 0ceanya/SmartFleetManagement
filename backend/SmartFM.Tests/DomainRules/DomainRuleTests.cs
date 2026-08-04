using SmartFM.Domain.Entities;
using Xunit;

namespace SmartFM.Tests.DomainRules;

// These tests construct domain objects directly and assert on their rules.
// Unlike the coordinator tests, they stand up no database.
public class DomainRuleTests
{
    private static Offering CreateOffering() =>
        new("Giao hang tieu chuan", "Standard delivery", 150000m, maxWeightKg: 1000m, maxVolumeCbm: 10m, "Light");

    private static Warehouse CreateWarehouse() =>
        new("Kho Ha Noi", "So 1 Pham Van Dong, Ha Noi", Guid.NewGuid(), capacityKg: 5000m);

    [Fact]
    public void OfferingAcceptsWeightWithinItsLimit()
    {
        var offering = CreateOffering();

        Assert.True(offering.AcceptsWeight(999m));
        Assert.True(offering.AcceptsWeight(1000m));
        Assert.False(offering.AcceptsWeight(1001m));
    }

    [Fact]
    public void OfferingAcceptsVolumeWithinItsLimitAndTreatsUnspecifiedVolumeAsAcceptable()
    {
        var offering = CreateOffering();

        Assert.True(offering.AcceptsVolume(10m));
        Assert.False(offering.AcceptsVolume(10.5m));
        Assert.True(offering.AcceptsVolume(null));
    }

    [Fact]
    public void WarehouseHasCapacityForWeightUpToItsLimit()
    {
        var warehouse = CreateWarehouse();

        Assert.True(warehouse.HasCapacityFor(4999m));
        Assert.True(warehouse.HasCapacityFor(5000m));
        Assert.False(warehouse.HasCapacityFor(5001m));
    }

    [Fact]
    public void VehicleCanCarryWeightUpToThePayloadFixedByItsSubclass()
    {
        var branchId = Guid.NewGuid();
        var light = new LightVehicle("29A-00001", branchId);
        var medium = new MediumVehicle("29A-00002", branchId);
        var heavy = new HeavyVehicle("29A-00003", branchId);

        Assert.True(light.CanCarry(1000m));
        Assert.False(light.CanCarry(1001m));
        Assert.True(medium.CanCarry(5000m));
        Assert.False(medium.CanCarry(5001m));
        Assert.True(heavy.CanCarry(20000m));
        Assert.False(heavy.CanCarry(20001m));
    }

    [Fact]
    public void VehiclePayloadIsDeterminedByTypeRatherThanByCaller()
    {
        var branchId = Guid.NewGuid();
        var load = 3000m;

        Assert.False(new LightVehicle("29A-00001", branchId).CanCarry(load));
        Assert.True(new MediumVehicle("29A-00002", branchId).CanCarry(load));
        Assert.True(new HeavyVehicle("29A-00003", branchId).CanCarry(load));
    }
}
