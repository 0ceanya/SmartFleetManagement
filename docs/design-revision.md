# Summary of Design Revision

**SWE30003 Assignment 3 — Group 19**
Companion to `report.md` §2.

---

## 1. Purpose

This document summarises every material change made to the Assignment 2 object design during detailed design and implementation, together with the reason for each change, the design principle that motivated it, and the quality attribute it improved.

It is deliberately separated from the main report so that the change record can be reviewed on its own against the Assignment 2 submission.

Each row below is traceable to one of four evidence sources, cited inline:

| Tag | Source |
|---|---|
| **[Tutor]** | Assignment 2 marker's written comments (Canvas mark sheet, 78/100) |
| **[Log]** | `CLAUDE.md` — the team's design-decision log, *Design Revisions* and *Extensions Register* sections |
| **[Commit]** | Git commit in this repository |
| **[Brief]** | Assignment 3 specification |

No reason in this table is inferred. Where the team's original motivation was not recorded, the cell says so explicitly.

---

## 2. Table 1 — Major design revisions

| # | Assignment 2 | Assignment 3 (delivered) | Reason | Design principle | Quality improved |
|---|---|---|---|---|---|
| 1 | `SmartFMSystem` and seven `*Coordinator` classes modelled inside the domain class diagram | Coordinators removed from the domain model; retained in code as a distinct **Application layer** (`SmartFM.Application`) | **[Tutor]** *"Unsuitable technical classes (not a concern at this stage): SmartFMSystem, coordinator classes"* and *"several unneeded associations… e.g. (FleetAssignmentCoordinator; \*), (MasterDataCoordinator; \*)"* | Separation of concerns; Layered Architecture | Modifiability, Comprehensibility |
| 2 | `MaintenanceRecord` in the `Record` hierarchy; `Vehicle` owns maintenance history | Removed entirely — no maintenance concept in the delivered system | **[Tutor]** *"Vehicle maintenance: not listed as part of the scope, yet still modelled in the diagram"* | Scope discipline (YAGNI) | Comprehensibility, Testability |
| 3 | `Cargo` created by and owned by `Shipment` (`Shipment.addCargoBatch`) | `Cargo.OrderId` — cargo is created by and owned by `Order`; `Order.Cargoes` list; `LineItem` deleted; `Order.OrderWeightKg` derived as `Cargoes.Sum(WeightKg)` | **[Tutor]** Scenario 1: *"Cargo should be created from Order (not Shipment)"*. **[Log]** cargo is a property of the order the customer placed, not of a shipment leg staff create later; tying it to `Shipment` would force staff to duplicate or arbitrarily split cargo declarations | Information Expert (GRASP); Creator | Data integrity, Modifiability |
| 4 | Composition used widely: `(Branch;*)`, `(Order;Invoice)`, `(Invoice;Payment)`, `(Shipment;*)`, `(Vehicle;*)`, `(Assignment;*)` | Plain associations with FK references; only `Order → Cargo` and `Order → Shipment` remain true ownership | **[Tutor]** *"several incorrect compositions"*, and heuristic H14 marked down in *Quality of Design Solution* | Riel H14 (containment vs. association) | Correctness of model, Maintainability |
| 5 | Assumption A6: one order → one destination → one route; `Order`–`Shipment` 1:1 and `Assignment`–`Shipment` 1:1 | `Order.Shipments` is a `List<Shipment>`; `Assignment` binds **many** shipments via `Shipment.AssignmentId` | **[Commit]** `319c6ab`: *"Order.Shipments is now a list (was 1:1); Assignment binds many shipments via Shipment.AssignmentId FK (was 1:1)"* — a single dispatch consolidating several orders was unrepresentable under the 1:1 model | Correct multiplicity; Low Coupling | Scalability, Modifiability |
| 6 | Persistence explicitly out of scope; `PersistenceManager` listed as a *discarded* candidate | Full persistence layer: `IRepository<T>`, `IUnitOfWork`, `SmartFMDbContext` (19 `DbSet`s), 19 Fluent-API configurations, EF Core migration, `SeedData` | **[Log]** Extensions Register: *"A2 excluded persistence by scope"*. **[Brief]** implementation must actually run and store data | Repository pattern; Dependency Inversion | Reliability, Testability |
| 7 | View/UI out of scope — MVC's View named only as a bootstrap responsibility | Next.js web client with five role portals (customer, staff, driver, manager, admin) over a REST API | **[Log]** Extensions Register: *"Presentation out of A2 scope; zero business logic client-side"*. **[Brief]** a simple UI is required, with input validation | MVC with an HTTP boundary; Client–Server | Usability, Modifiability |
| 8 | Customer selects the `Warehouse` at order placement; capacity checked in `OrderFulfilmentCoordinator` | `POST /api/orders` takes `pickupAddress`/`deliveryAddress` only; `Shipment.WarehouseId` nullable and set later by staff; capacity check moved to `FleetAssignmentCoordinator.CreateAssignmentAsync` | **[Log]** a customer choosing an internal ABC-Trans warehouse *"has no basis to make that decision"*, *"leaks internal operational structure through the public API (violates information hiding)"*, and puts the decision with the wrong actor | Information Hiding; correct responsibility assignment | Security, Usability, Modifiability |
| 9 | `Route` warehouse-linked, server-computed (`EstimatedDurationHours = distance / 50 km/h`) | `Route` is a passive data holder: plain origin/destination strings, optional frontend-supplied `DistanceKm`, `EstimatedDurationMinutes`, `WaypointsJson`; `Assignment.RouteId` nullable | **[Log]** geospatial computation *"is a presentation-layer concern that belongs behind a map API on the frontend; the backend's job is to store itinerary facts, not derive them"*; also keeps the demo runnable offline | Separation of concerns; High Cohesion | Testability, Performance |
| 10 | `ITrackable`, `Observer`, `TrackingCoordinator`, `IncidentCoordinator`, `TelemetrySimulator`; Observer pattern carried tracking/incident events | All removed. `TrackingCoordinator` + `IncidentCoordinator` merged into one `RecordCoordinator`; `TrackingRecord` reduced to seed-only demo GPS data | Real-time vehicle telemetry was **descoped from the implementation** — the system has no live vehicle feed to observe, so a push-based Observer had no producer. Client freshness is met instead by REST polling (30 s on the manager notifications feed). **[Commit]** `b663e2a`. **[Log]** notes the original rationale was not written down at the time | Simplicity; Low Coupling; avoid speculative generality | Comprehensibility, Maintainability |
| 11 | Coordinators justified as **Singletons**, instantiated by `SmartFMSystem` | Coordinators registered as **DI-scoped** services; the container performs composition, `SmartFMSystem.Start()` only sequences the six `Initialize*Subsystem()` calls | A per-request scope is required once the system serves concurrent HTTP requests over a shared `DbContext`; a process-wide singleton holding a scoped `DbContext` would be incorrect. A2's Singleton justification (*"prevents duplicate workflow managers competing over the same domain state"*) is satisfied by the container instead | Dependency Injection; Dependency Inversion | Reliability, Concurrency-safety |
| 12 | Payment realised as Strategy with three concrete subclasses | Hierarchy retained (`CashPayment`, `CardPayment`, `DigitalPayment` as TPH discriminators); gateway calls go through `IPaymentGateway`, implemented by `PaymentGatewayStub` which returns success and prints `"Payment processed"` | **[Brief]** *"the implementation does not need to support payment options as we cannot have a banking system to validate transactions… some simple message will be sufficient"* | Strategy; Protected Variations | Compliance with scope |

