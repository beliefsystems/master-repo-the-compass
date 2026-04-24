# THE COMPASS — Single-Tenant Edition
Single Source of Truth (SSoT)
Version: 1.0
Status: Authoritative
Effective Date: April 20, 2026
Audience: Board | Legal | Product | Engineering | QA | Operations

---

# Index

## Foundations
### [Part 0 — Authority & Interpretation](#part-0)
### [Part 1 — Core Principles & Invariants](#part-1)
### [Part 2 — Domain Model (Entities & Relationships)](#part-2)
### [Part 3 — Roles & Permissions](#part-3)

---

## Execution Model
### [Part 4 — Time, Cadence & Calculations](#part-4)
### [Part 5 — Navigation & Views](#part-5)
### [Part 6 — Objectives](#part-6)
### [Part 7 — KPIs](#part-7)
### [Part 8 — Weightage](#part-8)
### [Part 9 — KPI Cycles & Submission](#part-9)
### [Part 10 — Approvals](#part-10)
### [Part 11 — Objective Mapping](#part-11)
### [Part 12 — Duplication & Bulk Operations](#part-12)

---

## Reviews & Performance Closure
### [Part 13 — PMS Review Eligibility](#part-13)
### [Part 14 — PMS Review Workflow](#part-14)
### [Part 15 — Post-Review Immutability](#part-15)

---

## People & Operational Controls
### [Part 16 — People Management Lifecycle](#part-16)
### [Part 17 — Month Force Close](#part-17)

---

## User Experience & Reporting
### [Part 18 — Status Indicators & Ratings](#part-18)
### [Part 19 — Search, Ordering, Pagination & Exports](#part-19)
### [Part 20 — Notifications](#part-20)
### [Part 21 — KPI Library](#part-21)
### [Part 22 — Executive Summary & Hall of Fame](#part-22)

---

## Platform & Engineering
### [Part 23 — Architecture Guardrails](#part-23)
### [Part 24 — Database Schema](#part-24)
### [Part 25 — Error Handling & UX Contracts](#part-25)
### [Part 26 — Security & Compliance](#part-26)
### [Part 27 — Performance & Indexing](#part-27)
### [Part 28 — Testing & Verification](#part-28)
### [Part 29 — Custom RBAC (Phase 2 — Reserved)](#part-29)

---

## Governance
### [Part 30 — SSoT Governance & Change Control](#part-30)
### [Part 31 — Glossary](#part-31)
### [Part 32 — Appendices](#part-32)
### [Part 33 — Version History](#part-33)
### [Part 34 — Final Authority Statement](#part-34)

---

<div style="page-break-before: always;"></div>

# Part 0
# 0. Document Authority and Interpretive Framework

## 0.1 Nature and Purpose of This Document
This document constitutes the sole, complete, and authoritative specification of THE COMPASS Performance Management System — Single-Tenant Edition. It functions as both a product constitution and an engineering specification. Every behavior, workflow, calculation, permission, and constraint in the system is derived exclusively from this document. This version supersedes all prior SSoT versions and all prior discussion documents, including the Grok planning conversation dated April 2026.

## 0.2 Single Source of Truth Principle
Single Source of Truth means one document, one owner per concept, zero duplication, and internal cross-references that are allowed and encouraged. Duplication is a defect. Identical restatement is a defect. Appendices are non-authoritative. If two sections overlap, one must be demoted or removed.

## 0.3 Precedence and Conflict Resolution
If two sections appear to conflict, precedence is applied in this order.
1. Core Principles and Invariants (Part 1)
2. Entity and Authority Models (Parts 2–3)
3. Lifecycle and Workflow Rules (Parts 4–17)
4. UI and UX Behavioral Contracts (Parts 18–22)
5. Engineering and Platform Rules (Parts 23–28)
6. Appendices (Part 32) — non-authoritative

## 0.4 Single-Tenant Declaration
This edition of THE COMPASS is built for a single organization. There is no Super Admin role, no cross-tenant data, and no multi-tenant isolation logic in the application layer. Every table includes an `organisation_id` column with a single constant value. This column exists exclusively for forward-compatibility with a future multi-tenant migration and carries no operational significance in V1.

## 0.5 Archival of Prior Specifications
The following documents are archived and non-authoritative as of the effective date of this document.
1. SSoT V1.1 (original multi-tenant version)
2. SSoT V1.2 (original multi-tenant version)
3. All Grok planning conversation artifacts
4. All Excalidraw UI sketches (design reference only, never authoritative)

## 0.6 Layered Readability and Audience
Parts 0 through 4 are readable by Board, Legal, and non-technical stakeholders. Parts 5 through 12 are written for Product, QA, and Operations. Parts 13 and higher are written for Engineering, Security, and Compliance.

## 0.7 Determinism Requirement
If two engineers implement THE COMPASS independently using only this document with identical inputs and identical initial state, their implementations must produce identical outputs and identical final state. Every rule must specify preconditions, allowed actions, forbidden actions, state transitions, edge cases, failure modes, and consequences.

## 0.8 Negative Space Documentation
For every allowed action, this document explicitly defines what happens when an unauthorized role attempts the action, what happens when the action is attempted in the wrong state, and whether the system blocks, rejects, or returns an error.

## 0.9 Prohibition on Inference
No behavior may be inferred or assumed. If a behavior is not written, it does not exist and must not be implemented.

## 0.10 Forbidden Compression Patterns
The following compression patterns are prohibited: "similar to", "as described above", "follows the same logic", "handled in the same way". Every rule is fully stated in its owning section.

## 0.11 Deferred Features
The following features are explicitly deferred to future phases and must not be implemented in V1.
1. Acting Manager Delegation — no schema, no service logic, no UI.
2. Full Audit Logging — no audit_logs table, no audit service, no UI page.
3. Custom RBAC (Full Permission Matrix) — deferred to the final development phase. See Part 29.
4. Email Notifications — no email delivery in V1. In-app notifications only.
5. Dark Mode — light Claymorphism theme only.
6. Real-time updates (WebSockets or SSE) — out of scope for V1.

---

<div style="page-break-before: always;"></div>

# Part 1
# 1. Core Principles and Non-Negotiable Invariants

## 1.1 Invariant One — Monthly Write, Derived Read
Statement. Month is the only writable cadence unit. Quarter, Half-Year, and Annual are derived and read-only.
Rationale. This preserves a single source of truth and prevents derived values from diverging from monthly execution data.
Scope. Applies to all roles, all data entry paths, all API endpoints, and all imports.
Exceptions. None.

Enforcement.
1. Derived cadence views do not present edit controls.
2. API endpoints for derived cadence data reject write attempts with HTTP 403 and error code DERIVED_CADENCE_IMMUTABLE.
3. Database constraints prevent direct writes to derived cadence materialized data if such storage exists.

Negative Space Behavior.
1. If a user attempts to edit a quarterly value in the UI, the UI disables the control by design and no request is sent.
2. If a user attempts a direct API write to a derived cadence record, the API returns HTTP 403 and no data is changed.

## 1.2 Invariant Two — Deterministic State Machines
Statement. All lifecycle changes are governed by explicit finite state machines. No implicit transitions exist.
Rationale. Deterministic state machines eliminate ambiguity and ensure predictable implementation.
Scope. Applies to Objectives, KPIs, KPI Cycles, and PMS Reviews.
Exceptions. None.

Enforcement.
1. Every state transition is validated against an explicit transition table in the service layer.
2. Invalid transitions are rejected before any data mutation.
3. Invalid transition attempts return HTTP 409.

Negative Space Behavior.
1. If a transition is not listed as valid, it is rejected with HTTP 409 and error code INVALID_STATE_TRANSITION.
2. The entity state remains unchanged.

## 1.3 Invariant Three — PMS Review is Terminal
Statement. Once a PMS Review is closed, it is immutable forever. No role may reopen, edit, or delete a closed PMS Review.
Rationale. PMS Reviews are legal and HR artifacts and must remain tamper-proof.
Scope. Applies to the PMS Review entity and all related snapshots.
Applicability. Applies to all roles including Admin.
Exceptions. None.

Enforcement.
1. API calls attempting to modify a closed review return HTTP 403 and error code IMMUTABILITY_VIOLATION.
2. Database-level constraints block updates to closed reviews where feasible.

## 1.4 Invariant Four — System-Derived Data is Read-Only
Statement. All calculated values are system-derived and may not be manually edited.
Rationale. Manual overrides would break determinism.
Scope. Applies to all percentages, scores, statuses, ratings, and derived aggregates.
Exceptions. None.

Enforcement.
1. Derived fields are not editable in the UI.
2. API ignores derived fields in payloads and recalculates from source data.

## 1.5 Invariant Five — Strict Organisation Isolation
Statement. All data is scoped to the single organisation. The organisation_id column is present on every table as a constant and is never accepted from request payloads, query params, or headers.
Rationale. Forward-compatibility with future multi-tenant migration.
Scope. All data and all queries.
Exceptions. None.

Enforcement.
1. Every table contains organisation_id.
2. Every query includes the organisation_id constant from server configuration, never from client input.

## 1.6 Invariant Six — No Inference, No Invention
Statement. If a behavior is not explicitly documented, it does not exist and must not be implemented.
Rationale. Prevents scope creep and inconsistent implementation.
Exceptions. None.

## 1.7 Invariant Seven — Weightage Always Sums to 100
Statement. Objective weightages per Employee per Month must sum to exactly 100. KPI weightages per Objective must sum to exactly 100.
Rationale. Calculation determinism requires a closed weight budget.
Scope. All save, import, and duplication operations that affect weightage.
Exceptions. None.

Enforcement.
1. Service layer rejects any save or import where weightages do not sum to 100.
2. UI displays a real-time delta and disables save until the sum equals 100.
3. API returns HTTP 400 with error code WEIGHTAGE_SUM_INVALID if the constraint is violated.

## 1.8 Invariant Eight — Excel Import is Atomic
Statement. An Excel import either succeeds completely or fails completely. Partial writes are forbidden.
Rationale. Partial data creates inconsistent weightage states and orphaned records.
Scope. All Excel import operations.
Exceptions. None.

Enforcement.
1. All rows are validated before any database write begins.
2. If any row fails validation, no rows are written and the full error list is returned.
3. The entire import runs inside a single database transaction that is rolled back on any failure.

---

<div style="page-break-before: always;"></div>

# Part 2
# 2. System Entities and Relationships

## 2.1 Entity Definitions

### Entity: Organisation
Definition. The Organisation is the single root entity of the system.
Operational Rules.
1. There is exactly one Organisation record per deployment.
2. Organisation stores the organisation name, fiscal year start configuration (APRIL or JANUARY), and status.
3. Fiscal year configuration is set at system initialization and is immutable after that.
4. Organisation status is ACTIVE or DEACTIVATED and is controlled by a database-level flag.

### Entity: User
Definition. A User is an authentication account with a role.
Operational Rules.
1. Each User has exactly one role from the enumerated roles.
2. A User may have an Employee profile, but not all Users are Employees.
3. Each User has a unique email and unique username within the organisation.
4. User status is ACTIVE or DEACTIVATED. Deactivated users cannot log in but their data is preserved.
5. BoD users are assigned the ADMIN role with an `executive_label` flag set to TRUE. They display as "Board of Directors" in the org-chart and have read-only access to the Executive Summary only.

### Entity: Employee
Definition. An Employee is the performance subject associated with a User.
Operational Rules.
1. Each Employee is linked to exactly one User.
2. Each Employee has exactly one reporting manager, except for the top of the hierarchy which may have no manager.
3. Employee attributes include: full name, employee code, department, division, business unit, location, designation, date of joining, date of birth, gender.
4. Employee attributes for department, division, business unit, and location are drawn from Admin-configured attribute lists.
5. Business Unit is dependent on Division. Department is independent.

### Entity: Objective
Definition. An Objective is a strategic goal assigned to an Employee for a specific month within a fiscal year.
Operational Rules.
1. Each Objective belongs to exactly one Employee, one Month, one Fiscal Year.
2. Each Objective has a type: RC, CO, OE, or OTHERS.
3. OTHERS is a first-class type that participates in weight calculations.
4. Each Objective has a weightage that participates in the monthly 100% constraint.

### Entity: KPI
Definition. A KPI is a measurable indicator under an Objective.
Operational Rules.
1. Each KPI belongs to exactly one Objective.
2. Each KPI has a metric type: INCREASE, DECREASE, CONTROL, or CUMULATIVE.
3. Each KPI has a target type: FIXED or CUSTOM.
4. Each KPI has a standard value and target value as defined by metric and target types.
5. Each KPI has an aggregation method: SUM or AVERAGE. CUMULATIVE metric type always uses SUM aggregation and this is enforced by the system.
6. Each KPI has a weightage that participates in the objective-level 100% constraint.

