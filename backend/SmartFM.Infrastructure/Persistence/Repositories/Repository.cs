using Microsoft.EntityFrameworkCore;
using SmartFM.Application.Abstractions;

namespace SmartFM.Infrastructure.Persistence.Repositories;

public class Repository<T> : IRepository<T> where T : class
{
    private readonly SmartFMDbContext _context;

    public Repository(SmartFMDbContext context)
    {
        _context = context;
    }

    public async Task<T?> GetByIdAsync(Guid id, CancellationToken ct = default) =>
        await _context.Set<T>().FindAsync([id], ct);

    public async Task<IEnumerable<T>> GetAllAsync(CancellationToken ct = default) =>
        await _context.Set<T>().ToListAsync(ct);

    public async Task AddAsync(T entity, CancellationToken ct = default) =>
        await _context.Set<T>().AddAsync(entity, ct);

    public void Update(T entity) => _context.Set<T>().Update(entity);

    public void UpdateValues(T trackedEntity, T updatedValues) =>
        _context.Entry(trackedEntity).CurrentValues.SetValues(updatedValues);

    public void Remove(T entity) => _context.Set<T>().Remove(entity);
}
