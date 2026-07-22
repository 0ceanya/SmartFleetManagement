using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using SmartFM.Domain.Records;
using DomainRecord = SmartFM.Domain.Records.Record;

namespace SmartFM.Infrastructure.Persistence.EntityConfigurations;

public class RecordConfiguration : IEntityTypeConfiguration<DomainRecord>
{
    public void Configure(EntityTypeBuilder<DomainRecord> builder)
    {
        builder.ToTable("Records");
        builder.HasKey(r => r.Id);
        builder.HasDiscriminator<string>("RecordType")
            .HasValue<TrackingRecord>("Tracking")
            .HasValue<IncidentRecord>("Incident")
            .HasValue<AuditRecord>("Audit")
            .HasValue<MaintenanceRecord>("Maintenance");
    }
}
