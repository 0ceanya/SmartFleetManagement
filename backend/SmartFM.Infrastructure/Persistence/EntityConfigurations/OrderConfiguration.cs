using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartFM.Domain.Entities;

namespace SmartFM.Infrastructure.Persistence.EntityConfigurations;

public class OrderConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");
        builder.HasKey(o => o.Id);
        builder.Property(o => o.Status).IsRequired();
        builder.Property(o => o.OrderWeightKg).HasPrecision(18, 2);
        builder.HasMany(o => o.Shipments)
            .WithOne()
            .HasForeignKey(s => s.OrderId);
        builder.HasMany(o => o.Cargoes)
            .WithOne()
            .HasForeignKey(c => c.OrderId);
        builder.Navigation(o => o.Cargoes).AutoInclude();
    }
}
