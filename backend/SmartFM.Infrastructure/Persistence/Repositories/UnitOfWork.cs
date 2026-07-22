using SmartFM.Application.Abstractions;

namespace SmartFM.Infrastructure.Persistence.Repositories;

public class UnitOfWork : IUnitOfWork
{
    private readonly SmartFMDbContext _context;

    public UnitOfWork(SmartFMDbContext context)
    {
        _context = context;
    }

    public Task<int> SaveChangesAsync(CancellationToken ct = default) => _context.SaveChangesAsync(ct);
}
