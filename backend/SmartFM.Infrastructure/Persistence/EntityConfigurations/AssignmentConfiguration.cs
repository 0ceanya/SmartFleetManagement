using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartFM.Domain.Entities;

namespace SmartFM.Infrastructure.Persistence.EntityConfigurations;

public class AssignmentConfiguration : IEntityTypeConfiguration<Assignment>
{
    public void Configure(EntityTypeBuilder<Assignment> builder)
    {
        builder.ToTable("Assignments");
        builder.HasKey(a => a.Id);
        builder.Property(a => a.Status).IsRequired();
        builder.HasOne<Route>()
            .WithMany()
            .HasForeignKey(a => a.RouteId)
            .IsRequired(false)
            .OnDelete(DeleteBehavior.SetNull);
    }
}