### Entity: KPI Cycle
Definition. A KPI Cycle is a time-bound execution instance of a KPI within a month, defined by the Admin/Manager-set timeline.
Operational Rules.
1. Each KPI Cycle belongs to exactly one KPI.
2. Each KPI Cycle has a cycle date range within a single month.
3. Cycles are generated automatically by the system based on the frequency (WEEKLY or MONTHLY) chosen when the Admin or Manager sets the KPI timeline date range.
4. For WEEKLY frequency: Cycle 1 starts at timeline_start_date and ends at timeline_start_date + 6 days. Each subsequent cycle starts the day after the previous ends and lasts 7 days. If remaining days at the end of the timeline are fewer than 7, the final cycle spans the remaining days.
5. For MONTHLY frequency: One cycle spanning the full timeline is generated.
6. Each KPI Cycle stores: actual_value entered by Employee, comments entered by Employee, and for CUSTOM target KPIs, a target value per cycle.
7. Each KPI Cycle tracks submission_count which increments on each employee submission or resubmission and never decrements.
8. Each KPI Cycle has a state: DRAFT, SUBMITTED, APPROVED, REJECTED, CANCELLED_BY_SYSTEM, or LOCKED.

### Entity: KPI Submission
Definition. A KPI Submission records each workflow state transition for a KPI Cycle.
Operational Rules.
1. Each KPI Cycle can have multiple KPI Submission records forming a history trail.
2. The latest KPI Submission record (by created_at) determines the canonical cycle state.
3. The KPI Cycle state field is denormalized and must match the latest submission state for query performance.
4. Submission records store: submitted_by, approved_by, rejected_by, timestamps, approval comment, rejection comment.
5. Employee-entered comments are stored on the KPI Cycle record, not on submissions.

### Entity: Objective Mapping
Definition. An Objective Mapping links a child Objective to a parent Objective for score propagation.
Operational Rules.
1. Each mapping links exactly one child Objective to exactly one parent Objective.
2. Each child Objective may be mapped to at most one parent Objective.
3. Each parent Objective may have multiple child Objectives.
4. Each mapping includes a weight of the child within the parent's weight budget.

### Entity: PMS Review
Definition. A PMS Review is a terminal performance artifact containing snapshot performance data and manager and admin reviews.
Operational Rules.
1. Each PMS Review belongs to exactly one Employee, one period type (QUARTERLY, HALF_YEARLY, or ANNUAL), and one fiscal period.
2. PMS Reviews are immutable once closed.
3. One PMS Review may exist per Employee per period type per fiscal period.

### Entity: In-App Notification
Definition. An In-App Notification is a persisted message delivered to a user within the product UI.
Operational Rules.
1. Each notification belongs to exactly one recipient User.
2. Notification records include status: UNREAD or READ.
3. Notification creation is part of the business transaction that triggers it.

### Entity: KPI Library Template
Definition. A KPI Library Template is a reusable KPI definition that can be applied to an Employee's objectives.
Operational Rules.
1. Templates are created by Admin.
2. Templates store all KPI definition properties except weightage (which is set at apply-time).
3. Templates do not have execution data (no cycles, no actuals).
4. Templates can be applied individually or in bulk to one or more Employees' months.

### Entity: Tenant Attribute Value
Definition. A Tenant Attribute Value is an Admin-configured list value for Department, Division, Business Unit, Location, or Designation.
Operational Rules.
1. Attribute lists are created, updated, and deleted by Admin.
2. Department and Division are independent.
3. Business Unit is dependent on Division.

## 2.2 Entity Relationships
1. An Employee reports to at most one Manager. A Manager is also an Employee.
2. An Employee has many Objectives. Each Objective belongs to exactly one Employee.
3. An Objective has many KPIs. Each KPI belongs to exactly one Objective.
4. A KPI has many KPI Cycles. Each KPI Cycle belongs to exactly one KPI.
5. A KPI Cycle has many KPI Submissions. Each Submission belongs to exactly one KPI Cycle.
6. A Parent Objective has many mapped child Objectives. Each child Objective maps to at most one parent Objective.
7. An Employee can have many PMS Reviews across different periods.
8. Each In-App Notification belongs to exactly one recipient User.

## 2.3 Entity Lifecycle Governance
1. All entities except KPI Cycles use soft delete.
2. KPI Cycles may be hard-deleted by Admin only, with mandatory confirmation.
3. Once a PMS Review is closed, all entities within its scope become immutable as specified in Part 15.
4. Derived data is never stored as authoritative values. If cached, it must be invalidated deterministically.

---

<div style="page-break-before: always;"></div>

# Part 3
# 3. Role-Based Authority Model

## 3.1 Role Enumeration
The system recognizes exactly four roles.
1. Admin (includes BoD users with `executive_label = TRUE`)
2. Manager
3. Employee
4. Custom RBAC roles (deferred to Phase 2 — see Part 29)

## 3.2 Admin Authority
Scope. Full access within the organisation. BoD Admins (executive_label = TRUE) have read-only access to the Executive Summary only. All other Admin rules in this section apply to non-BoD Admins unless explicitly noted.

Allowed Actions — User and People Management.
1. Create Users and Employees.
2. Update User profiles and Employee attributes.
3. Change User roles.
4. Deactivate and reactivate Users and Employees.
5. Change reporting manager relationships, effective the next month.

Allowed Actions — Objectives and KPIs.
1. Create Objectives for any Employee.
2. Update Objective properties before execution begins.
3. Set Objective weightage and enforce the monthly 100% constraint.
4. Create KPIs under Objectives.
5. Update KPI properties before the first submission.
6. Set KPI weightage and enforce the objective 100% constraint.
7. Delete Objectives and KPIs only when no execution data exists.
8. Delete KPI Cycles with mandatory confirmation.
9. Define KPI Timeline date ranges for any Employee (Admin sets range; system generates cycles).

Allowed Actions — Approvals.
1. Approve or reject any KPI within the organisation.
2. Override a Manager approval or rejection with a mandatory reason.
3. Approve own KPI cycles when acting as Manager or Employee, with self-approval flagged.

Allowed Actions — Mapping, Duplication, and Bulk Operations.
1. Create and delete Objective mappings.
2. Set mapped child weight within a parent Objective.
3. Duplicate Objectives and KPIs across Employees, Months, and Fiscal Years as specified in Part 12.
4. Execute all bulk operations as specified in Part 12.

Allowed Actions — PMS Review.
1. Initiate PMS Reviews for eligible Employees (including bulk initiation).
2. Submit Admin Review after Manager submission.
3. Close PMS Review.

Allowed Actions — Configuration.
1. Configure attribute lists (Department, Division, Business Unit, Location, Designation).
2. Configure fiscal year start (APRIL or JANUARY) — at system setup only, immutable thereafter.
3. Configure KPI status bands.
4. Configure PMS rating scale bands.
5. Configure PMS Review cadence (which cadence periods apply globally or per Employee).

Allowed Actions — KPI Library.
1. Create, update, and delete KPI Library templates.
2. Apply templates individually or in bulk to an Employee's month.

Forbidden Actions.
1. Modify closed PMS Reviews.
2. Change fiscal year configuration after initialization.
3. BoD Admins may not perform any write operations. Their access is strictly read-only on the Executive Summary.

Failure Behavior.
1. Unauthorized actions return HTTP 403 with error code PERMISSION_DENIED.
2. Invalid state changes return HTTP 409 with error code INVALID_STATE_TRANSITION.

## 3.3 Manager Authority
Scope. Direct reports plus own data in My View.

Allowed Actions — Team Data Access.
1. View Objectives, KPIs, and KPI Cycles for direct reports.

Allowed Actions — KPI Timeline.
1. Define KPI Timeline date ranges for direct reports (Manager sets range; system generates cycles).

Allowed Actions — Approvals.
1. Approve or reject KPI cycles for direct reports using the batch approval model.
2. Provide mandatory comments for every approval or rejection.
3. View Pending Approvals for direct reports, grouped by employee and KPI.

Allowed Actions — PMS Review.
1. Submit Manager Review for direct reports when a PMS Review is initiated.

Allowed Actions — Self Data.
1. View own Objectives, KPIs, and cycles in My View.
2. Enter actual values and submit own KPI cycles as an Employee.

Forbidden Actions.
1. Create or delete Objectives or KPIs for team members.
2. Edit Objective or KPI definitions for team members.
3. Change weightage values.
4. Force close months.
5. Initiate PMS Reviews.
6. Duplicate or bulk-operate on objectives.
7. Configure attribute lists or rating bands.
8. Access or apply KPI Library templates.
9. Execute bulk imports or exports.

Failure Behavior.
1. Unauthorized actions return HTTP 403 with error code PERMISSION_DENIED.
2. Approval attempts for non-direct-reports return HTTP 403 with error code UNAUTHORIZED_APPROVAL_ATTEMPT.

## 3.4 Employee Authority
Scope. Self only.

Allowed Actions.
1. View own Objectives, KPIs, and KPI Cycles.
2. Enter actual values and optional comments for own KPI cycles.
3. Submit and resubmit KPI cycles subject to the three-submission rule.
4. View own PMS Reviews including in-progress reviews (read-only).

Forbidden Actions.
1. Create, edit, or delete Objectives or KPIs.
2. Change weightages or KPI definitions.
3. Define or adjust KPI timelines.
4. Approve any KPI cycles.
5. View other employees' data.
6. Force close months.
7. Initiate or submit PMS Reviews.
8. Access the KPI Library.
9. Execute bulk operations or imports.
10. Access People Management screens.

Failure Behavior.
1. Unauthorized actions return HTTP 403 with error code PERMISSION_DENIED.
2. Attempting a fourth submission returns HTTP 409 with error code MAX_SUBMISSIONS_EXCEEDED.

## 3.5 Authority Conflicts and View Context
1. View context switching (Master View, Team View, My View) controls what data is displayed and does not change permissions.
2. All authorization is role-based and enforced server-side independently of UI view context.
3. An Admin viewing Team View retains Admin permissions.
4. A Manager who is also an Employee acts as Employee for self-data and as Manager for direct-report data.
5. Admin approvals of their own KPI cycles are allowed and are flagged with `self_approval = TRUE`.

## 3.6 Permission Enforcement
1. All permissions are enforced server-side before any state change.
2. Role checks never occur only in the UI.
3. If permission cannot be verified, the system fails closed and blocks the action.
4. Permission denial returns HTTP 403 with error code PERMISSION_DENIED.

---

<div style="page-break-before: always;"></div>

# Part 4
# 4. Time and Cadence Model

## 4.1 Writable vs Derived Units
Statement. Month is the only writable unit. Quarter, Half-Year, and Annual are derived and read-only.
Operational Rules.
1. All user input for Objectives, KPIs, cycles, and comments is tied to a specific Month within a Fiscal Year.
2. Derived cadences display aggregated results only and accept no edits.
3. Derived cadences are calculated from monthly data only.

## 4.2 Fiscal Year Configuration
Operational Rules.
1. Fiscal year start is configured once at system initialization.
2. Allowed fiscal year patterns are APRIL start and JANUARY start only.
3. Fiscal year configuration is immutable after initialization.
4. Fiscal year labels use the configured pattern consistently across all modules.

APRIL Start Calendar.
1. Q1: Apr, May, Jun. Q2: Jul, Aug, Sep. Q3: Oct, Nov, Dec. Q4: Jan, Feb, Mar.
2. H1: Apr–Sep. H2: Oct–Mar.
3. Annual FY: Apr–Mar.

JANUARY Start Calendar.
1. Q1: Jan, Feb, Mar. Q2: Apr, May, Jun. Q3: Jul, Aug, Sep. Q4: Oct, Nov, Dec.
2. H1: Jan–Jun. H2: Jul–Dec.
3. Annual FY: Jan–Dec.

## 4.3 Monthly Structural Snapshots
Operational Rules.
1. At the start of each month, the system records the reporting manager, department, division, business unit, and role assignment for each Employee.
2. If a manager change occurs mid-month, the old manager remains the approver for that month.
3. The new manager becomes the approver starting the next month.

## 4.4 Derived Cadence Calculation Logic
This section is the single source of truth for all mathematical rules and formulas.

### 4.4.1 KPI Cycle Level Scoring

Definitions.
1. A = Actual value.
2. S = Standard (baseline) value.
3. T = Target value.

Metric Type: INCREASE.
1. Formula: c_percent = ((A − S) / (T − S)) × 100.
2. If T equals S, KPI creation is blocked with error code TARGET_EQUALS_STANDARD.
3. If A ≤ S, c_percent = 0.
4. If A ≥ T, c_percent is 100 or higher. Overshoot is allowed with no cap.

Metric Type: DECREASE.
1. Formula: c_percent = ((S − A) / (S − T)) × 100.
2. If S equals T, KPI creation is blocked with error code TARGET_EQUALS_STANDARD.
3. If A ≥ S, c_percent = 0.
4. If A ≤ T, c_percent is 100 or higher. Overshoot is allowed with no cap.

