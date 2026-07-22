using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartFM.Domain.ValueObjects;

namespace SmartFM.Infrastructure.Persistence.EntityConfigurations;

public class DeliveryConfirmationConfiguration : IEntityTypeConfiguration<DeliveryConfirmation>
{
    public void Configure(EntityTypeBuilder<DeliveryConfirmation> builder)
    {
        builder.ToTable("DeliveryConfirmations");
        builder.Property<Guid>("Id").ValueGeneratedOnAdd();
        builder.HasKey("Id");
    }
}
