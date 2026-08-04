# Summary of Design Revision

**SWE30003 Assignment 3 — Group 19** · Companion to `report.md` §2

Evidence tags: **[Tutor]** Assignment 2 mark sheet comments (78/100) · **[Log]** `CLAUDE.md` design-decision log · **[Commit]** git commit · **[Brief]** Assignment 3 specification. No reason below is inferred.

---

## Table 1 — Major design revisions

| # | Assignment 2 | Assignment 3 (delivered) | Reason | Principle | Quality |
|---|---|---|---|---|---|
| 1 | `SmartFMSystem` + seven coordinators in the domain diagram | Removed from the domain model; retained as the **Application layer** | **[Tutor]** *"Unsuitable technical classes (not a concern at this stage): SmartFMSystem, coordinator classes"*; *"several unneeded associations… e.g. (FleetAssignmentCoordinator; \*)"* | Separation of concerns; Layered | Modifiability |
| 2 | `MaintenanceRecord`; `Vehicle` owns maintenance history | Removed entirely | **[Tutor]** *"Vehicle maintenance: not listed as part of the scope, yet still modelled"* | Scope discipline | Comprehensibility |
| 3 | `Cargo` created and owned by `Shipment` | `Cargo.OrderId`; `Order.Cargoes`; `LineItem` deleted; `OrderWeightKg` derived from cargo | **[Tutor]** Scenario 1: *"Cargo should be created from Order (not Shipment)"*. **[Log]** cargo belongs to the order the customer placed, not a shipment leg staff create later; otherwise staff must split declarations across legs | Information Expert; Creator | Data integrity |
| 4 | Composition on `(Branch;*)`, `(Order;Invoice)`, `(Invoice;Payment)`, `(Shipment;*)`, `(Vehicle;*)`, `(Assignment;*)` | Plain associations; only `Order→Cargo` and `Order→Shipment` are ownership | **[Tutor]** *"several incorrect compositions"*; H14 marked down | Riel H14 | Model correctness |
| 5 | Assumption A6 — one order → one route; `Order`–`Shipment` and `Assignment`–`Shipment` 1:1 | `Order.Shipments` is a list; one `Assignment` binds many shipments | **[Commit]** `319c6ab` — a dispatch consolidating several orders was unrepresentable under 1:1 | Correct multiplicity | Scalability |
| 6 | Persistence out of scope; `PersistenceManager` discarded | `IRepository<T>`, `IUnitOfWork`, `SmartFMDbContext` (19 `DbSet`s), 19 EF configurations, migration, `SeedData` | **[Log]** *"A2 excluded persistence by scope"*. **[Brief]** the system must run and store data | Repository; DIP | Reliability, Testability |
| 7 | View/UI out of scope | Next.js client, five role portals over REST | **[Log]** *"Presentation out of A2 scope; zero business logic client-side"*. **[Brief]** a simple UI with validation is required | MVC across HTTP | Usability |
| 8 | Customer selects `Warehouse` at order placement | `POST /api/orders` takes addresses only; `Shipment.WarehouseId` nullable, set by staff; capacity check moved to assignment creation | **[Log]** the customer *"has no basis to make that decision"*, it *"leaks internal operational structure through the public API (violates information hiding)"*, and it puts the decision with the wrong actor | Information Hiding | Security, Usability |
| 9 | `Route` warehouse-linked, server-computed duration | Passive data holder: address strings, optional client-supplied distance/duration/waypoints; `RouteId` nullable | **[Log]** geospatial computation *"is a presentation-layer concern… the backend's job is to store itinerary facts, not derive them"*; keeps the demo offline-runnable | Separation of concerns | Testability |
| 10 | `ITrackable`, `Observer`, `TrackingCoordinator`, `IncidentCoordinator`, `TelemetrySimulator` | All removed; the two coordinators merged into `RecordCoordinator`; `TrackingRecord` is seed-only demo data | Telemetry was **descoped** — no live vehicle feed exists, so a push-based Observer had no producer. Freshness met by REST polling (30 s). **[Commit]** `b663e2a`; **[Log]** notes the original rationale was not recorded | Avoid speculative generality | Maintainability |
| 11 | Coordinators as **Singletons** created by `SmartFMSystem` | **DI-scoped**; the container composes, `Start()` only sequences the initialisers | A per-request scope is required once concurrent HTTP requests share a `DbContext`; a singleton holding a scoped context would be incorrect. A2's rationale (*"prevents duplicate workflow managers competing over the same domain state"*) is met by the container | Dependency Injection | Reliability |
| 12 | Payment Strategy with three subclasses | Hierarchy retained via TPH; gateway calls behind `IPaymentGateway`, implemented by `PaymentGatewayStub` printing `"Payment processed"` | **[Brief]** *"the implementation does not need to support payment options… some simple message will be sufficient"* | Strategy; Protected Variations | Scope compliance |

