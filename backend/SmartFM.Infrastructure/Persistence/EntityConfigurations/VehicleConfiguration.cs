using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartFM.Domain.Entities;

namespace SmartFM.Infrastructure.Persistence.EntityConfigurations;

public class VehicleConfiguration : IEntityTypeConfiguration<Vehicle>
{
    public void Configure(EntityTypeBuilder<Vehicle> builder)
    {
        builder.ToTable("Vehicles");
        builder.HasKey(v => v.Id);
        builder.Property(v => v.RegistrationNumber).IsRequired();
        builder.Property(v => v.CurrentStatus).IsRequired();
        builder.HasDiscriminator<string>("VehicleType")
            .HasValue<LightVehicle>("Light")
            .HasValue<MediumVehicle>("Medium")
            .HasValue<HeavyVehicle>("Heavy");
    }
}
