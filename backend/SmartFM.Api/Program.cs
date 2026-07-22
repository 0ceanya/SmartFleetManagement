using Microsoft.EntityFrameworkCore;
using SmartFM.Application;
using SmartFM.Application.Abstractions;
using SmartFM.Application.Coordinators;
using SmartFM.Domain.Interfaces;
using SmartFM.Infrastructure.Persistence;
using SmartFM.Infrastructure.Persistence.Repositories;
using SmartFM.Infrastructure.Seed;
using SmartFM.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c => c.SwaggerDoc("v1", new() { Title = "SmartFM API", Version = "v1" }));

builder.Services.AddDbContext<SmartFMDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IPaymentGateway, PaymentGatewayStub>();

builder.Services.AddScoped<MasterDataCoordinator>();
builder.Services.AddScoped<OrderFulfilmentCoordinator>();
builder.Services.AddScoped<FleetAssignmentCoordinator>();
builder.Services.AddScoped<TrackingCoordinator>();
builder.Services.AddScoped<IncidentCoordinator>();
builder.Services.AddScoped<BillingCoordinator>();
builder.Services.AddScoped<ReportingCoordinator>();
builder.Services.AddScoped<SmartFMSystem>();

builder.Services.AddHostedService<TelemetrySimulator>();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

using (var scope = app.Services.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<SmartFMDbContext>();
    context.Database.Migrate();
    await SeedData.SeedAsync(context);

    var system = scope.ServiceProvider.GetRequiredService<SmartFMSystem>();
    await system.Start();
}

app.MapControllers();

app.Run();
