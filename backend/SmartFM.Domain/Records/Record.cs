namespace SmartFM.Domain.Records;

public abstract record Record
{
    public Guid Id { get; init; } = Guid.NewGuid();
    public DateTime CreatedAt { get; init; } = DateTime.UtcNow;
}