Metric Type: CONTROL.
1. Formula: if min(S, T) ≤ A ≤ max(S, T), then c_percent = 100. Otherwise c_percent = 0.
2. Standard must be less than or equal to Target. If S > T, KPI creation is blocked with error code CONTROL_STANDARD_EXCEEDS_TARGET.

Metric Type: CUMULATIVE.
1. CUMULATIVE KPIs are bound within a single month. No cross-month accumulation is permitted.
2. Each cycle stores an incremental actual value representing new progress within that cycle period.
3. CumulativeActual_month = sum of all cycle actual_values for the month (running total).
4. Standard (S) for CUMULATIVE must always be 0. The system enforces S = 0 at KPI creation and blocks any S ≠ 0 input.
5. Target (T) is the total cumulative monthly target. If T = 0, KPI creation is blocked with error code TARGET_EQUALS_STANDARD.
6. Monthly KPI percent formula: MonthlyKPIPercent = (CumulativeActual_month / T) × 100.
7. Overshoot is allowed. If CumulativeActual_month > T, MonthlyKPIPercent > 100 with no cap.
8. For cycle-level display only (not used in any aggregate calculation), a running-total progress indicator is shown: RunningPercent_i = (CumulativeActual_up_to_cycle_i / T) × 100.
9. CUMULATIVE metric type always uses SUM aggregation. The system enforces this and ignores any aggregation_method field for CUMULATIVE KPIs.
10. For CUMULATIVE KPIs, S = 0 at all times. The aggregation formula for MonthlyKPIPercent does not use S.
11. Approval gating: all cycles must have an actual value entered (including 0 as a valid entry meaning no incremental progress in that cycle).

### 4.4.2 KPI Monthly Aggregation

Fixed Targets (INCREASE, DECREASE, CONTROL metrics only).
1. If aggregation method is SUM, MonthlyActual = sum of all A_i.
2. If aggregation method is AVERAGE, MonthlyActual = sum(A_i) / N where N = number of cycles.
3. MonthlyKPIPercent = f(MonthlyActual, S, T) using the metric formula.
4. For FIXED target KPIs with SUM aggregation, S and T represent the expected monthly totals across all cycles.
5. For FIXED target KPIs with AVERAGE aggregation, S and T represent the expected per-cycle average.
6. Admin configures S and T consistent with the chosen aggregation method.

Custom Targets (INCREASE, DECREASE, CONTROL metrics only).
1. For each cycle i, compute c_percent_i using f(A_i, S_i, T_i).
2. MonthlyKPIPercent = sum(c_percent_i) / N.

CUMULATIVE Metric.
1. CUMULATIVE always uses SUM aggregation (enforced by system).
2. MonthlyKPIPercent = (sum of all A_i / T) × 100. S is always 0 and is not part of the formula.
3. CUMULATIVE KPIs do not support CUSTOM target type. Target type for CUMULATIVE is always FIXED. The system blocks CUSTOM selection for CUMULATIVE at KPI creation.

### 4.4.3 KPI Weighting Within Objective
Let an Objective have M KPIs with weights w_i where sum(w_i) = 100.
1. ObjectivePercentFromKPIs = sum(MonthlyKPIPercent_i × w_i) / 100.

### 4.4.4 Objective Mapping Score Propagation
1. A child Objective has one canonical MonthlyPercent computed from its own KPIs.
2. A child Objective may map to at most one parent Objective.
3. The child Objective percent is referenced by the parent calculation and is not copied.
4. Parent Objective direct KPI weights plus mapped child weights must sum to 100.
5. ObjectivePercent (parent) = sum of (MonthlyKPIPercent_i × direct_kpi_weight_i) / 100 + sum of (ChildObjectivePercent_j × child_weight_j) / 100.

### 4.4.5 Objective Status Derivation
1. LAUNCHED when count of KPIs under the Objective = 0.
2. ONGOING when count of KPIs ≥ 1 and not all KPI cycles are in APPROVED state.
3. COMPLETED when all KPI cycles under all KPIs are in APPROVED state.
4. DELETED when the Objective is soft-deleted.
Objective status is system-derived and cannot be manually set.

### 4.4.6 Monthly Employee Score
Let an Employee have K Objectives in a month with weights W_k where sum(W_k) = 100.
1. OEM = sum(ObjectivePercent_k × W_k) / 100.

### 4.4.7 Partial Month Handling and Force Close
Force Close Model.
1. Admin marks a month as force-closed for an Employee.
2. DRAFT cycles: actual_value is set to NULL, state remains DRAFT, force_closed is set to TRUE.
3. SUBMITTED cycles: actual_value is set to NULL, state transitions to CANCELLED_BY_SYSTEM, force_closed is set to TRUE.
4. REJECTED cycles: actual_value is set to NULL, state transitions to CANCELLED_BY_SYSTEM, force_closed is set to TRUE.
5. APPROVED cycles are not affected and retain their values.
6. LOCKED cycles are not affected and retain their values.
7. KPIs with NULL cycles are excluded from ObjectivePercent calculation.
8. Objectives with all NULL KPIs have ObjectivePercent = NULL.
9. OEM is calculated excluding NULL Objectives.
10. Force-closed months remain included in cadence calculations even if all Objectives are NULL.

Special Case — Complete Month Exclusion.
1. If all Objectives have NULL values and the month is NOT force-closed, the month is excluded from derived cadence calculations.
2. When a month is excluded, the valid month count N is decremented for cadence calculations.

### 4.4.8 Derived Cadence Scores
Quarterly.
1. OEQ = (OEM_m1 + OEM_m2 + OEM_m3) / N where N = count of valid months (OEM ≠ NULL).
2. A month is valid if OEM for that month is not NULL.
3. Force-closed months are always valid regardless of whether all Objectives are NULL.

Half-Yearly.
1. OEH = sum(OEM_mi for 6 months) / N.

Annual.
1. OEA = sum(OEM_mi for 12 months) / N.

### 4.4.9 Core Objective Type Breakdowns
For Quarterly, Half-Yearly, and Annual views, Objectives are displayed without KPIs.
1. TypeAvg_T = sum(ObjectivePercent_T over months in cadence) / N.
2. OTHERS Objectives are grouped separately in derived cadence views but remain first-class Objectives in monthly weight constraints.

### 4.4.10 KPI Status Bands
1. NOT_STARTED if no actual values are entered for any cycle in the month.
2. AT_RISK for percent 0 to 59.
3. OFF_TRACK for percent 60 to 79.
4. ON_TRACK for percent 80 to 99.
5. ACHIEVED for percent 100 or greater.
KPI Status is computed and not manually editable. Bands are Admin-configurable. Default values are as stated above.

### 4.4.11 PMS Rating Scale
Default PMS Rating Bands (inclusive lower bounds).
1. score ≥ 100.00 → Exceeds Expectations.
2. 90.00 ≤ score < 100.00 → Meets Expectations.
3. 70.00 ≤ score < 90.00 → Below Expectations.
4. score < 70.00 → Disappointing.
Bands are Admin-configurable. Custom bands must be contiguous and non-overlapping.

### 4.4.12 PMS Review Snapshot
At PMS Review initiation, the system creates an immutable snapshot of: objective percents, OEM, OEQ, OEH, OEA, and core objective type averages for the covered period.

### 4.4.13 Global Mathematical Invariants
1. KPI weights per Objective = 100.
2. Objective weights per Employee per Month = 100.
3. Derived cadences are read-only.
4. Objective Status is system-derived.
5. KPI Status is system-derived.
6. PMS Review scores are snapshot and immutable.
7. Target must never equal Standard for INCREASE and DECREASE metrics.
8. CUMULATIVE KPIs always have S = 0 and T > 0. Target type is always FIXED. Aggregation is always SUM.

### 4.4.14 KPI Timeline Deletion Impact on Calculations
1. Deletion of a KPI Cycle is blocked if it would leave fewer than one cycle in the month.
2. Deletion is allowed only if at least one other cycle exists in that month.
3. For FIXED target KPIs, cycle deletion removes that cycle from aggregation. N is decremented.
4. For CUSTOM target KPIs, the same blocking rules apply.
5. When deletion occurs, MonthlyKPIPercent is recalculated using remaining cycles.
6. If the last remaining cycle must be removed, Admin must delete the KPI instead.

## 4.5 UI Context Switching for Derived Cadences
1. Month view is the only writable view.
2. Quarter, Half-Year, and Annual views are read-only and display derived data only.
3. In derived cadence views, no edits, submissions, approvals, or draft saves are allowed.
4. Month pills remain visible in derived cadence views for context but carry no edit functionality.

---

<div style="page-break-before: always;"></div>

# Part 5
# 5. Navigation and View Hierarchy

## 5.0 View Context and Permission Independence
1. View context switching (Master View, Team View, My View) controls what data is displayed.
2. View context does not change or elevate permissions.
3. All authorization is role-based and enforced server-side independently of UI view context.

## 5.1 Left Sidebar Navigation (All Authenticated Users)
The left sidebar is always visible and contains the following items. Visibility of each item is controlled by role.

| Navigation Item | Admin | Manager | Employee | BoD Admin |
|---|---|---|---|---|
| Home (Dashboard) | ✓ | ✓ | ✓ | ✓ |
| People Management | ✓ | ✗ | ✗ | ✗ |
| Objectives & KPI | ✓ | ✓ | ✓ | ✗ |
| Pending Approvals | ✓ | ✓ | ✗ | ✗ |
| PMS Review | ✓ | ✓ | ✓ | ✗ |
| KPI Library | ✓ | ✗ | ✗ | ✗ |
| Executive Summary | ✓ | ✗ | ✗ | ✓ |

## 5.2 Admin Navigation and Views
1. Admin has access to Master View, Team View, and My View within Objectives & KPI.
2. Master View provides organisation-wide visibility.
3. Team View provides direct-report visibility if Admin is also a Manager.
4. My View provides self-visibility if Admin is also an Employee.
5. Admin has Pending Approvals view.
6. Admin has access to all navigation items except those marked ✗ in the table above.

## 5.3 Manager Navigation and Views
1. Manager has access to Team View and My View within Objectives & KPI.
2. Manager has a dedicated Pending Approvals view.
3. Manager cannot access Master View.

## 5.4 Employee Navigation and Views
1. Employee has access to My View only within Objectives & KPI.
2. Employee navigation includes: Home, Objectives & KPI, PMS Review.

## 5.5 BoD Admin Navigation
1. BoD Admins (executive_label = TRUE) see only Home and Executive Summary in the sidebar.
2. All other navigation items are hidden from BoD Admins.
3. BoD Admins have no write access anywhere in the system.

## 5.6 Pending Approvals View
1. Pending Approvals shows KPI approvals awaiting action for all direct reports (Manager) or all Employees (Admin).
2. Approvals are grouped by employee and by KPI.
3. Each KPI is approved as a single batch action per month.

---

<div style="page-break-before: always;"></div>

# Part 6
# 6. Objectives

## 6.1 Objective Types and Classification
1. Objective types are RC, CO, OE, and OTHERS.
2. Objective type is required for every Objective.
3. OTHERS is a first-class type that participates in weight calculations.
4. Custom objective titles are allowed for all types.
5. Objectives without KPIs are allowed but the UI highlights them as incomplete with a visual indicator.

## 6.2 Objective Lifecycle States
States.
1. LAUNCHED: Objective created. No KPI exists under it.
2. ONGOING: At least one KPI exists. Not all KPI cycles are approved.
3. COMPLETED: All KPI cycles under all KPIs are approved.
4. DELETED: Objective is soft-deleted and hidden from UI.

Valid Transitions.
1. LAUNCHED → ONGOING: triggered when the first KPI is created.
2. ONGOING → COMPLETED: triggered when all KPI cycles are approved.
3. LAUNCHED → DELETED: allowed only if the Objective has no KPI execution data.
4. ONGOING → DELETED: forbidden if any KPI has submitted or approved data.
5. COMPLETED → ONGOING: allowed only through Admin reopen with a required reason.
6. DELETED → LAUNCHED: valid only through Admin restore if no execution data exists.

Invalid Transitions.
1. LAUNCHED → COMPLETED is invalid.
2. COMPLETED → LAUNCHED is invalid.
3. DELETED → COMPLETED is invalid.

Failure Behavior.
1. Invalid transitions return HTTP 409 with error code INVALID_STATE_TRANSITION.

## 6.3 Objective Creation Workflow
1. Authorized Admin initiates Objective creation in Master View for a selected Employee, Month, and Fiscal Year.
2. System validates scope and authorization.
3. User provides Objective title, Objective type, and optional description.
4. System creates Objective in LAUNCHED state.

Negative Space.
1. Unauthorized role attempts return HTTP 403 with error code PERMISSION_DENIED.
2. Missing required fields return HTTP 400 with error code VALIDATION_FAILED. No Objective is created.

## 6.4 Objective Deletion Rules
1. Objectives are soft-deleted only.
2. An Objective may be deleted only if it has zero execution history (no submitted or approved KPI cycles).
3. If any KPI under the Objective has a submission or approval, deletion is blocked.
4. Soft-deleted Objectives are hidden from all views and excluded from calculations.
5. Admin may restore a soft-deleted Objective only if it has no execution data.

