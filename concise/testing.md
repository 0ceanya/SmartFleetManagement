# Execution, Operation and Testing

**SWE30003 Assignment 3 — Group 19** · Companion to `report.md` §5.3 · Addresses *evidence of compilation (5) and correct execution (25)*

---

## 1. Areas of business operation covered

The brief requires *"at least four (4) areas… fully and state them clearly"*. **Six are implemented end to end.**

| # | Business area | A1 tasks | UI | API | Coordinator |
|---|---|---|---|---|---|
| 1 | **Order placement and fulfilment** | 1, 2 | `/orders` | `/api/orders`, `/api/customers` | `OrderFulfilmentCoordinator` |
| 2 | **Fleet assignment and delivery** | 3, 5 | `/staff/assignments`, `/driver/assignments` | `/api/fleet/*` | `FleetAssignmentCoordinator` |
| 3 | **Billing, payment, receipts** | 4, 7 | `/staff/billing`, `/orders/receipts/{id}` | `/api/billing/*` | `BillingCoordinator` |
| 4 | **Master data management** | 8 | `/admin/masterdata` | `/api/master-data/*` | `MasterDataCoordinator` |
| 5 | **Incident reporting** | 6 | `/staff/incidents`, driver modal | `/api/incidents` | `RecordCoordinator` |
| 6 | **Reporting and audit** | 9 | `/manager`, `/manager/reports`, `/manager/notifications` | `/api/reports/*`, `/api/audit/records` | `ReportingCoordinator`, `RecordCoordinator` |

**Dependency between areas** — the brief asks that chosen areas stay functional despite depending on others. The chain is genuinely closed: area 1 needs offerings from area 4; area 2 needs orders from area 1; area 3 settles invoices from area 1; areas 5 and 6 observe all of them. Because all six are implemented, no area depends on a stub. `SeedData` populates branches, warehouses, offerings, vehicles, drivers, staff, customers and sample orders at startup, so a fresh clone is immediately usable.

**Not implemented, stated deliberately.**

| Area | Status | Reason |
|---|---|---|
| Real-time telemetry / GPS tracking | Descoped | No live vehicle feed exists. `TrackingRecord` remains as seed-only demo data |
| Actual payment processing | Message only | Permitted by the brief: *"some simple message will be sufficient"*. `PaymentGatewayStub` returns success and prints `Payment processed` |
| Authentication and authorisation | Not implemented | Only the driver portal has a client-side guard. The largest known gap; discussed in `report.md` §4.1 |

---

## 2. Platform and execution

| Item | Value |
|---|---|
| OS (development and testing) | macOS (Darwin 25.5.0, Apple Silicon / arm64) |
| Backend | .NET 8 (`net8.0`), C# 12 |
| Frontend | Node.js, Next.js 16.2.12, React 19.2.4 |
| Database | SQLite via EF Core — migrated and seeded at startup |
| IDE | Visual Studio Code with the C# Dev Kit |
| Tests | xUnit against in-memory SQLite |

```bash
dotnet run --project backend/SmartFM.Api
```

```bash
cd frontend && npm install && npm run dev
```

On startup the API runs `Database.Migrate()`, `SeedData.SeedAsync()` and `SmartFMSystem.Start()`, printing one line per subsystem. Swagger UI is at `http://localhost:5000/swagger/index.html`.

---

## 3. Evidence of compilation

Both commands were executed on the environment above; output is the actual result.

```
$ dotnet build backend/SmartFM.Api/SmartFM.Api.csproj
Build succeeded.  2 Warning(s)  0 Error(s)   Time Elapsed 00:00:11.66

$ dotnet test backend/SmartFM.Tests/SmartFM.Tests.csproj
Passed!  - Failed: 0, Passed: 83, Skipped: 0, Total: 83, Duration: 1 s
```

Both warnings are `CS8603` (possible null reference return) in EF value-converter lambdas in `DeliveryConfirmationConfiguration.cs` and `LoadManifestConfiguration.cs`. They do not affect behaviour.

*[Screenshot D-1 — build]* · *[Screenshot D-2 — tests]*

---

## 4. Automated test coverage

83 xUnit tests run against a real in-memory SQLite database rather than mocked repositories, so EF mapping, discriminators and relational constraints are exercised alongside the business rules. Only `IPaymentGateway` is substituted — by `FakePaymentGateway`, so gateway failure can be forced.

| Test class | Tests | Focus |
|---|---:|---|
| `FleetAssignmentCoordinatorTests` | 33 | Assignment creation, double-booking, capacity, load manifest, start-trip, delivery, reallocation |
| `MasterDataCoordinatorTests` | 14 | CRUD across five entities, duplicate names, vehicle payloads |
| `OrderFulfilmentCoordinatorTests` | 12 | Placement, cargo validation, customer reuse, cancellation |
| `ReportingCoordinatorTests` | 10 | Report generation and dashboard aggregations |
| `RecordCoordinatorTests` | 9 | Audit writes, incidents, querying and paging |
| `BillingCoordinatorTests` | 5 | Invoicing, three payment strategies, gateway failure, double payment |

