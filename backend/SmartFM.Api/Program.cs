using Microsoft.EntityFrameworkCore;
using SmartFM.Api.ErrorHandling;
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
builder.Services.AddProblemDetails();
builder.Services.AddExceptionHandler<ApiExceptionHandler>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

builder.Services.AddDbContext<SmartFMDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUnitOfWork, UnitOfWork>();
builder.Services.AddScoped<IPaymentGateway, PaymentGatewayStub>();

builder.Services.AddScoped<MasterDataCoordinator>();
builder.Services.AddScoped<OrderFulfilmentCoordinator>();
builder.Services.AddScoped<FleetAssignmentCoordinator>();
// RecordCoordinator merges audit + incident concerns. The Func<FleetAssignmentCoordinator>
// factory breaks the mutual dependency between RecordCoordinator and FleetAssignmentCoordinator.
builder.Services.AddScoped<RecordCoordinator>(sp => new RecordCoordinator(
    sp.GetRequiredService<IRepository<SmartFM.Domain.Records.AuditRecord>>(),
    sp.GetRequiredService<IRepository<SmartFM.Domain.ValueObjects.Notification>>(),
    sp.GetRequiredService<IRepository<SmartFM.Domain.Records.IncidentRecord>>(),
    sp.GetRequiredService<IRepository<SmartFM.Domain.Entities.Assignment>>(),
    sp.GetRequiredService<IRepository<SmartFM.Domain.Entities.Shipment>>(),
    () => sp.GetRequiredService<FleetAssignmentCoordinator>(),
    sp.GetRequiredService<IUnitOfWork>()));
builder.Services.AddScoped<BillingCoordinator>();
builder.Services.AddScoped<ReportingCoordinator>();
builder.Services.AddScoped<SmartFMSystem>();

var app = builder.Build();

app.UseExceptionHandler();

app.UseCors("Frontend");

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