## 6.5 Objective Reopen Rules
1. Admin may reopen a COMPLETED Objective by providing a mandatory reason.
2. Reopening transitions the Objective from COMPLETED to ONGOING.
3. Reopening is blocked if the Objective is covered by a closed PMS Review.

6.N Negative Space for Objectives.
1. Unauthorized role attempts return HTTP 403 with error code PERMISSION_DENIED.
2. Invalid state transitions return HTTP 409 with error code INVALID_STATE_TRANSITION.
3. Validation failures return HTTP 400 with error code VALIDATION_FAILED.

---

<div style="page-break-before: always;"></div>

# Part 7
# 7. KPIs

## 7.1 KPI Properties and Configuration
1. KPI properties: title, description, metric type, target type, standard, target, aggregation method, frequency, and weightage.
2. Metric types: INCREASE, DECREASE, CONTROL, CUMULATIVE.
3. Target types: FIXED, CUSTOM. CUMULATIVE always uses FIXED (enforced by system).
4. Aggregation methods: SUM, AVERAGE. CUMULATIVE always uses SUM (enforced by system).
5. Frequency: WEEKLY or MONTHLY. Determines how KPI Cycles are generated from the timeline.
6. For CUMULATIVE KPIs: standard is always 0, target type is always FIXED, aggregation is always SUM. These fields are auto-populated by the system and are not user-editable.

## 7.2 KPI Lifecycle States
States.
1. DRAFT: KPI created. Admin can edit all properties. Employee can view but cannot enter data.
2. ACTIVE: At least one cycle has been submitted. Standard and Target become immutable.
3. LOCKED: All cycles are approved. KPI is read-only for all roles.
4. IMMUTABLE: Parent Objective is included in a PMS Review snapshot. KPI is permanently read-only.

Valid Transitions.
1. DRAFT → ACTIVE: triggered when the first KPI Cycle transitions to SUBMITTED.
2. ACTIVE → LOCKED: triggered when all KPI Cycles are in APPROVED state.
3. LOCKED → IMMUTABLE: triggered when the parent Objective is included in a PMS Review snapshot.

Invalid Transitions.
1. DRAFT → LOCKED is invalid.
2. DRAFT → IMMUTABLE is invalid.
3. ACTIVE → IMMUTABLE is invalid.
4. IMMUTABLE → any other state is invalid.
5. LOCKED → ACTIVE is invalid.
6. LOCKED → DRAFT is invalid.
7. ACTIVE → DRAFT is invalid.

Failure Behavior.
1. Invalid transitions return HTTP 409 with error code INVALID_STATE_TRANSITION.

## 7.3 KPI Timeline Management
Timeline Rules.
1. Admin or Manager defines the KPI timeline by setting a start date and end date within a single month.
2. The timeline date range must be within a single calendar month.
3. Minimum timeline duration is 7 days. Maximum is 31 days.
4. Upon saving the timeline, the system automatically generates KPI Cycles based on the selected frequency.
5. Timeline definition is performed by Admin or Manager before Employee data entry begins.
6. If the timeline has no cycles yet submitted, Admin may redefine the timeline date range and frequency. Existing DRAFT cycles are deleted and new cycles are regenerated.
7. If any cycle has been submitted, the timeline and cycle structure are locked and cannot be redefined.

Cycle Generation — WEEKLY Frequency.
1. Cycle 1: starts at timeline_start_date, ends at timeline_start_date + 6 days.
2. Each subsequent cycle: starts the day after the previous cycle ends, lasts 7 days.
3. Final cycle: spans remaining days if fewer than 7 remain (shorter cycle is valid).

Cycle Generation — MONTHLY Frequency.
1. One cycle spanning the full timeline is generated.

## 7.4 KPI Immutability Triggers
1. Standard, Target, metric type, and target type become immutable upon first cycle submission.
2. KPI weightage may be adjusted by Admin until all cycles are approved.
3. Once all cycles are approved, KPI weightage becomes immutable.
4. When PMS Review snapshot is created, KPI becomes permanently IMMUTABLE.

## 7.5 Target Equals Standard Validation Block
1. KPI creation is blocked if Target equals Standard for INCREASE or DECREASE metrics.
2. KPI creation is blocked if Target equals 0 for CUMULATIVE metrics (since S is always 0).
3. For CONTROL metrics, Standard must be ≤ Target. If S > T, KPI creation is blocked.
4. On validation failure, the system returns HTTP 400 with error code VALIDATION_FAILED and no KPI is created.
5. For CUSTOM target KPIs, each cycle target value must not equal the standard value. Cycle-level validation failures block submission of that cycle.

7.N Negative Space for KPIs.
1. Unauthorized role attempts return HTTP 403 with error code PERMISSION_DENIED.
2. Invalid KPI state transitions return HTTP 409 with error code INVALID_STATE_TRANSITION.
3. Validation failures return HTTP 400 with error code VALIDATION_FAILED.

---

<div style="page-break-before: always;"></div>

# Part 8
# 8. Weightage Model

## 8.1 Objective Weightage Rules
1. For each Employee and Month, objective weightages must sum to exactly 100.
2. Objective weightages include RC, CO, OE, and OTHERS type objectives together.
3. If weightages do not sum to 100, the system blocks saving and the UI displays the delta.

## 8.2 KPI Weightage Rules
1. For each Objective, KPI weightages must sum to exactly 100.
2. If KPI weightages do not sum to 100, the system blocks KPI save and displays the delta.

## 8.3 Mapped Objective Weightage Rules
1. Mapped child weight is part of the parent Objective's weight budget.
2. Sum of direct KPI weights plus mapped child weights must equal 100 in the parent Objective.

## 8.4 Auto Split Logic
1. Auto Split resets all objective weights to equal distribution across all objectives for that Employee and Month.
2. After Auto Split, Admin may adjust weights manually.
3. Save is disabled until total weight equals exactly 100.
4. UI displays real-time total weight as Admin adjusts values.
5. Rounding rule: weights are rounded to two decimals. Any remaining fractional delta required to reach exactly 100 is added to the last objective in list order.

8.N Negative Space for Weightage.
1. Unauthorized role attempts return HTTP 403 with error code PERMISSION_DENIED.
2. Weightage totals that do not sum to 100 return HTTP 400 with error code WEIGHTAGE_SUM_INVALID.

---

<div style="page-break-before: always;"></div>

# Part 9
# 9. KPI Cycle Execution and Submission

## 9.1 Cycle-by-Cycle Submission Model
1. Each KPI cycle is submitted individually.
2. Employee selects a single cycle row, enters actual value and optional comments, and submits that cycle.
3. The system validates the cycle data before submission.
4. On success, the cycle state becomes SUBMITTED and is locked for Employee editing.

## 9.2 Actual Value Entry Rules
1. Only Employees may enter actual values for their own KPI cycles.
2. Actual values may be entered only when cycle state is DRAFT or REJECTED.
3. Actual values are numeric and validated for required input.
4. Partial saves are allowed. Drafts may be saved without a full actual value.
5. Submission requires actual_value to be present and valid. Draft saves do not require actual_value.
6. For CUMULATIVE KPIs, an actual value of 0 is valid and represents no incremental progress in that cycle.

## 9.3 Unsaved Data Warnings
1. If an Employee enters a cycle value and attempts to navigate away without submitting, the system displays a confirmation warning inline in the current view.
2. The Employee must confirm discard or return to submit.

## 9.4 Submission Locking Rules
1. When a cycle is SUBMITTED, it becomes read-only for the Employee.
2. If the Manager rejects, the cycle returns to REJECTED and is unlocked for Employee editing.
3. If approved, the cycle becomes read-only for all roles except Admin override.

## 9.5 Three-Submission Rule
1. Each KPI cycle can be submitted a maximum of three times by the Employee.
2. Submission count increments on each submission or resubmission. It never decrements.
3. If the third submission is rejected, the cycle is locked and is flagged as max iterations exceeded.
4. After max iterations exceeded, only Admin can resolve via override or force close.
5. Max iteration events trigger an in-app notification to Admin.
6. Attempts to submit a fourth time are blocked with HTTP 409 and error code MAX_SUBMISSIONS_EXCEEDED.

## 9.6 KPI Cycle Deletion Rules
1. Employees cannot delete KPI cycles in any state.
2. Managers cannot delete KPI cycles in any state.
3. Admin may delete KPI cycles with a confirmation action.
4. Deletion requires a confirmation that monthly calculation will be impacted. The confirmation modal displays the impact.
5. Deletion is blocked if it would leave fewer than one cycle in the month. The UI shows an inline error.
6. If the last remaining cycle must be removed, Admin must delete the KPI instead.

9.N Negative Space for Cycle Submission.
1. Unauthorized role attempts return HTTP 403 with error code PERMISSION_DENIED.
2. Submission attempts in invalid states return HTTP 409 with error code INVALID_STATE_TRANSITION.
3. Validation failures return HTTP 400 with error code VALIDATION_FAILED.

---

<div style="page-break-before: always;"></div>

# Part 10
# 10. Approval Workflows

## 10.1 Batch Approval Model
1. Approval is performed at KPI level for a given month, not per individual cycle.
2. A single approval action applies to all cycles of a KPI for that month.
3. Approval and rejection are available only when all cycles that are not CANCELLED_BY_SYSTEM have actual values entered.
4. Cycles in CANCELLED_BY_SYSTEM state are excluded from approval gating and do not block approval.

## 10.2 Manager Approval and Rejection Workflow
1. Authorized Manager opens Pending Approvals.
2. System lists KPIs awaiting approval grouped by employee and KPI.
3. Manager selects a KPI and reviews all cycles and their actual values.
4. Manager enters mandatory comments.
5. Manager selects Approve or Reject.
6. If Approve: all eligible cycles (excluding CANCELLED_BY_SYSTEM) transition to APPROVED and are locked.
7. If Reject: all eligible cycles transition to REJECTED and are unlocked for Employee editing.

Negative Space.
1. If any eligible cycle is missing an actual value, Approve and Reject controls are hidden in the UI and API calls return HTTP 412 with error code PRECONDITION_FAILED.
2. If comments are missing, the action is blocked with HTTP 400 with error code VALIDATION_FAILED. No state changes occur.

## 10.3 Mandatory Comments Requirement
1. Approval comments are mandatory for both approvals and rejections.
2. Comments length must be between 10 and 1000 characters.
3. Missing or too-short comments block the action with an inline error in the form.

## 10.4 Admin Override Authority
1. Admin may override any Manager approval or rejection.
2. Admin must provide an override reason.
3. Admin override is not permitted for closed PMS Reviews.
4. Admin override is flagged as an override action.

## 10.5 System Cancellation Triggers
Exhaustive list of triggers that cause KPI Cycle cancellation by the system.
1. Approving manager is deactivated and no alternative approver exists for the affected period.
2. KPI definition is soft-deleted by Admin.
3. Objective is soft-deleted by Admin.
4. Employee is deactivated and Admin performs month force-close action.
5. Any other trigger must be explicitly added to this list via SSoT update before implementation.

Cancelled Cycle Behavior.
1. Cancelled cycles do not block PMS Review eligibility.
2. Cancelled cycles are excluded from monthly KPI percent calculations.
3. Cancelled cycles are a terminal state and cannot be reopened.

10.N Negative Space for Approvals.
1. Unauthorized approval attempts return HTTP 403 with error code UNAUTHORIZED_APPROVAL_ATTEMPT.
2. Approval attempts when preconditions are not met return HTTP 412 with error code PRECONDITION_FAILED.
3. Missing mandatory comments return HTTP 400 with error code VALIDATION_FAILED.

---

<div style="page-break-before: always;"></div>

# Part 11
# 11. Objective Mapping

## 11.1 Linked Reference Model
1. A mapped child Objective contributes its canonical percent to its parent without duplication.
2. The child Objective percent is referenced, not copied.
3. Unmapping removes mapping contributions from calculations for all periods unless the period is locked by a closed PMS Review.

## 11.2 Mapping Creation Workflow
1. Authorized Admin selects a parent Objective.
2. Admin opens the mapping form and selects the Employee who owns the child Objective.
3. System lists eligible Objectives for the selected Employee and period.
4. Admin selects the child Objective and assigns a mapped weight.
5. System validates mapping rules and saves the mapping.

Eligibility Rules.
1. Parent and child Objectives must be in the same Fiscal Year and Month.
2. Child Objective must already exist and belong to a valid Employee in the same organisation.
3. Parent Objective must be in LAUNCHED, ONGOING, or COMPLETED state (not DELETED).
4. Mapping form cannot create new Objectives. The child must already exist.

## 11.3 Single Parent Mapping Rule
1. A child Objective may map to at most one parent Objective.
2. If a child Objective already has a parent mapping, additional mappings are blocked with HTTP 400 and error code CHILD_ALREADY_MAPPED.
3. An Objective may act as a parent in one mapping and a child in another mapping.