---

## Non-changes — decisions that survived implementation

The brief requires non-changes be justified as explicitly as changes.

| A2 decision | Why it survived |
|---|---|
| `Employee` → `Driver`/`Staff`/`Manager` | Maps onto a TPH discriminator; the roles differ in real state (`LicenseNumber`/`IsAvailable`, `Department`, none), not only behaviour |
| `Vehicle` → `Light`/`Medium`/`Heavy` | Capacity is fixed per subclass (1 000 / 5 000 / 20 000 kg), so the subclass *is* the rule — no conditional on vehicle class exists anywhere |
| `Payment` → `Cash`/`Card`/`Digital` | Retained despite payment being descoped, so the design still demonstrates the Strategy structure |
| `Record` → `Audit`/`Incident`/`Tracking` (minus `Maintenance`) | One `Records` table with a discriminator lets `ReportingCoordinator` read a uniform log without knowing concrete types — A2's Template Method argument held |
| Coordinator decomposition by business area | Six of seven survive one-to-one; it also proved the right seam for the API's controller-per-area split |
| Bootstrap ordering | `Start()` calls MasterData → Order → Fleet → Record → Billing → Reporting, exactly as specified |
| A2 bootstrap operation names | `InitializeOrderSubsystem()`, `AttachShipment()`, `new Order(customer)`, `new Shipment(order)` appear verbatim; only casing changed for C# convention |
| Value objects as immutable data holders | All five are C# `record` types, giving A2's intent direct language support |

---

## Items the team should revisit

Found while reverse-engineering; each needs a decision before submission.

| # | Observation | Action |
|---|---|---|
| R1 | A2 Scenario 3 required an Hours-of-Service check and the marker asked for `checkHOS()` to be *"invoked first, whose value is used as condition for the box"*. The code enforces double-booking and capacity, but **no HOS check** | Implement it, or state the descoping in the report |
| R2 | `README.md` still documents `TelemetrySimulator` and `Telemetry:Enabled`; the class was deleted in `b663e2a` | Delete the stale paragraphs |
| R3 | `CLAUDE.md` bootstrap step 3 still lists `MaintenanceRecord` | Update the log |
| R4 | `BillingCoordinator` selects a payment by `method switch` (defensible as Creator), then re-inspects it with a type-test `switch` to read `GatewayResponse`. A2 claimed checkout runs *"without inspection of the payment type (H8)"* | Lift `GatewayResponse` onto the `Payment` base, or note the deviation |
| R5 | `domainentities.drawio.xml` marks `Vehicle`/`Payment` abstract without subclasses, and still shows tracking | Reconcile with `report.md` §3.1 |
| R6 | Statuses are `const string` classes, not enums — no compile-time safety | Defensible for EF persistence; justify in one sentence |
| R7 | Frontend mixes 42 `.jsx` / 10 `.tsx` / 41 `.js` / 4 `.ts`; both `AppHeader.jsx` and `Header.jsx` exist | Low priority; note as known debt |

---

## Traceability to the Assignment 2 mark sheet

| Criterion | Mark | Addressed by |
|---|---|---|
| Overview of Candidate Classes | 14 / 20 | Revisions 1, 2, 4 |
| CRC Cards | 15 / 20 | `report.md` §3.2.2 re-derives responsibilities from code, so diagram/CRC drift cannot recur |
| Quality of Design Solution | 12 / 15 | Revisions 1, 4, 9 — H14 corrected; patterns discussed against real implementations |
| Basic Verification | 15.5 / 20 | Revisions 3, 5, 8; `testing.md` re-verifies every scenario |
| Coherent Document | 4.5 / 5 | A Conclusion is now included and every listed reference is cited in-text |
