using SmartFM.Application.Coordinators;

namespace SmartFM.Application;

public class SmartFMSystem
{
    private readonly MasterDataCoordinator _masterDataCoordinator;
    private readonly OrderFulfilmentCoordinator _orderFulfilmentCoordinator;
    private readonly FleetAssignmentCoordinator _fleetAssignmentCoordinator;
    private readonly TrackingCoordinator _trackingCoordinator;
    private readonly IncidentCoordinator _incidentCoordinator;
    private readonly BillingCoordinator _billingCoordinator;
    private readonly ReportingCoordinator _reportingCoordinator;

    public SmartFMSystem(
        MasterDataCoordinator masterDataCoordinator,
        OrderFulfilmentCoordinator orderFulfilmentCoordinator,
        FleetAssignmentCoordinator fleetAssignmentCoordinator,
        TrackingCoordinator trackingCoordinator,
        IncidentCoordinator incidentCoordinator,
        BillingCoordinator billingCoordinator,
        ReportingCoordinator reportingCoordinator)
    {
        _masterDataCoordinator = masterDataCoordinator;
        _orderFulfilmentCoordinator = orderFulfilmentCoordinator;
        _fleetAssignmentCoordinator = fleetAssignmentCoordinator;
        _trackingCoordinator = trackingCoordinator;
        _incidentCoordinator = incidentCoordinator;
        _billingCoordinator = billingCoordinator;
        _reportingCoordinator = reportingCoordinator;
    }

    public async Task Start()
    {
        await _masterDataCoordinator.InitializeMasterDataSubsystem();
        await _orderFulfilmentCoordinator.InitializeOrderSubsystem();
        await _fleetAssignmentCoordinator.InitializeFleetSubsystem();
        await _trackingCoordinator.InitializeTrackingSubsystem();
        await _incidentCoordinator.InitializeIncidentSubsystem();
        await _billingCoordinator.InitializeBillingSubsystem();
        await _reportingCoordinator.InitializeReportingSubsystem();
    }
}