## 11.4 Parent Weight Assignment
1. Mapped child weight is part of the parent Objective's weight budget.
2. Parent direct KPI weights plus mapped child weights must sum to 100.

## 11.5 Circular Mapping Rules
1. The system does not block creation of circular mappings.
2. If a circular mapping is detected at calculation time, the system calculates each Objective percent using only its own KPI-derived percent and excludes mapped contributions.
3. The UI displays a visible warning banner when a circular mapping is detected for any Objective in the current view.
4. Circular mapping detection must be re-evaluated after each mapping creation or deletion.

11.N Negative Space for Mapping.
1. Unauthorized mapping attempts return HTTP 403 with error code PERMISSION_DENIED.
2. Invalid mapping conditions return HTTP 400 with error code VALIDATION_FAILED.

---

<div style="page-break-before: always;"></div>

# Part 12
# 12. Duplication and Bulk Operations

## 12.1 Duplication Authority
1. Duplication is Admin-only. Managers and Employees cannot duplicate objectives.

## 12.2 Objective Duplication Rules
1. Objective duplication is allowed across Employees, Months, and Fiscal Years.
2. Duplication copies Objective properties and KPI definitions.
3. KPI timelines and cycles are NOT copied. Admin recreates cycles after duplication.
4. Objective weight is preserved from the source.
5. Duplication is blocked if the target context already has an Objective with the same identity (Employee + Fiscal Year + Month + Objective Title). Identity conflict returns HTTP 409 with error code OBJECTIVE_DUPLICATION_BLOCKED.

## 12.3 KPI Duplication Rules
1. KPI definitions are duplicated with metric type, target type, standard, target, aggregation method, and weightage.
2. KPI cycles are not duplicated.

## 12.4 Cross-Fiscal Year Duplication
1. Duplication across fiscal years preserves the original month position within the fiscal calendar.

## 12.5 Duplication Workflow
1. Admin selects source Fiscal Year, Month, Employee, and Objective.
2. Admin selects target Fiscal Year, Month, and Employee.
3. System displays a preview of Objective and KPI definitions to be duplicated.
4. Admin confirms. System creates new Objective and KPIs in target context.

## 12.6 Bulk Operations Scope
Bulk operations are available in the following modules. All bulk operations are Admin-only.

### 12.6.1 Bulk Operations in Objectives & KPI
1. Clone: Copy one or more Objectives (with KPI definitions, without cycles) from one Employee+Month to one or more target Employee+Month combinations.
2. Move: Reassign an Objective from one Employee to another within the same Month and Fiscal Year. This action is blocked if the Objective has any submitted or approved cycle data.
3. Delete: Soft-delete multiple Objectives simultaneously. Deletion is blocked individually per Objective if it has execution data.
4. Import: Import Objectives and KPIs from Excel for one or more Employees and Months. See Section 12.7 for the Excel format specification.
5. Export: Export the current view's Objectives and KPIs to Excel.

### 12.6.2 Bulk Operations in KPI Library
1. Bulk Apply: Apply one or more KPI Library templates to one or more Employees' months in a single action.
2. Bulk Apply previews the resulting KPIs before committing.
3. If any target Objective does not exist, the system creates it automatically as part of the bulk apply.
4. Post-apply, weightages are set to equal distribution (Auto Split logic applies) and Admin must finalize weightages manually. The system blocks save until sum = 100.

### 12.6.3 Bulk Operations in PMS Review
1. Bulk Initiate: Admin may select multiple eligible Employees and initiate PMS Reviews for all of them in one action.
2. Eligibility is checked individually per Employee before initiation. Ineligible Employees are listed with reasons. Eligible Employees proceed.
3. Bulk initiation is not atomic: if three out of five Employees are eligible, three reviews are created and two are reported as failed with reasons. This is the only exception to the atomicity rule and is by design.

## 12.7 Excel Import Format Specification (Authoritative Recommendation)
The authoritative Excel import format uses two sheets per file.

Sheet 1 — Objectives.
Required columns (order must match): Employee Code, Fiscal Year, Month (number 1–12), Objective Type (RC / CO / OE / OTHERS), Objective Title, Description (optional), Weightage.

Sheet 2 — KPIs.
Required columns (order must match): Employee Code, Fiscal Year, Month, Objective Title (must match Sheet 1), KPI Title, Description (optional), Metric Type (INCREASE / DECREASE / CONTROL / CUMULATIVE), Target Type (FIXED / CUSTOM — CUMULATIVE rows must be FIXED), Standard (must be 0 for CUMULATIVE rows), Target, Aggregation Method (SUM / AVERAGE — CUMULATIVE rows must be SUM), Frequency (WEEKLY / MONTHLY), Weightage.

Validation Rules.
1. All Sheet 2 rows must reference a valid Objective by (Employee Code + Fiscal Year + Month + Objective Title) matching a Sheet 1 row.
2. Objective weightages must sum to exactly 100 per (Employee Code + Fiscal Year + Month) group.
3. KPI weightages must sum to exactly 100 per (Employee Code + Fiscal Year + Month + Objective Title) group.
4. All required columns must be present with valid values. Empty required fields fail validation.
5. Import is atomic per the Invariant in Section 1.8.
6. If any row fails, the entire import is rejected and the full error list is returned with row numbers and error descriptions.

---

<div style="page-break-before: always;"></div>

# Part 13
# 13. PMS Review Eligibility

## 13.1 Configured Cadence Periods
1. PMS Review is initiated only for configured cadence periods: Quarterly, Half-Yearly, or Annual.
2. All three cadences are available and Admin configures which applies globally or per Employee.
3. PMS Review can occur once per configured cadence period per Employee per fiscal period.

## 13.2 System Gating Conditions (Blocking — Review Cannot Proceed)
1. Any KPI cycle within the review period is in DRAFT, SUBMITTED, or REJECTED state.
2. Objective or KPI weightages do not sum to 100 for any month within the review period.
3. A PMS Review for the same Employee, period type, and fiscal period already exists.

## 13.3 Data Completeness Checks (Warnings — Admin Must Acknowledge)
1. Missing Objectives or empty Objectives (no KPIs) exist in the review period.
2. NULL calculated values exist.
3. If warnings exist, Admin must explicitly acknowledge each warning before initiating.
4. If blocking conditions exist, initiation is not permitted even with acknowledgment.

## 13.4 Initiation Authority
1. Only Admin may initiate PMS Reviews.
2. Managers and Employees cannot initiate PMS Reviews.

13.N Negative Space.
1. Unauthorized initiation attempts return HTTP 403 with error code PERMISSION_DENIED.
2. Initiation with blocking conditions returns HTTP 400 with error code VALIDATION_FAILED. No review is created.

---

<div style="page-break-before: always;"></div>

# Part 14
# 14. PMS Review Workflow

## 14.1 Snapshot Creation
1. On PMS Review initiation, the system creates an immutable performance snapshot.
2. Snapshot values: objective percents, OEM, OEQ, OEH, OEA, and core objective type averages for the covered period.
3. Snapshot values become immutable at creation.
4. Employees can view their own in-progress PMS Review in read-only mode.
5. Managers can view their own Employee in-progress PMS Review in read-only mode. This does not grant review authority.

## 14.2 PMS Review Status States
1. INITIATED: Review has been created. Snapshot taken.
2. MANAGER_REVIEW_PENDING: Awaiting Manager input.
3. MANAGER_SUBMITTED: Manager review complete.
4. ADMIN_REVIEW_PENDING: Awaiting Admin input.
5. CLOSED: Admin review complete. Terminal state.

## 14.3 Manager Review Submission
1. System notifies the Manager after review initiation.
2. Manager views the snapshot in read-only mode.
3. Manager selects one rating option: HAPPY, NEUTRAL, or SAD.
4. Manager enters mandatory comments between 50 and 2000 characters.
5. Manager confirms submission via a confirmation dialog.
6. Manager Review becomes read-only after submission. Status transitions to MANAGER_SUBMITTED.

## 14.4 Admin Review Submission
1. After Manager submission, Admin views the snapshot and Manager Review in read-only mode.
2. Admin selects one rating option: HAPPY, NEUTRAL, or SAD.
3. Admin enters mandatory comments between 50 and 2000 characters.
4. Admin confirms submission.
5. System saves the Admin Review. PMS Review transitions to CLOSED state.

## 14.5 Review Closure and Lock
1. On closure, the PMS Review becomes immutable.
2. All underlying Objectives and KPIs within the period become immutable (IMMUTABLE state).
3. The final PMS Rating (Exceeds Expectations / Meets Expectations / Below Expectations / Disappointing) is computed from the OEM/OEQ/OEH/OEA score using the configured PMS Rating Scale at closure time.

14.N Negative Space.
1. Unauthorized review submissions return HTTP 403 with error code PERMISSION_DENIED.
2. Submissions missing required fields return HTTP 400 with error code VALIDATION_FAILED.
3. Attempts to modify a CLOSED review return HTTP 403 with error code IMMUTABILITY_VIOLATION.

---

<div style="page-break-before: always;"></div>

# Part 15
# 15. Post-Review Immutability

## 15.1 Read-Only Scope
1. After PMS Review closure, all Objectives, KPIs, and KPI Cycles within the review period are read-only.
2. Weightage changes are blocked for any data covered by the closed review.
3. Objective Mapping changes are blocked for any Objectives covered by a closed review.

## 15.2 Historical Visibility
1. Closed PMS Reviews are visible to Employees, Managers, and Admins as read-only.
2. PMS Review data remains available for display in the Executive Summary and reports.

## 15.3 No Override Policy
1. Closed PMS Reviews cannot be reopened, edited, or overridden by any role.
2. Any attempt to modify closed PMS Review data is blocked with HTTP 403 and error code IMMUTABILITY_VIOLATION.

---

<div style="page-break-before: always;"></div>

# Part 16
# 16. People Management Lifecycle

## 16.1 User Creation and Mandatory Fields
1. Mandatory fields: Full Name, Username, Email, Password.
2. All other profile fields are optional at creation.
3. Username and Email may be edited by Admin after account creation.

## 16.2 Role Changes and Effective Dates
1. Admin may change a User's role.
2. Role changes that increase approval authority take effect on the first day of the next month.
3. Role changes that reduce authority take effect immediately.

## 16.3 Reporting Manager Changes
1. Admin may change an Employee's reporting manager.
2. Reporting manager changes apply starting the next month.
3. Pending approvals at the time of change: Admin must manually reassign any pending approvals if the old manager is no longer available.

## 16.4 Employee Status Changes
1. Admin may deactivate and reactivate Employees.
2. Deactivation does not delete historical data.
3. Reactivation restores access for future periods only.

## 16.5 Attribute List Configuration
1. Admin configures attribute lists for Department, Division, Business Unit, Location, and Designation.
2. Department and Division are independent lists.
3. Business Unit values are dependent on Division. Each Business Unit belongs to a Division.
4. Employee profile fields for these attributes are selected from the configured lists.

## 16.6 Org-Chart
1. The org-chart displays the full organisational hierarchy: BoD at the top, then Admin/Manager levels, then Employee level.
2. The org-chart is derived from reporting manager relationships.
3. The org-chart is read-only for all roles. Only Admin may change reporting manager relationships via the People Management table view.
4. BoD Admins (executive_label = TRUE) appear at the top of the org-chart with the label "Board of Directors".

## 16.7 People Management Bulk Operations
1. Admin may select multiple Users and perform bulk deactivation.
2. Admin may select multiple Users and perform bulk role-change. All selected Users receive the new role.
3. Bulk deactivation and role-change follow the same effective-date rules as individual operations.
4. Bulk operations affecting approval authority take effect the next month.
5. Bulk deactivation of a User who has pending KPI approvals queues a system notification for Admin to resolve pending approvals.

16.N Negative Space.
1. Unauthorized user management actions return HTTP 403 with error code PERMISSION_DENIED.
2. Invalid updates return HTTP 400 with error code VALIDATION_FAILED.

---

<div style="page-break-before: always;"></div>

# Part 17
# 17. Month Force Close

## 17.1 Force Close Rules
1. Admin may force-close a month for any Employee when execution cannot be completed normally.
2. Cycle state handling on force close is defined in Section 4.4.7.
3. Force-closed months are included in cadence calculations.
4. Employee may not submit cycles after force-close.
5. Admin must provide a mandatory reason when force-closing. The reason is stored and displayed in the force-close record.

## 17.2 Calculation Impact
1. Force-closed months remain part of derived cadence calculations even if all Objectives are NULL.
2. NULL cycles are excluded from ObjectivePercent calculations.

17.N Negative Space.
1. Unauthorized force-close attempts return HTTP 403 with error code PERMISSION_DENIED.
2. Missing reason returns HTTP 400 with error code VALIDATION_FAILED.

---

<div style="page-break-before: always;"></div>

# Part 18
# 18. Status Indicators and Rating Scales

