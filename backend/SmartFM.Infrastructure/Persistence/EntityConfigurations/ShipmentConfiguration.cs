using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartFM.Domain.Entities;

namespace SmartFM.Infrastructure.Persistence.EntityConfigurations;

public class ShipmentConfiguration : IEntityTypeConfiguration<Shipment>
{
    public void Configure(EntityTypeBuilder<Shipment> builder)
    {
        builder.ToTable("Shipments");
        builder.HasKey(s => s.Id);
        builder.Property(s => s.Status).IsRequired();
        builder.Property(s => s.PickupAddress).IsRequired();
        builder.Property(s => s.DeliveryAddress).IsRequired();
        builder.HasOne<Assignment>()
            .WithMany()
            .HasForeignKey(s => s.AssignmentId)
            .IsRequired(false);
    }
}
