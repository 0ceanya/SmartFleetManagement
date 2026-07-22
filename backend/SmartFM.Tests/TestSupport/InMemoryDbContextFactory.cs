using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SmartFM.Infrastructure.Persistence;

namespace SmartFM.Tests.TestSupport;

public sealed class InMemoryDbContextFactory : IDisposable
{
    private readonly SqliteConnection _connection;

    public InMemoryDbContextFactory()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();
        using var context = CreateContext();
        context.Database.EnsureCreated();
    }

    public SmartFMDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<SmartFMDbContext>()
            .UseSqlite(_connection)
            .Options;
        return new SmartFMDbContext(options);
    }

    public void Dispose() => _connection.Dispose();
}
