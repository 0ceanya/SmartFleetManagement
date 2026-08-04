# Execution, Operation and Testing

**SWE30003 Assignment 3 — Group 19**
Companion to `report.md` §5.3. Addresses the brief's *Evidence of compilation (5 points) and correct execution (25 points)* criteria.

---

## 1. Areas of business operation covered

The brief requires that the implementation *"cover at least four (4) areas of business operation fully and state them clearly"*, accounting for dependencies between the chosen areas. **Six areas are fully implemented**, end to end, from UI through API to persisted state.

| # | Business area | Assignment 1 tasks | UI entry point | API surface | Owning coordinator |
|---|---|---|---|---|---|
| 1 | **Order placement and fulfilment** | Tasks 1, 2 | `/orders` (customer portal) | `POST /api/orders`, `GET /api/orders/{id}`, `POST /api/orders/{id}/cancel`, `/api/customers` | `OrderFulfilmentCoordinator` |
| 2 | **Fleet assignment and delivery execution** | Tasks 3, 5 | `/staff/assignments`, `/driver/assignments` | `/api/fleet/assignments`, `/api/fleet/shipments/{id}/load-manifest`, `.../start-trip`, `.../delivery-confirmation` | `FleetAssignmentCoordinator` |
| 3 | **Billing, payment and receipts** | Tasks 4, 7 | `/staff/billing`, `/orders/receipts/{invoiceId}` | `/api/billing/invoices`, `.../pay`, `.../receipt` | `BillingCoordinator` |
| 4 | **Master data management** | Task 8 | `/admin/masterdata` | `/api/master-data/{branches,warehouses,employees,vehicles,offerings}` | `MasterDataCoordinator` |
| 5 | **Incident reporting** | Task 6 | `/staff/incidents`, driver incident modal | `/api/incidents` | `RecordCoordinator` |
| 6 | **Operational reporting and audit** | Task 9 | `/manager` dashboard, `/manager/reports`, `/manager/notifications` | `/api/reports/*`, `/api/audit/records` | `ReportingCoordinator`, `RecordCoordinator` |

### Dependency between the chosen areas

The brief asks that chosen areas remain fully functional despite depending on others. The dependency chain is genuinely closed here:

```
Master data (4)  ──►  Order placement (1)  ──►  Fleet assignment (2)  ──►  Billing (3)
      │                      │                        │                       │
      └──────────────────────┴────────────────────────┴───────────────────────┘
                                        ▼
                        Incidents (5) and Reporting/Audit (6)
```

Area 1 cannot run without offerings from area 4; area 2 cannot run without orders from area 1; area 3 settles invoices raised in area 1; areas 5 and 6 observe all of the above. Because all six are implemented, no area depends on a stub. `SeedData` populates area 4 at startup so a fresh clone is immediately usable.

### Not implemented — stated deliberately

| Area | Status | Reason |
|---|---|---|
| **Real-time vehicle telemetry / GPS tracking** | Descoped | The system has no live vehicle feed. `TrackingRecord` remains as seed-only demonstration data and `GET /api/tracking/records` serves it, but nothing writes telemetry at runtime. See `docs/design-revision.md`, revision 10 |
| **Actual payment processing** | Message only | Explicitly permitted by the brief: *"the implementation does not need to support payment options as we cannot have a banking system… some simple message will be sufficient"*. `PaymentGatewayStub` returns success and the system prints `Payment processed` |
| **Authentication and authorisation** | Not implemented | Only the driver portal has a client-side session guard. This is the largest known gap and is discussed in `report.md` §4.1 |

---

## 2. Platform and environment

| Item | Value |
|---|---|
| Operating system used for development and testing | macOS (Darwin 25.5.0, Apple Silicon / arm64) |
| Backend runtime | .NET 8 (`net8.0`) |
| Backend language | C# 12 |
| Frontend runtime | Node.js with Next.js 16.2.12, React 19.2.4 |
| Database | SQLite via EF Core (file-based; migrated and seeded at startup) |
| IDE | Visual Studio Code with the C# Dev Kit extension |
| Test framework | xUnit, running against in-memory SQLite |

---

## 3. Deployment and execution

Two processes are required. From the repository root:

**Backend**

```bash
dotnet run --project backend/SmartFM.Api
```

