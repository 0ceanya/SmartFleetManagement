using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartFM.Domain.Entities;

namespace SmartFM.Infrastructure.Persistence.EntityConfigurations;

public class PaymentConfiguration : IEntityTypeConfiguration<Payment>
{
    public void Configure(EntityTypeBuilder<Payment> builder)
    {
        builder.ToTable("Payments");
        builder.HasKey(p => p.Id);
        builder.HasDiscriminator<string>("PaymentType")
            .HasValue<CashPayment>("Cash")
            .HasValue<CardPayment>("Card")
            .HasValue<DigitalPayment>("Digital");
    }
}
