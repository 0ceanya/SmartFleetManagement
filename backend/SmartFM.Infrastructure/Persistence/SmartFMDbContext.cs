using Microsoft.EntityFrameworkCore;
using SmartFM.Domain.Entities;
using SmartFM.Domain.ValueObjects;
using DomainRecord = SmartFM.Domain.Records.Record;

namespace SmartFM.Infrastructure.Persistence;

public class SmartFMDbContext : DbContext
{
    public SmartFMDbContext(DbContextOptions<SmartFMDbContext> options) : base(options) { }

    public DbSet<Branch> Branches => Set<Branch>();
    public DbSet<Warehouse> Warehouses => Set<Warehouse>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Shipment> Shipments => Set<Shipment>();
    public DbSet<Cargo> Cargoes => Set<Cargo>();
    public DbSet<Offering> Offerings => Set<Offering>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<Route> Routes => Set<Route>();
    public DbSet<Assignment> Assignments => Set<Assignment>();
    public DbSet<Invoice> Invoices => Set<Invoice>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<DomainRecord> Records => Set<DomainRecord>();
    public DbSet<Receipt> Receipts => Set<Receipt>();
    public DbSet<Report> Reports => Set<Report>();
    public DbSet<LoadManifest> LoadManifests => Set<LoadManifest>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<DeliveryConfirmation> DeliveryConfirmations => Set<DeliveryConfirmation>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(SmartFMDbContext).Assembly);
    }
}