---

## 3. Non-changes — design decisions that survived implementation

The brief requires that **non-changes** be justified as explicitly as changes. The following A2 decisions were carried into the implementation unaltered, because implementation experience confirmed rather than challenged them.

| A2 decision | Status | Why it survived |
|---|---|---|
| `Employee` abstract → `Driver` / `Staff` / `Manager` | Unchanged | Maps directly onto a TPH discriminator (`EmployeeType`); the three roles genuinely differ in state (`LicenseNumber`/`IsAvailable`, `Department`, none) rather than only in behaviour |
| `Vehicle` abstract → `Light` / `Medium` / `Heavy` | Unchanged | Capacity is fixed per subclass in the constructor (1 000 / 5 000 / 20 000 kg), so the subclass *is* the capacity rule — no conditional logic needed anywhere |
| `Payment` abstract → `Cash` / `Card` / `Digital` | Unchanged | Retained even though the brief descoped real payment processing, so the design still demonstrates the Strategy structure |
| `Record` abstract → `Audit` / `Incident` / `Tracking` | Unchanged (minus `MaintenanceRecord`) | A single `Records` table with a `RecordType` discriminator gives `ReportingCoordinator` a uniform log to read without knowing concrete types — A2's Template Method argument held up |
| Coordinator decomposition by business area | Unchanged in code | Six of the seven survive one-to-one; only Tracking and Incident merged. The decomposition proved to be the right seam for the API layer, which still has a controller per area |
| `SmartFMSystem` bootstrap ordering | Unchanged | `Start()` calls the subsystems in exactly the A2 order: MasterData → Order → Fleet → Record → Billing → Reporting |
| A2 bootstrap operation names | Unchanged in wording | `InitializeOrderSubsystem()`, `AttachShipment(shipment)`, `new Order(customer)`, `new Shipment(order)` all appear verbatim in the code. A2 wrote `initializeOrderSubsystem()`; C# convention requires PascalCase, so only the casing was adjusted — the word sequence is preserved |
| Value objects as immutable data holders | Unchanged | `Receipt`, `LoadManifest`, `Notification`, `DeliveryConfirmation`, `Report` are all C# `record` types, giving A2's "data holder" intent direct language support |