## 18.1 KPI Status Bands
1. NOT_STARTED if no actual values are entered for any cycle in the month.
2. AT_RISK: percent 0–59. Color: Red.
3. OFF_TRACK: percent 60–79. Color: Amber.
4. ON_TRACK: percent 80–99. Color: Yellow-Green.
5. ACHIEVED: percent ≥ 100. Color: Green.
6. Bands and colors are Admin-configurable. Default values are as listed.
7. Status severity ordering: AT_RISK > OFF_TRACK > ON_TRACK > ACHIEVED.

## 18.2 Objective Status Indicators
1. Objective Status uses distinct visual indicators for LAUNCHED, ONGOING, and COMPLETED.
2. LAUNCHED: Grey circle. ONGOING: Blue circle. COMPLETED: Green circle.
3. Objective Status indicators are visually distinct from KPI status band indicators.

## 18.3 PMS Rating Scale
1. Default bands (inclusive lower bounds):
   - score ≥ 100.00 → Exceeds Expectations
   - 90.00 ≤ score < 100.00 → Meets Expectations
   - 70.00 ≤ score < 90.00 → Below Expectations
   - score < 70.00 → Disappointing
2. Bands are Admin-configurable. Custom bands must be contiguous and non-overlapping, covering the full 0–∞ range.

## 18.4 Cross-View Consistency
1. The same status bands and colors apply across Employee, Manager, and Admin views.
2. BoD Admin views display the same bands in the Executive Summary.

---

<div style="page-break-before: always;"></div>

# Part 19
# 19. Search, Ordering, Pagination, and Exports

## 19.1 Default Sort Order
1. Every table has a deterministic default sort order.
2. Default: created_at descending, then id ascending as a tie-breaker, unless a module defines a more specific order.

## 19.2 Stable Pagination
1. Pagination must be stable across refreshes.
2. Pagination uses cursor-based stable pagination to prevent row jumping.

## 19.3 Export Scope
1. Exports reflect exactly what the user sees on screen, no more and no less.
2. Export actions are logged as user activity (system log, not audit log since audit logs are removed from V1).
3. Export records are limited to 10,000 rows per request.
4. Export formats: CSV and Excel (.xlsx).

---

<div style="page-break-before: always;"></div>

# Part 20
# 20. Notifications

## 20.1 In-App Notifications Scope
1. In-app notifications are the only notification channel in V1. Email notifications are out of scope.
2. Notifications are persisted at creation and visible in the notification center (bell icon in the header).
3. Notification persistence does not block the triggering business action.

## 20.2 Notification Triggers
1. When an Employee submits a KPI cycle → notification sent to the approving Manager.
2. When a KPI is approved → notification sent to the Employee.
3. When a KPI is rejected → notification sent to the Employee with rejection comment preview.
4. When a third submission is rejected (max iterations exceeded) → notification sent to Admin.
5. When a PMS Review is initiated → notification sent to the Manager and Employee.
6. When a bulk deactivation affects a User with pending KPI approvals → notification sent to Admin.

## 20.3 Notification Data Model
1. Each notification has: recipient_user_id, title, message, link_url, status (UNREAD / READ), created_at, read_at.
2. Clicking a notification marks it as READ and navigates to the relevant screen.
3. Unread notification count is displayed on the bell icon badge.

---

<div style="page-break-before: always;"></div>

# Part 21
# 21. KPI Library

## 21.1 Purpose
The KPI Library is a repository of reusable KPI definition templates managed by Admin. Templates are not executed directly — they are applied to an Employee's Objective to create a live KPI.

## 21.2 Template Properties
1. A KPI Library Template stores: title, description, metric type, target type, standard, target, aggregation method, and frequency.
2. Templates do not store weightage. Weightage is set at apply-time.
3. Templates do not store timeline dates. Timelines are defined by Admin or Manager after applying.
4. Templates can be tagged by industry, department, or objective type for search and filtering.

## 21.3 Template Lifecycle
1. Admin creates a template from scratch or by saving an existing KPI as a template.
2. Templates have states: ACTIVE and ARCHIVED. Archived templates are hidden from the apply workflow but are preserved.
3. Admin may archive and unarchive templates.
4. Template deletion is soft-delete. Templates with historical apply records are archived, not deleted.

## 21.4 Applying Templates
1. Admin selects one or more templates and chooses target Employees and Months.
2. System creates KPI definitions under the target Objectives. If the target Objective does not exist, Admin must create or specify one before applying (or use Bulk Apply which creates the Objective automatically with a specified type and title).
3. After applying, weightages default to equal distribution (Auto Split). Admin must finalize weightages before save is permitted.
4. Applying a template creates a KPI in DRAFT state. It does not create cycles. Cycles are created when Admin or Manager defines the KPI timeline.

## 21.5 Bulk Apply Workflow
1. Admin selects templates (one or more).
2. Admin selects target Employees, Months, and Objectives (or specifies new Objective titles and types).
3. System displays a preview showing what will be created.
4. Admin confirms. All creates run in a single transaction. On any failure, the entire bulk apply is rolled back.

---

<div style="page-break-before: always;"></div>

# Part 22
# 22. Executive Summary and Hall of Fame

## 22.1 Purpose and Access
1. The Executive Summary is a read-only dashboard accessible to Admin and BoD Admin users.
2. All data in the Executive Summary is derived from existing performance data. No data entry occurs here.
3. All components in the Executive Summary are downloadable as PDF.

## 22.2 Leaderboard
1. The Leaderboard displays ranked Employee performance for the selected cadence period and fiscal period.
2. Ranking is based on OEM (Monthly), OEQ (Quarterly), OEH (Half-Yearly), or OEA (Annual) depending on the selected cadence.
3. Admin may filter the leaderboard by Department, Division, Business Unit, or Reporting Manager.
4. Each row shows: Rank, Employee Name, Designation, OE Score, and KPI Status distribution (count per band).
5. Employees with NULL scores (no objectives or all-excluded months) are listed at the bottom unranked.

## 22.3 Status Distribution
1. Status Distribution displays aggregate counts of Employees by KPI status band for the selected month and filter.
2. Displayed as: Not Started count, At Risk count, Off Track count, On Track count, Achieved count.
3. Admin may filter by Department, Division, Business Unit, or Reporting Manager.
4. A percentage breakdown is shown alongside absolute counts.

## 22.4 Hall of Fame — Two Lists

### 22.4.1 Most Consistent Performers
1. Criterion: Employees with the highest average OEM over the last four completed quarters, with a minimum requirement that at least 80% of eligible months have a KPI status of ON_TRACK or ACHIEVED.
2. List size: Top 10.
3. Tie-breaking: Higher average OEM wins. If still tied, longer tenure (earlier date_of_joining) wins.
4. Eligibility: Employee must have at least one complete quarter of data in the last four quarters to appear.
5. Employees on a force-closed month within the period are still eligible; force-closed months contribute to their OEM as per Section 4.4.7.
6. Label: "Most Consistent"

### 22.4.2 Top Annual Performers
1. Criterion: Employees with the highest OEA for the current or most recently completed fiscal year.
2. List size: Top 10.
3. Tie-breaking: Higher OEA wins. If still tied, lower submission rejection rate wins (fewer rejections relative to total submissions).
4. Eligibility: Employee must have at least 6 valid months of data in the fiscal year.
5. Label: "Top Performers — [Fiscal Year]"

### 22.4.3 Hall of Fame Display Rules
1. Both lists are displayed side by side on the Executive Summary page.
2. An Employee may appear in both lists simultaneously.
3. Both lists refresh automatically when the underlying performance data changes.
4. Both lists are downloadable as PDF.

## 22.5 PDF Download
1. Each Executive Summary component (Leaderboard, Status Distribution, Hall of Fame) has an individual PDF download button.
2. An "Export All" button downloads all components as a single PDF.
3. PDFs include the current filter selection, date, and fiscal period in the header.
4. PDF generation is synchronous for single-component downloads (up to 10,000 records) and asynchronous with a progress indicator for the combined export.

---

<div style="page-break-before: always;"></div>

# Part 23
# 23. Architecture Guardrails

## 23.1 Tech Stack (Locked)
1. Framework: SvelteKit 2 (current stable major version, built on Svelte 5 runes syntax) with TypeScript.
2. ORM: Drizzle ORM with PostgreSQL (Neon serverless recommended).
3. Authentication: BetterAuth.
4. UI Component Library: shadcn-svelte with Claymorphism light-mode theme.
5. Deployment: Vercel (frontend + serverless API routes) + Neon (database).

## 23.2 Layered Architecture (Strict — Five Layers)
Layer 1 — Routes / +page.svelte + Server Actions (Controller Layer).
1. Handles request parsing, response formatting, form validation, and authentication checks.
2. No business logic. No direct database calls. No calculations.

Layer 2 — Services (Business Logic Layer).
1. All workflows, state machine transitions, calculations, rules enforcement, and weight validation.
2. All calculation functions are pure functions (inputs → outputs, no DB, no side effects).
3. One service file per domain: ObjectiveService, KPIService, KPICycleService, ApprovalService, PMSService, PeopleService, KPILibraryService, ExportService.
4. Services call Repositories for data access. Services never access the database directly.

Layer 3 — Repositories (Data Access Layer).
1. Contains all Drizzle ORM queries.
2. Every query must scope to the organisation constant (organisation_id).
3. Every query must include `AND deleted_at IS NULL` for soft-delete tables unless explicitly retrieving deleted records for restore operations.
4. No business logic in repositories. Data retrieval and persistence only.

Layer 4 — Schema / Models.
1. All Drizzle table definitions, relations, and constraints.
2. All Zod validation schemas.

Layer 5 — Utils / Helpers / Lib.
1. Pure calculation functions (KPI percent, OEM, OEQ, etc.).
2. Date helpers, weightage validators, status derivators.
3. No side effects. No database calls. No state mutation.

Violations.
1. Direct database calls in Controller are a SEV-1 defect.
2. Business logic in Repository is a SEV-1 defect.
3. Calculation functions that call the database are a SEV-1 defect.

## 23.3 Organisation Scoping Rules
1. Every table includes organisation_id.
2. organisation_id is always the server-side constant. It is never accepted from request bodies, query params, or headers.
3. Mandatory query pattern: WHERE organisation_id = :constant_org_id AND deleted_at IS NULL.
4. Any query missing organisation_id scoping is a SEV-1 defect.

## 23.4 RBAC Enforcement Rules
1. RBAC is enforced server-side in the Service layer before any state change.
2. RBAC is enforced per entity and per action.
3. Role checks only in the UI are forbidden.
4. BoD Admin (executive_label = TRUE) role check: if executive_label is true, any write attempt returns HTTP 403.

## 23.5 State Machine Rules
1. All state transitions go through a single service function per entity type.
2. Invalid transitions throw a typed StateTransitionError and never persist.
3. State changes are never performed directly via SQL or raw Drizzle updates outside the Service layer.

## 23.6 Calculation Engine Rules
1. All formulas are implemented as pure functions in the Utils/Helpers layer.
2. Calculation functions accept inputs and return outputs with no side effects.
3. Calculation functions must not perform database queries.
4. Calculation functions must not modify external state.
5. Calculated values (OEM, OEQ, OEH, OEA, KPI percent) are not stored as authoritative fields. If cached, they are marked as derived and must be recalculated from source data on demand.
6. Monthly and derived cadence logic are never mixed in one calculation function.

## 23.7 Deletion Rules
1. Soft delete is the default for all entities (deleted_at timestamp).
2. KPI Cycles may be hard-deleted by Admin only.
3. When a KPI Cycle is hard-deleted, related KPI Submission records are also deleted.

## 23.8 Error Handling Rules
1. All errors are typed. Defined error types: ValidationError, StateTransitionError, PermissionError, PreconditionError, ImmutabilityError, WeightageError.
2. Validation errors are distinct from system errors.
3. If validation fails, the request is rejected with HTTP 400.
4. If a state transition is invalid, the request is rejected with HTTP 409.
5. If a permission check fails, the request is rejected with HTTP 403.
6. If a precondition is not met (e.g., missing actual values), the request is rejected with HTTP 412.

## 23.9 Data Integrity Rules
1. KPI weights per Objective must equal 100. Enforced in Service layer before any save.
2. Objective weights per Employee per Month must equal 100. Enforced in Service layer before any save.
3. CUMULATIVE KPIs must have S = 0, target type FIXED, aggregation SUM. Enforced at KPI creation.

## 23.10 Performance Rules
1. Pagination is mandatory for all list endpoints.
2. Unbounded queries (without LIMIT) are forbidden.
3. N+1 queries are forbidden. Use JOIN or batch loading.
4. Index requirements are defined in Part 27.

## 23.11 Security Rules
1. Frontend role claims are never trusted.
2. All IDs received from the client are validated against the organisation scope before use.
3. Sensitive data (passwords, tokens) is never logged or included in error responses.
4. BoD Admin write attempts are rejected server-side regardless of UI state.