Coverage concentrates at the Application layer, where the business rules live. There are no controller, Infrastructure or frontend unit tests — a limitation stated openly in `report.md` §4.1.

---

## 5. Test record

Full record in **`../docs/test-cases.csv`** — columns `Scenario, No., Objective, Design, Input, Expected Output, Actual Output, Result`.

Rows marked **Pass** are backed by an automated test or an unambiguous code path confirmed in review; every *Expected Output* string is quoted from the actual source, not paraphrased. Rows marked **To verify** are UI behaviours needing a screenshot from a running system — complete their *Actual Output* cell when capturing Appendix D.

All five evidence types the brief requires are covered:

| Brief requirement | Rows |
|---|---|
| (i) empty UI at scenario start | 62 |
| (ii) takes correct input | 1, 14, 32, 36, 42, 49 |
| (iii) validation of incorrect input | 2–8, 10, 15–17, 19, 22–23, 25–26, 30–31, 33, 37, 39, 45–47, 51–52, 56 |
| (iv) change or deletion after a change of mind | 40, 54, 55, plus order cancellation |
| (v) successful completion | 1, 24, 34, 36, 42–44, 48, 57 |

---

## 6. Assignment 2 scenarios re-verified

| A2 scenario | Status | Notes |
|---|---|---|
| **S1** Browse offerings, place order | Implemented, one design change | Customer no longer selects a warehouse; capacity check moved to assignment creation. The marker's *"Cargo should be created from Order"* correction is implemented |
| **S2** Customer monitors order status | Implemented differently | Status read from `GET /api/orders/{id}`; `ITrackable` no longer exists. Customer sees order/shipment status, not live GPS |
| **S3** Vehicle and driver assignment | Implemented, one rule missing | Double-booking and capacity enforced; **the Hours-of-Service check the marker asked for is absent** |
| **S4** Real-time telemetry | **Descoped** | No live telemetry source; seeded data and the map view show intended shape only |
| **S5** Manifest and receipt | Implemented and extended | Per-item checklist gating trip start — stricter than A2 described; damaged items recorded at drop-off flow into the confirmation |
| **S6** Master data and reporting | Implemented | Full CRUD across five entities, every mutation writing an `AuditRecord` feeding manager reports |

---

## 7. Scenario walkthroughs

**A — Customer places an order (S1).** Open `/orders`; the catalogue loads from `GET /api/master-data/offerings` *[D-3, empty form]*. Choose an offering, enter contact and addresses, then add cargo items (description, weight, optional volume, hazardous flag) — the form shows a running total that becomes `Order.OrderWeightKg`. Submitting an over-limit item returns 409 and the UI shows *"WeightKg 1500 exceeds offering limit of 1000."* *[D-4]*. Correct it and submit: the order is created **Pending** with a shipment and unpaid invoice *[D-5]*.

**B — Staff dispatch (S3).** From `/staff/orders`, select the pending order and create an assignment: shipments, an available driver and vehicle, optionally a route and staging warehouse. Choosing a busy driver returns *"Driver {id} already has an active assignment."* *[D-6]*. On valid input the assignment is **Pending**, shipment **Assigned**, order **Approved**, driver and vehicle held. Approving moves the assignment to **Assigned** and the order to **Active** *[D-7]*.

**C — Driver completes delivery (S5).** Sign in at `/driver` and open the job. The load manifest lists every cargo item as a checklist row. Starting early is refused: *"All cargo items must be checked as loaded before starting."* *[D-8]*. Tick all items and confirm loading — assignment **Assigned → Loaded**. Start the trip — shipment **InTransit**, assignment **Delivering** *[D-9]*. On arrival, record any damaged items, enter recipient and signature, and confirm: shipment and assignment **Delivered**, order **Fulfilled**, driver and vehicle released *[D-10]*.

**D — Billing (area 3).** From `/staff/billing`, settle the invoice by Cash, Card or Digital. Card and Digital call the stub gateway, which prints `Payment processed`; no real transaction occurs, as the brief permits. The invoice becomes **Paid** and a receipt is viewable at `/orders/receipts/{invoiceId}` *[D-11]*.

**E — Master data and reporting (S6).** At `/admin/masterdata`, create a branch; re-submitting the same name is refused *[D-12]*. Edit a warehouse capacity, then delete an unused record — the change-of-mind path *[D-13]*. Open `/manager` for KPIs, `/manager/reports` to generate a report over a date range, and `/manager/notifications` for the audit feed, which polls every 30 seconds *[D-14]*.
