using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartFM.Domain.Entities;

namespace SmartFM.Infrastructure.Persistence.EntityConfigurations;

public class CargoConfiguration : IEntityTypeConfiguration<Cargo>
{
    public void Configure(EntityTypeBuilder<Cargo> builder)
    {
        builder.ToTable("Cargoes");
        builder.HasKey(c => c.Id);
        builder.Property(c => c.Description).IsRequired();
        builder.Property(c => c.WeightKg).HasPrecision(18, 2);
        builder.Property(c => c.VolumeCbm).HasPrecision(18, 2);
    }
}