On startup the API applies EF Core migrations (`Database.Migrate()`), seeds master data (`SeedData.SeedAsync`), and runs the bootstrap sequence (`SmartFMSystem.Start()`), which prints one line per subsystem. Swagger UI is served at `http://localhost:5000/swagger/index.html` in the Development environment.

**Frontend**

```bash
cd frontend && npm install && npm run dev
```

The client resolves the API base URL from an environment variable, falling back to a Next.js rewrite proxy in the browser and `http://localhost:5000` server-side.

---

## 4. Evidence of compilation

Both commands were executed on the environment described above; the output below is the actual result.

**Build**

```bash
dotnet build backend/SmartFM.Api/SmartFM.Api.csproj
```

```
Build succeeded.
    2 Warning(s)
    0 Error(s)
Time Elapsed 00:00:11.66
```

The two warnings are `CS8603` (possible null reference return) in `DeliveryConfirmationConfiguration.cs` and `LoadManifestConfiguration.cs`, where EF Core value-converter lambdas return a nullable deserialisation result. They do not affect behaviour.

**Test suite**

```bash
dotnet test backend/SmartFM.Tests/SmartFM.Tests.csproj
```

```
Passed!  - Failed: 0, Passed: 83, Skipped: 0, Total: 83, Duration: 1 s
```

`[Screenshot D-1]` — terminal showing the successful build.
`[Screenshot D-2]` — terminal showing 83/83 tests passing.

---

## 5. Automated test coverage

83 xUnit tests run against a real in-memory SQLite database rather than mocked repositories, so EF Core mapping, discriminators and relational constraints are exercised alongside the business rules. Only `IPaymentGateway` is substituted, by `FakePaymentGateway`, so gateway failure can be forced.

| Test class | Tests | Focus |
|---|---:|---|
| `FleetAssignmentCoordinatorTests` | 33 | Assignment creation, double-booking, warehouse capacity, load manifest, start-trip, delivery confirmation, reallocation |
| `MasterDataCoordinatorTests` | 14 | CRUD for all five master-data entities, duplicate-name rejection, vehicle class payloads |
| `OrderFulfilmentCoordinatorTests` | 12 | Order placement, cargo validation against offering limits, customer reuse, cancellation |
| `ReportingCoordinatorTests` | 10 | Report generation and dashboard aggregations |
| `RecordCoordinatorTests` | 9 | Audit trail writes, incident reporting, audit querying and paging |
| `BillingCoordinatorTests` | 5 | Invoice generation, the three payment strategies, gateway failure, double payment |

Coverage is concentrated at the Application layer, which is where the business rules live. There are no unit tests for controllers, the Infrastructure repository, or the frontend — a limitation stated openly in `report.md` §4.

---

## 6. Test record

The full test record is `docs/test-cases.csv`, with the columns `Scenario, No., Objective, Design, Input, Expected Output, Actual Output, Result`.

**How to read the Result column.** Rows marked **Pass** are backed by an automated test in the suite above, or by an unambiguous code path confirmed during review; every *Expected Output* string in those rows is quoted from the actual source, not paraphrased. Rows marked **To verify** are user-interface behaviours that need a screenshot from a running system — the team should complete the *Actual Output* cell when capturing Appendix D.

The record covers all five evidence types the brief asks for:

| Brief requirement | Example rows |
|---|---|
| (i) an empty UI at the start of a scenario | 62 |
| (ii) takes correct input | 1, 14, 32, 36, 42, 49 |
| (iii) validation of incorrect input | 2–8, 10, 15–17, 19, 22–23, 25–26, 30–31, 33, 37, 39, 45–47, 51–52, 56 |
| (iv) change or deletion of input after a change of mind | 40 (reallocate an assignment), 54 (edit master data), 55 (delete), plus order cancellation |
| (v) successful completion of the scenario | 1, 24, 34, 36, 42–44, 48, 57 |

---

## 7. Assignment 2 scenarios re-verified

Assignment 2 defined six verification scenarios. Their status against the delivered system:

| A2 scenario | Status | Notes |
|---|---|---|
| **S1 — Browse offerings and place order** | Implemented, with one design change | The customer no longer selects a warehouse; the capacity check moved to assignment creation. The tutor's correction that *"Cargo should be created from Order (not Shipment)"* is implemented — `Cargo.OrderId` |
| **S2 — Customer monitors order status** | Implemented differently | Status is read from `GET /api/orders/{id}` rather than through an `ITrackable` interface, which no longer exists. The customer sees order and shipment status, not live GPS |
| **S3 — Vehicle and driver assignment** | Implemented, one rule missing | Double-booking rejection and warehouse capacity are enforced; the **Hours-of-Service check the tutor asked for is absent**. See `docs/design-revision.md`, item R1 |
| **S4 — Real-time telemetry and checkpoint tracking** | **Descoped** | No live telemetry source exists. Seeded `TrackingRecord` data and the map view demonstrate the intended shape only |
| **S5 — Manifest resolution and receipt generation** | Implemented, and extended | The manifest is now a per-item checklist gating trip start, which is stricter than A2 described; damaged or missing items recorded at drop-off flow into the delivery confirmation |
| **S6 — Master data maintenance and operational reporting** | Implemented | Full CRUD across five entities, with every mutation writing an `AuditRecord`, feeding the manager reports |

---

## 8. Scenario walkthroughs

Each walkthrough lists what the user enters and what the system returns. Screenshots belong in Appendix D at the points marked.

### Walkthrough A — Customer places an order (S1)

1. Open `/orders`. The offering catalogue loads from `GET /api/master-data/offerings`. `[Screenshot D-3 — empty form]`
2. Choose an offering, then enter name, email, phone, pickup address and delivery address.
3. Add cargo items — description, weight (kg), optional volume (m³), hazardous flag. The form shows the running total weight, which becomes `Order.OrderWeightKg`.
4. Submit an item heavier than the offering allows to see validation. The API replies 409 and the UI shows *"WeightKg 1500 exceeds offering limit of 1000."* `[Screenshot D-4 — validation]`
5. Correct the weight and submit. The order is created with status **Pending**, with a shipment and an unpaid invoice. `[Screenshot D-5 — success]`

### Walkthrough B — Staff dispatch an order (S3)

1. Open `/staff/orders`, select the pending order, then create an assignment.
2. Pick shipments, an available driver and an available vehicle; optionally add a route and a staging warehouse.
3. Selecting a driver who already holds an active assignment returns *"Driver {id} already has an active assignment."* `[Screenshot D-6 — double-booking refused]`
4. Submit valid choices. Assignment status becomes **Pending**, shipment **Assigned**, order **Approved**, and the driver and vehicle are marked unavailable.
5. Approve the assignment. Status becomes **Assigned** and the order moves to **Active**. `[Screenshot D-7]`

### Walkthrough C — Driver completes a delivery (S5)

1. Sign in at `/driver` and open the assigned job.
2. Open the load manifest — every cargo item on the order appears as a checklist row.
3. Attempt to start the trip early: *"All cargo items must be checked as loaded before starting."* `[Screenshot D-8]`
4. Tick every item and confirm loading. Assignment moves **Assigned → Loaded**.
5. Start the trip. Shipment becomes **InTransit**, assignment **Delivering**. `[Screenshot D-9]`
6. On arrival, record any damaged or missing items, enter the recipient name and signature, and confirm delivery. Shipment **Delivered**, assignment **Delivered**, order **Fulfilled**, driver and vehicle released. `[Screenshot D-10]`

### Walkthrough D — Billing and receipt (S4 area)

1. Open `/staff/billing` and select the unpaid invoice raised with the order.
2. Settle it by Cash, Card or Digital. For Card and Digital the stub gateway is called and the system prints `Payment processed`; no real transaction occurs, as the brief permits.
3. The invoice becomes **Paid** and a receipt is issued, viewable at `/orders/receipts/{invoiceId}`. `[Screenshot D-11]`

### Walkthrough E — Master data and reporting (S6)

1. Open `/admin/masterdata` and create a branch. Re-submitting the same name is refused as a duplicate. `[Screenshot D-12]`
2. Edit a warehouse capacity, then delete an unused record — the change-of-mind path. `[Screenshot D-13]`
3. Open `/manager` for fleet and order KPIs, `/manager/reports` to generate a report over a date range, and `/manager/notifications` for the audit feed, which polls every 30 seconds. `[Screenshot D-14]`
