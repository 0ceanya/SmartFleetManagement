using SmartFM.Application.Coordinators;

namespace SmartFM.Application;

public class SmartFMSystem
{
    private readonly MasterDataCoordinator _masterDataCoordinator;
    private readonly OrderFulfilmentCoordinator _orderFulfilmentCoordinator;
    private readonly FleetAssignmentCoordinator _fleetAssignmentCoordinator;
    private readonly RecordCoordinator _recordCoordinator;
    private readonly BillingCoordinator _billingCoordinator;
    private readonly ReportingCoordinator _reportingCoordinator;

    public SmartFMSystem(
        MasterDataCoordinator masterDataCoordinator,
        OrderFulfilmentCoordinator orderFulfilmentCoordinator,
        FleetAssignmentCoordinator fleetAssignmentCoordinator,
        RecordCoordinator recordCoordinator,
        BillingCoordinator billingCoordinator,
        ReportingCoordinator reportingCoordinator)
    {
        _masterDataCoordinator = masterDataCoordinator;
        _orderFulfilmentCoordinator = orderFulfilmentCoordinator;
        _fleetAssignmentCoordinator = fleetAssignmentCoordinator;
        _recordCoordinator = recordCoordinator;
        _billingCoordinator = billingCoordinator;
        _reportingCoordinator = reportingCoordinator;
    }

    public async Task Start()
    {
        await _masterDataCoordinator.InitializeMasterDataSubsystem();
        await _orderFulfilmentCoordinator.InitializeOrderSubsystem();
        await _fleetAssignmentCoordinator.InitializeFleetSubsystem();
        await _recordCoordinator.InitializeRecordSubsystem();
        await _billingCoordinator.InitializeBillingSubsystem();
        await _reportingCoordinator.InitializeReportingSubsystem();
    }
}