## 23.12 Development Workflow Rules
1. Every feature is developed as a vertical slice: schema → repository → service → route/action → UI.
2. One pull request per feature vertical slice.
3. Weekly deployment to a Vercel preview URL every Friday for testing.
4. No feature without a test (see Part 28). An untested feature is considered incomplete.

---

<div style="page-break-before: always;"></div>

# Part 24
# 24. Database Schema — Core Tables

All tables include `organisation_id` as a non-nullable field with a constant value. All tables include `created_at` (timestamptz, default now()). All tables that support soft delete include `deleted_at` (timestamptz, nullable).

## 24.1 organisation
1. id — primary key (uuid)
2. name — varchar
3. fiscal_year_start — ENUM: APRIL, JANUARY
4. status — ENUM: ACTIVE, DEACTIVATED
5. created_at
6. Note: There is exactly one row in this table per deployment.

## 24.2 users
1. id — primary key (uuid)
2. organisation_id — foreign key → organisation.id
3. role — ENUM: ADMIN, MANAGER, EMPLOYEE
4. executive_label — boolean, default FALSE (TRUE for BoD Admins)
5. email — varchar, unique per organisation
6. username — varchar, unique per organisation
7. password_hash — varchar
8. status — ENUM: ACTIVE, DEACTIVATED
9. created_at
10. deleted_at

## 24.3 employees
1. id — primary key (uuid)
2. organisation_id — foreign key → organisation.id
3. user_id — foreign key → users.id
4. manager_id — foreign key → employees.id (nullable — null for top of hierarchy)
5. status — ENUM: ACTIVE, DEACTIVATED
6. full_name — varchar
7. employee_code — varchar, unique per organisation when provided
8. department — varchar (must match tenant_attribute_values)
9. division — varchar (must match tenant_attribute_values)
10. business_unit — varchar (must match tenant_attribute_values, dependent on division)
11. location — varchar (must match tenant_attribute_values)
12. designation — varchar (must match tenant_attribute_values)
13. date_of_joining — date
14. date_of_birth — date
15. gender — varchar
16. created_at
17. deleted_at

## 24.4 objectives
1. id — primary key (uuid)
2. organisation_id — foreign key → organisation.id
3. employee_id — foreign key → employees.id
4. category — ENUM: RC, CO, OE, OTHERS
5. weightage — numeric(5,2)
6. fiscal_year — integer
7. month — integer (1–12)
8. status — ENUM: LAUNCHED, ONGOING, COMPLETED, DELETED (system-derived, stored for query performance)
9. title — varchar
10. description — text (nullable)
11. created_at
12. deleted_at

## 24.5 kpis
1. id — primary key (uuid)
2. organisation_id — foreign key → organisation.id
3. objective_id — foreign key → objectives.id
4. metric_type — ENUM: INCREASE, DECREASE, CONTROL, CUMULATIVE
5. target_type — ENUM: FIXED, CUSTOM
6. standard — numeric (must be 0 for CUMULATIVE)
7. target — numeric
8. weightage — numeric(5,2)
9. aggregation_method — ENUM: SUM, AVERAGE
10. frequency — ENUM: WEEKLY, MONTHLY
11. title — varchar
12. description — text (nullable)
13. kpi_state — ENUM: DRAFT, ACTIVE, LOCKED, IMMUTABLE
14. immutable_flag — boolean, default FALSE
15. timeline_start_date — date (nullable until defined)
16. timeline_end_date — date (nullable until defined)
17. created_at
18. deleted_at

## 24.6 kpi_cycles
1. id — primary key (uuid)
2. organisation_id — foreign key → organisation.id
3. kpi_id — foreign key → kpis.id
4. cycle_start_date — date
5. cycle_end_date — date
6. standard_value — numeric (copied from kpi.standard at cycle creation)
7. target_value — numeric (copied from kpi.target for FIXED; set per cycle for CUSTOM)
8. actual_value — numeric (nullable until entered)
9. comments — text (nullable)
10. achievement_percent — numeric (system-derived, cached, non-authoritative)
11. submission_count — integer, default 0, never decrements
12. state — ENUM: DRAFT, SUBMITTED, APPROVED, REJECTED, CANCELLED_BY_SYSTEM, LOCKED
13. force_closed — boolean, default FALSE
14. created_at
15. Note: No deleted_at. KPI Cycles support hard delete by Admin only.

## 24.7 kpi_submissions
1. id — primary key (uuid)
2. organisation_id — foreign key → organisation.id
3. kpi_cycle_id — foreign key → kpi_cycles.id
4. state — ENUM: DRAFT, SUBMITTED, APPROVED, REJECTED, CANCELLED_BY_SYSTEM, LOCKED
5. submitted_by — uuid (foreign key → users.id, nullable)
6. submitted_at — timestamptz (nullable)
7. approved_by — uuid (foreign key → users.id, nullable)
8. approved_at — timestamptz (nullable)
9. approval_comment — text (nullable)
10. rejected_by — uuid (foreign key → users.id, nullable)
11. rejected_at — timestamptz (nullable)
12. rejection_comment — text (nullable)
13. is_override — boolean, default FALSE
14. created_at
15. updated_at

## 24.8 objective_mappings
1. id — primary key (uuid)
2. organisation_id — foreign key → organisation.id
3. parent_objective_id — foreign key → objectives.id
4. child_objective_id — foreign key → objectives.id
5. weight_in_parent — numeric(5,2)
6. created_at
7. deleted_at
8. Unique constraint on child_objective_id to enforce single parent mapping (partial unique index excluding deleted_at IS NOT NULL).

## 24.9 pms_reviews
1. id — primary key (uuid)
2. organisation_id — foreign key → organisation.id
3. employee_id — foreign key → employees.id
4. period_type — ENUM: QUARTERLY, HALF_YEARLY, ANNUAL
5. fiscal_year — integer
6. period — varchar (e.g., "Q1", "H1", "FY")
7. snapshot_json — jsonb (immutable after creation)
8. manager_review_json — jsonb (nullable until submitted)
9. admin_review_json — jsonb (nullable until submitted)
10. status — ENUM: INITIATED, MANAGER_REVIEW_PENDING, MANAGER_SUBMITTED, ADMIN_REVIEW_PENDING, CLOSED
11. created_at
12. locked_at — timestamptz (nullable, set on CLOSED)

## 24.10 in_app_notifications
1. id — primary key (uuid)
2. organisation_id — foreign key → organisation.id
3. recipient_user_id — foreign key → users.id
4. title — varchar
5. message — text
6. link_url — varchar (nullable)
7. status — ENUM: UNREAD, READ
8. created_at
9. read_at — timestamptz (nullable)

## 24.11 kpi_library_templates
1. id — primary key (uuid)
2. organisation_id — foreign key → organisation.id
3. title — varchar
4. description — text (nullable)
5. metric_type — ENUM: INCREASE, DECREASE, CONTROL, CUMULATIVE
6. target_type — ENUM: FIXED, CUSTOM
7. standard — numeric
8. target — numeric
9. aggregation_method — ENUM: SUM, AVERAGE
10. frequency — ENUM: WEEKLY, MONTHLY
11. tags — text[] (array of tag strings for search/filter)
12. status — ENUM: ACTIVE, ARCHIVED
13. created_by — foreign key → users.id
14. created_at
15. deleted_at

## 24.12 tenant_attribute_values
1. id — primary key (uuid)
2. organisation_id — foreign key → organisation.id
3. attribute_type — ENUM: DEPARTMENT, DIVISION, BUSINESS_UNIT, LOCATION, DESIGNATION
4. attribute_value — varchar
5. parent_value — varchar (nullable; used for Business Unit → Division dependency: stores parent Division value)
6. created_at
7. deleted_at

## 24.13 organisation_config
1. id — primary key (uuid)
2. organisation_id — foreign key → organisation.id
3. pms_cadences_enabled — text[] (array of QUARTERLY, HALF_YEARLY, ANNUAL)
4. kpi_status_bands — jsonb (configurable band thresholds)
5. pms_rating_bands — jsonb (configurable PMS rating thresholds)
6. created_at
7. updated_at

---

<div style="page-break-before: always;"></div>

# Part 25
# 25. Error Handling and UX Contracts

## 25.1 Error Display Rules
1. Validation errors (field-level) must render inline, directly below the relevant field within the form or modal. No toast for validation errors.
2. State transition errors and permission errors that occur during form submission render as an inline error banner inside the form or modal, not as a toast.
3. Network errors and server errors (5xx) render as a single toast notification. The toast must be dismissible and must not auto-dismiss for server errors.
4. Success confirmations render as a dismissible toast that auto-dismisses after 4 seconds.
5. Blocking conditions (e.g., preconditions not met) cause the action button to be disabled in the UI before the user attempts the action. The UI shows an inline explanation of what must be resolved.
6. This rule applies to every form, every modal, and every inline action in the product without exception.

## 25.2 Validation Determinism
1. Validation failures are deterministic and identical across UI, API, and imports.
2. Validation messages are consistent for the same error condition.
3. UI must not display a successful state before the server confirms success.

## 25.3 Partial Saves
1. Partial saves are allowed for KPI Cycle forms (drafts may be saved without actual_value).
2. Partial saves are not allowed for Objectives, KPIs, or weightage saves. These must be valid before saving.

## 25.4 Confirmation Dialogs
1. Any destructive action (delete, force-close, bulk delete) requires a confirmation dialog.
2. Confirmation dialogs display the impact of the action (e.g., "This will delete 3 cycles and recalculate [KPI Name] monthly percent").
3. Confirmation dialogs have explicit Confirm and Cancel buttons. They do not auto-confirm.

## 25.5 API Error Response Shape
All API errors follow this structure:
```json
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Human-readable description",
    "fields": [
      { "field": "weightage", "message": "KPI weightages must sum to 100. Current sum: 95." }
    ]
  }
}
```
The `fields` array is present for field-level validation errors and absent for non-field errors.

---

<div style="page-break-before: always;"></div>

# Part 26
# 26. Security and Compliance

## 26.1 Organisation Isolation
1. All data access is scoped to the single organisation constant.
2. organisation_id is never accepted from client inputs.

## 26.2 Access Attempt Handling
1. Unauthorized access returns HTTP 403 and the server logs the attempt.
2. BoD Admin write attempts are rejected server-side with HTTP 403.

## 26.3 Authentication
1. BetterAuth manages session creation, validation, and invalidation.
2. Session tokens are HTTP-only cookies.
3. CSRF protection is enforced on all state-changing routes.

## 26.4 Input Sanitization
1. All user inputs are sanitized and validated via Zod schemas before reaching the Service layer.
2. SQL injection is prevented by Drizzle ORM's parameterized queries.

## 26.5 Sensitive Data
1. Passwords are hashed and never stored in plaintext.
2. Passwords, tokens, and session secrets are never logged or included in error responses.

---

<div style="page-break-before: always;"></div>

# Part 27
# 27. Performance and Indexing

## 27.1 Pagination Requirements
1. All list endpoints are paginated using cursor-based pagination.
2. Unbounded queries (no LIMIT) are forbidden.
3. Default page size: 25. Maximum page size: 100.

## 27.2 Required Indexes
Primary Indexes (required on all tables).
1. organisation_id
2. created_at
3. id (primary key)

Domain-Specific Indexes.
1. employees: manager_id, status, user_id
2. objectives: employee_id, fiscal_year, month, status, deleted_at
3. kpis: objective_id, metric_type, kpi_state, deleted_at
4. kpi_cycles: kpi_id, state, cycle_start_date, cycle_end_date
5. kpi_submissions: kpi_cycle_id, state, created_at
6. pms_reviews: employee_id, status, period_type, fiscal_year
7. in_app_notifications: recipient_user_id, status, created_at
8. kpi_library_templates: status, metric_type
9. objective_mappings: parent_objective_id, child_objective_id, deleted_at

Composite Indexes.
1. objectives: (organisation_id, employee_id, fiscal_year, month) — for monthly objective fetch
2. kpi_cycles: (organisation_id, kpi_id, state) — for approval gating check
3. pms_reviews: (organisation_id, employee_id, period_type, fiscal_year, period) — for eligibility check

---

<div style="page-break-before: always;"></div>

# Part 28
# 28. Testing and Verification

## 28.1 Required Test Categories
Every feature is incomplete without tests in all applicable categories below.

