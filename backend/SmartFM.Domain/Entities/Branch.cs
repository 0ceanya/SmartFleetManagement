namespace SmartFM.Domain.Entities;

public class Branch
{
    public Guid Id { get; private set; } = Guid.NewGuid();
    public string Name { get; private set; } = string.Empty;
    public string City { get; private set; } = string.Empty;

    private Branch() { }

    public Branch(string name, string city)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(name);
        ArgumentException.ThrowIfNullOrWhiteSpace(city);
        Name = name;
        City = city;
    }
}
