using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartFM.Domain.ValueObjects;

namespace SmartFM.Infrastructure.Persistence.EntityConfigurations;

public class ReportConfiguration : IEntityTypeConfiguration<Report>
{
    public void Configure(EntityTypeBuilder<Report> builder)
    {
        builder.ToTable("Reports");
        builder.Property<Guid>("Id").ValueGeneratedOnAdd();
        builder.HasKey("Id");
    }
}