1. RBAC Tests: Verify that every role-permission combination returns the correct HTTP response (200, 403, 409, etc.) for every endpoint. BoD Admin write-attempt tests are mandatory.
2. State Machine Tests: Verify every valid transition succeeds and every invalid transition returns HTTP 409.
3. Calculation Tests: Unit tests for every formula function with documented inputs and expected outputs. Must include edge cases: division by zero, all-null months, overshoot (c_percent > 100), CUMULATIVE running total within month, and empty cycle list.
4. Weightage Tests: Verify that saves are blocked when sum ≠ 100, that Auto Split produces exactly 100, and that rounding delta is applied to the last objective.
5. Three-Submission Rule Tests: Verify that the fourth submission returns 409, that submission_count increments correctly, and that the max-iterations notification is sent.
6. KPI Timeline Tests: Verify WEEKLY cycle generation (correct start/end dates, shortened final cycle), MONTHLY cycle generation (single cycle spanning full range), and timeline lock after first submission.
7. Cumulative KPI Tests: Verify S is always 0, aggregation is always SUM, target type is always FIXED, running total percent display, and monthly KPI percent formula.
8. Objective Mapping Tests: Verify single parent constraint, circular mapping detection and exclusion, and correct score propagation.
9. PMS Review Tests: Verify eligibility gating (blocking conditions and warnings), snapshot immutability, status transitions, and immutability of closed reviews.
10. Bulk Operation Tests: Verify atomicity of Excel import (all-or-nothing), bulk initiation partial success behavior, and bulk delete blocking rules.
11. Force Close Tests: Verify correct cycle state handling, NULL exclusion from calculations, and force-closed months remaining in cadence.
12. Organisation Scoping Tests: Verify that all queries include organisation_id and that no data is accessible without it.
13. Excel Import Validation Tests: Verify every validation rule listed in Section 12.7 including mismatched references, weightage constraint violations, and CUMULATIVE-specific rules.

---

<div style="page-break-before: always;"></div>

# Part 29
# 29. Custom RBAC — Phase 2 Reserved

## 29.1 Deferral Statement
Custom RBAC (Full Permission Matrix) is deferred to the final development phase of V1 and must not be implemented in earlier phases. This section reserves the specification placeholder.

## 29.2 Planned Scope (Non-Authoritative — Subject to SSoT Update Before Implementation)
1. Admin will be able to define custom roles in addition to the three built-in roles (Admin, Manager, Employee).
2. Each role will have a permission matrix: for each module (People Management, Objectives & KPI, Approvals, PMS Review, KPI Library, Executive Summary), permissions can be toggled at the level of View, Create, Edit, Delete.
3. Custom roles are assigned to Users by Admin.
4. Built-in roles (Admin, Manager, Employee, BoD Admin) retain their fixed permissions defined in Part 3 and cannot be modified by the Custom RBAC system.

## 29.3 Implementation Constraint
Before Custom RBAC is implemented, this section must be expanded into a fully normative specification with all rules, state machines, UI contracts, and schema additions. No implementation may proceed from this placeholder section.

---

<div style="page-break-before: always;"></div>

# Part 30
# 30. SSoT Governance and Change Control

## 30.1 SSoT as Sole Authority
1. This SSoT V1.0 is the only authoritative document for THE COMPASS Single-Tenant Edition.
2. All prior documents (SSoT V1.1, V1.2, Grok planning conversation, Excalidraw sketches) are archived and non-authoritative.

## 30.2 Change Control
1. During active V1 development, changes may be captured in a controlled change log and reconciled into the next SSoT minor update.
2. Any behavior change requires a versioned SSoT update before implementation begins.
3. No implementation may proceed from this document's "deferred" or "non-authoritative" sections without a versioned update first.

---

<div style="page-break-before: always;"></div>

# Part 31
# 31. Glossary

1. **Organisation**: The single root entity of the system. There is exactly one Organisation per deployment.
2. **organisation_id**: A constant UUID present on every table. Used for forward-compatibility with future multi-tenant migration.
3. **Admin**: Role with full access within the organisation. Includes BoD Admins with executive_label.
4. **BoD Admin**: An Admin user with executive_label = TRUE. Has read-only access to the Executive Summary only.
5. **Manager**: Role responsible for approving KPIs for direct reports.
6. **Employee**: The performance subject whose KPIs are tracked.
7. **Objective**: A strategic goal assigned to an Employee for a specific month.
8. **KPI**: Key Performance Indicator measured under an Objective.
9. **KPI Cycle**: The execution record for a KPI in a defined date range within a month.
10. **KPI Submission**: A workflow record capturing each state transition of a KPI Cycle.
11. **Cadence**: A time aggregation unit — Month (writable), Quarter, Half-Year, Annual (derived, read-only).
12. **OEM**: Overall Employee Monthly score.
13. **OEQ**: Overall Employee Quarterly score.
14. **OEH**: Overall Employee Half-Yearly score.
15. **OEA**: Overall Employee Annual score.
16. **LAUNCHED**: Objective state before any KPI exists.
17. **ONGOING**: Objective state with at least one KPI, not all cycles approved.
18. **COMPLETED**: Objective state when all KPI cycles are approved.
19. **DRAFT**: State where data is editable and not yet submitted.
20. **SUBMITTED**: State where a KPI cycle is awaiting approval.
21. **APPROVED**: State where a KPI cycle has been approved.
22. **REJECTED**: State where a KPI cycle has been returned for revision.
23. **CANCELLED_BY_SYSTEM**: Terminal state assigned by the system under defined conditions.
24. **LOCKED**: State where KPI cycles are approved and no further edits are allowed.
25. **IMMUTABLE**: Permanent read-only state triggered by PMS Review snapshot creation.
26. **PMS Review**: Terminal performance review artifact containing snapshot and ratings.
27. **Snapshot**: Immutable capture of calculated performance data at PMS Review initiation.
28. **Force Close**: Admin action that terminates a month's execution, applying force-close cycle handling rules.
29. **Batch Approval**: A single approval action applying to all cycles of one KPI within one month.
30. **Auto Split**: Weightage distribution that assigns equal weights to all objectives for an Employee in a month.
31. **Mapped Objective (Child)**: An Objective whose score contributes to a parent Objective's calculation.
32. **Parent Objective**: An Objective that incorporates mapped child Objective scores in its calculation.
33. **Circular Mapping**: A mapping configuration where Objectives form a loop.
34. **KPI Library**: A repository of reusable KPI definition templates managed by Admin.
35. **CUMULATIVE KPI**: A metric type where each cycle records an incremental actual value. The monthly percent is based on the running total within the month vs the monthly target.
36. **Hall of Fame**: Two ranked lists on the Executive Summary: Most Consistent Performers and Top Annual Performers.
37. **Executive Summary**: Read-only dashboard for Admin and BoD Admin showing organisation-wide performance insights.
38. **Soft Delete**: Logical deletion that hides a record from UI while preserving it in the database (sets deleted_at).
39. **Hard Delete**: Physical deletion from the database. Applies to KPI Cycles only, by Admin.
40. **Vertical Slice**: A complete feature implementation from schema through service through UI in a single development unit.
41. **executive_label**: A boolean flag on the users table that identifies BoD Admin users. Restricts access to Executive Summary read-only.

---

<div style="page-break-before: always;"></div>

# Part 32
# 32. Appendices (Non-Authoritative)

## 32.1 Appendix A — Formula Quick Reference
Non-authoritative summary. Authoritative formulas are in Section 4.4.
1. INCREASE: c_percent = ((A − S) / (T − S)) × 100.
2. DECREASE: c_percent = ((S − A) / (S − T)) × 100.
3. CONTROL: c_percent = 100 if min(S,T) ≤ A ≤ max(S,T), else 0.
4. CUMULATIVE: MonthlyKPIPercent = (sum of all cycle A_i / T) × 100. S is always 0. No per-cycle formula; the monthly formula is applied to the running total.
5. OEM = sum(ObjectivePercent_k × W_k) / 100.
6. OEQ = sum(OEM_mi for 3 months) / N (valid months).
7. OEH = sum(OEM_mi for 6 months) / N.
8. OEA = sum(OEM_mi for 12 months) / N.

## 32.2 Appendix B — State Machine Summary
Non-authoritative summary. Authoritative state machines are in Parts 6, 7, 9, and 14.
1. Objective states: LAUNCHED → ONGOING → COMPLETED → (DELETED).
2. KPI states: DRAFT → ACTIVE → LOCKED → IMMUTABLE.
3. KPI Cycle states: DRAFT → SUBMITTED → APPROVED → LOCKED; or → REJECTED → SUBMITTED; or → CANCELLED_BY_SYSTEM (terminal).
4. PMS Review states: INITIATED → MANAGER_REVIEW_PENDING → MANAGER_SUBMITTED → ADMIN_REVIEW_PENDING → CLOSED.

## 32.3 Appendix C — Error Code Reference
Non-authoritative summary. HTTP status codes and error codes used throughout this document.
1. HTTP 400 + VALIDATION_FAILED: Field-level or data validation failure.
2. HTTP 400 + WEIGHTAGE_SUM_INVALID: Weightages do not sum to 100.
3. HTTP 400 + TARGET_EQUALS_STANDARD: KPI target equals standard for INCREASE or DECREASE or CUMULATIVE.
4. HTTP 400 + CONTROL_STANDARD_EXCEEDS_TARGET: CONTROL KPI has S > T.
5. HTTP 403 + PERMISSION_DENIED: Role does not have authority for this action.
6. HTTP 403 + UNAUTHORIZED_APPROVAL_ATTEMPT: Approval attempt for a non-direct-report.
7. HTTP 403 + IMMUTABILITY_VIOLATION: Attempt to modify immutable data.
8. HTTP 403 + DERIVED_CADENCE_IMMUTABLE: Attempt to write to a derived cadence.
9. HTTP 409 + INVALID_STATE_TRANSITION: State transition not permitted.
10. HTTP 409 + MAX_SUBMISSIONS_EXCEEDED: Fourth submission attempt.
11. HTTP 409 + CHILD_ALREADY_MAPPED: Child Objective already has a parent mapping.
12. HTTP 409 + OBJECTIVE_DUPLICATION_BLOCKED: Target context already has an identical Objective.
13. HTTP 412 + PRECONDITION_FAILED: Required precondition (e.g., all cycles have actual values) not met.

## 32.4 Appendix D — 8-Week Development Timeline (Reference)
Non-authoritative schedule. Start date: April 20, 2026.

| Week | Focus |
|---|---|
| Week 1 (Apr 20) | Setup: SvelteKit 2 + Drizzle + BetterAuth + Neon + Vercel CI. Auth flows. Base schema. |
| Week 2 (Apr 27) | People Management: Org-chart, Users table, Create/Edit/Deactivate, Bulk ops. |
| Week 3 (May 4) | Objectives & KPI Setup: Objective CRUD, KPI CRUD, Weightage model, Master/Team/My View tabs. |
| Week 4 (May 11) | KPI Cycles & Submission: Timeline calendar, cycle generation, Employee data entry, 3-submission rule. |
| Week 5 (May 18) | Approvals & Objective Mapping: Pending Approvals view, batch approve/reject, Mapping tree view. |
| Week 6 (May 25) | PMS Review: Eligibility gating, snapshot creation, Manager+Admin review workflow, closure. |
| Week 7 (Jun 1) | KPI Library + Executive Summary + Hall of Fame. Bulk Operations (Import/Clone/Move/Delete). |
| Week 8 (Jun 8) | Custom RBAC (Phase 2 build). Derived cadence views. QA sweep. PDF export. Final polish + deploy. |

---

<div style="page-break-before: always;"></div>

# Part 33
# 33. Version History

1. **Version 1.0** — Effective April 20, 2026.
   Single-Tenant Edition. Supersedes all prior SSoT versions and planning artifacts.
   Key changes from multi-tenant SSoT V1.2:
   - Removed: Super Admin role, multi-tenancy, tenant_id, cross-tenant isolation.
   - Removed: Acting Manager Delegation (deferred to Phase 2).
   - Removed: Audit Logging (deferred from V1 entirely).
   - Added: CUMULATIVE metric type with running-total-within-month formula.
   - Added: BoD Admin (executive_label) role variant.
   - Added: KPI Library with template management and bulk apply.
   - Added: Executive Summary with Leaderboard, Status Distribution, and Hall of Fame (two lists).
   - Added: Bulk Operations in Objectives & KPI (Clone, Move, Delete, Import, Export), KPI Library (Bulk Apply), and PMS Review (Bulk Initiate).
   - Added: KPI Timeline defined by Admin/Manager with auto-generated cycles.
   - Added: organisation_id on every table (constant value, forward-compat).
   - Added: Custom RBAC placeholder (deferred to final development phase).
   - Added: Excel Import with two-sheet format specification and atomic validation.
   - Added: Hall of Fame — Most Consistent Performers and Top Annual Performers.
   - Added: Fiscal year configurable at setup (APRIL or JANUARY start).
   - Updated: Error display rules — inline for validation, toast only for network/server errors.
   - Locked: Tech stack (SvelteKit 2 + TypeScript, Drizzle + Neon, BetterAuth, shadcn-svelte Claymorphism, Vercel).

---

<div style="page-break-before: always;"></div>

# Part 34
# 34. Final Authority Statement

This document — THE COMPASS Single-Tenant Edition SSoT V1.0, effective April 20, 2026 — is the final and sole authority for THE COMPASS. Any conflict between this document and any other artifact (including design mockups, Excalidraw sketches, planning conversations, or prior SSoT versions) is resolved in favor of this document. Any change to system behavior requires a versioned update to this document before implementation begins. If a behavior is not written here, it does not exist and must not be implemented.