---

## 4. Items the team should revisit

These are genuine inconsistencies found while reverse-engineering the delivered system. They are recorded here rather than silently resolved, because each needs a team decision before submission.

| # | Observation | Suggested action |
|---|---|---|
| R1 | A2 Scenario 3 required an Hours-of-Service check, and the tutor asked for `checkHOS()` to be *"invoked first, whose value is used as condition for the box"*. The delivered `FleetAssignmentCoordinator` enforces double-booking rejection and warehouse capacity, but has **no HOS check** | Either implement the check or state plainly in the report that HOS was descoped, and why |
| R2 | The root `README.md` still documents a `TelemetrySimulator` with a 10-second tick and a `Telemetry:Enabled` flag. The class was deleted in commit `b663e2a` | Delete the stale README paragraphs before submission |
| R3 | `CLAUDE.md`'s Bootstrap Order still lists `MaintenanceRecord` in step 3, although the class no longer exists | Update the log |
| R4 | `BillingCoordinator.ProcessPaymentAsync` selects a payment by `method switch` (defensible as a Creator/Factory), but then re-inspects the created object with a type-test `payment switch { CardPayment card => …, DigitalPayment digital => … }` to read `GatewayResponse`. A2's Table [5] claimed checkout runs *"without inspection of the payment type (H8)"* | Consider lifting `GatewayResponse` onto the `Payment` base class so the second switch disappears, or note the deviation |
| R5 | The team's working diagram (`domainentities.drawio.xml`) marks `Vehicle` and `Payment` as `<<abstract>>` but omits their concrete subclasses, and still shows `TrackingRecord`/`Notification` although tracking is descoped | Reconcile the diagram with the final class diagram in `report.md` §3.1 |
| R6 | Status values are `public static class … const string` rather than C# `enum`s, so there is no compile-time safety on status transitions | Defensible for EF string persistence — worth one sentence of justification rather than a change |
| R7 | The frontend mixes 42 `.jsx`, 10 `.tsx`, 41 `.js` and 4 `.ts` files, and both `AppHeader.jsx` and `Header.jsx` exist | Low priority; note as known technical debt |

---

## 5. Traceability to the Assignment 2 mark sheet

| A2 criterion | Mark | Addressed in A3 by |
|---|---|---|
| Overview of Candidate Classes | 14 / 20 | Revisions 1, 2, 4 — technical classes removed from the domain model, out-of-scope maintenance dropped, compositions corrected |
| CRC Cards | 15 / 20 | `report.md` §3.2 *Responsibility level* re-derives responsibilities and collaborators from the delivered code, so the diagram/CRC mismatch the tutor found cannot recur |
| Quality of Design Solution | 12 / 15 | Revisions 1, 4, 9 — H14 containment errors corrected; patterns now discussed against real implementations |
| Basic Verification | 15.5 / 20 | Revisions 3, 5, 8 — Scenario 1 corrected at the code level; `docs/testing.md` re-verifies every scenario against the running system |
| Coherent Document | 4.5 / 5 | `report.md` now includes a Conclusion, and every listed reference is cited in-text |
