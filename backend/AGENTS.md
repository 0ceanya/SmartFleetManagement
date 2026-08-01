# Domain Model Update - Direct Cargo Specifications & Order Ownership

## Overview
Refactored the SmartFleetManagement domain model so that:
1. `Cargo` is created directly by and belongs to `Order` (`OrderId`), NOT `Shipment`. An `Order` comprises a list of `Cargoes` and a list of `Shipments`.
2. Volume (`VolumeCbm`), Description (`Description`), and Hazardous flag (`IsHazardous`) are specified directly per `Cargo` item.
3. `Order.OrderWeightKg` is set directly to the sum of the `WeightKg` of all its cargoes (`Cargoes.Sum(c => c.WeightKg)`).

## Key Architectural & Domain Changes

### 1. Domain Entities (`SmartFM.Domain`)  
- **[Cargo]
  - Property `OrderId` (Guid) links cargo directly to `Order`.
  - Cargo properties: `Id`, `OrderId`, `Description`, `WeightKg`, `VolumeCbm`, `IsHazardous`.
  - Constructor: `public Cargo(Guid orderId, string description, decimal weightKg, decimal? volumeCbm, bool isHazardous)`.
- **[Order]
  - Property `Cargoes` (`List<Cargo>`) contains all cargo belonging to the order.
  - Property `OrderWeightKg` stores total order weight, updated via `AddCargo` (`Cargoes.Sum(c => c.WeightKg)`).
- **[Shipment]**:
  - Contains `OrderId` linking back to `Order`. Removed `Cargoes` collection.

### 2. Infrastructure & EF Core (`SmartFM.Infrastructure`)
- Removed `LineItem.cs`, `LineItemConfiguration.cs`, and `DbSet<LineItem>` from `SmartFMDbContext`.
- **[OrderConfiguration]**:
  - Configured 1-to-many relationship `Order -> Cargoes` with `AutoInclude()`.
- **[CargoConfiguration]**:
  - Mapped `OrderId` foreign key and column precisions.
- **Migrations**:
  - Created and applied EF Core migration `RemoveLineItemsAndUseCargoWeight`.

### 3. Application Coordinators (`SmartFM.Application`)
- **[OrderFulfilmentCoordinator]**:
  - Simplified `CargoData` to `(string Description, decimal WeightKg, decimal? VolumeCbm, bool IsHazardous)`.
  - `PlaceOrderAsync` calculates `totalCargoWeightKg = cargoItems.Sum(c => c.WeightKg)` and sets `Order.OrderWeightKg`.

### 4. API DTOs & Controller (`SmartFM.Api`)
- **[OrderDtos]**:
  - `CargoItemRequest`: `Description`, `WeightKg` (required), `VolumeCbm`, `IsHazardous`.
  - `OrderDetailsResponse`: returns `Cargoes` and `Shipments` for the order.
- **[OrdersController]**:
  - Maps `CargoItemRequest` directly to `CargoData`.

### 5. Frontend (`frontend`)
- **[CargoForm.jsx]**:
  - Allows users to specify cargo items with weight and details directly per container, displaying total calculated order weight.

### 6. Verification Status
- Built API project: `dotnet build SmartFM.Api/SmartFM.Api.csproj` (0 errors, 0 warnings).
- Executed unit test suite: `dotnet test SmartFM.Tests/SmartFM.Tests.csproj` (36/36 tests passed).
