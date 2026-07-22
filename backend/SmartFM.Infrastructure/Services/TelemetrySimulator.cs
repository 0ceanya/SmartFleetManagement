using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using SmartFM.Application.Abstractions;
using SmartFM.Application.Coordinators;
using SmartFM.Domain.Entities;
using SmartFM.Domain.ValueObjects;

namespace SmartFM.Infrastructure.Services;

public class TelemetrySimulator : IHostedService, IDisposable
{
    private readonly IServiceProvider _serviceProvider;
    private readonly bool _enabled;
    private readonly Random _random = new();
    private Timer? _timer;

    public TelemetrySimulator(IServiceProvider serviceProvider, IConfiguration configuration)
    {
        _serviceProvider = serviceProvider;
        _enabled = !bool.TryParse(configuration["Telemetry:Enabled"], out var enabled) || enabled;
    }

    public Task StartAsync(CancellationToken cancellationToken)
    {
        _timer = new Timer(Tick, null, TimeSpan.FromSeconds(10), TimeSpan.FromSeconds(10));
        return Task.CompletedTask;
    }

    public Task StopAsync(CancellationToken cancellationToken)
    {
        _timer?.Change(Timeout.Infinite, 0);
        return Task.CompletedTask;
    }

    public void Dispose() => _timer?.Dispose();

    private void Tick(object? state)
    {
        if (!_enabled)
            return;

        using var scope = _serviceProvider.CreateScope();
        var vehicles = scope.ServiceProvider.GetRequiredService<IRepository<Vehicle>>();
        var trackingCoordinator = scope.ServiceProvider.GetRequiredService<TrackingCoordinator>();
        var incidentCoordinator = scope.ServiceProvider.GetRequiredService<IncidentCoordinator>();

        var allVehicles = vehicles.GetAllAsync().GetAwaiter().GetResult();
        foreach (var vehicle in allVehicles)
        {
            vehicle.RegisterObserver(trackingCoordinator);
            vehicle.RegisterObserver(incidentCoordinator);

            var data = new TelemetryData(vehicle.Id, NextLat(), NextLon(), DateTime.UtcNow, IsAnomaly: _random.Next(10) == 0);
            vehicle.NotifyObservers(data);

            Console.WriteLine($"Telemetry pushed for vehicle {vehicle.RegistrationNumber}");
        }
    }

    private double NextLat() => 8.0 + _random.NextDouble() * 15.0;

    private double NextLon() => 102.0 + _random.NextDouble() * 8.0;
}
