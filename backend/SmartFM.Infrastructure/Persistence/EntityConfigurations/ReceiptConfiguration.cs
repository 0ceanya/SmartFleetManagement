using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartFM.Domain.ValueObjects;

namespace SmartFM.Infrastructure.Persistence.EntityConfigurations;

public class ReceiptConfiguration : IEntityTypeConfiguration<Receipt>
{
    public void Configure(EntityTypeBuilder<Receipt> builder)
    {
        builder.ToTable("Receipts");
        builder.Property<Guid>("Id").ValueGeneratedOnAdd();
        builder.HasKey("Id");
    }
}
