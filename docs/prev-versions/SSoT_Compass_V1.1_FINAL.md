THE COMPASS — Single-Tenant Edition
Single Source of Truth (SSoT)
Version: 1.1-FINAL — PRODUCTION-READY FOR AI-DRIVEN DEVELOPMENT
Status: Authoritative — All Patches Applied — Zero Ambiguity Target
Effective Date: April 23, 2026
Audience: AI Engineering Agents | Engineering | QA | Product

PRODUCTION CLEARANCE: This document has undergone a spec-freeze verification pass. All internal contradictions, schema mismatches, scope-bleed items, and ambiguous rules identified in the V1.1_LOCKED audit have been resolved. Development may commence.

AI READINESS: This SSoT is structured for purely AI-driven implementation: explicit state machines, complete schema, locked API contracts, formula sheets, error code registry, and test verification checklists are all included.

LOCK STATEMENT: This document is the result of a 3-day spec-freeze pass plus a production verification audit. Every decision in this document is final. No behavior is inferred. No question is deferred without explicit deferral notation. V1 exclusions are explicitly listed in Part 0.5 and marked throughout the document.

INDEX

Foundations
Part 0 — Authority, Interpretation & Decision Record
Part 1 — Core Principles & Invariants
Part 2 — Domain Model (Entities & Relationships)
Part 3 — Roles & Permissions

Execution Model
Part 4 — Time, Cadence, Timezone & Calculations
Part 5 — Navigation & Views
Part 6 — Objectives
Part 7 — KPIs
Part 8 — Weightage
Part 9 — KPI Cycles & Submission
Part 10 — Approvals
Part 11 — Objective Mapping
Part 12 — Duplication & Bulk Operations

Reviews & Performance Closure
Part 13 — PMS Review Eligibility
Part 14 — PMS Review Workflow
Part 15 — Post-Review Immutability

People & Operational Controls
Part 16 — People Management Lifecycle
Part 17 — Month Force Close

User Experience & Reporting
Part 18 — Status Indicators & Ratings
Part 19 — Search, Ordering, Pagination & Exports
Part 20 — Notifications
Part 21 — KPI Library (V2 Placeholder)
Part 22 — Executive Summary & Hall of Fame (V1 UI / V2 PDF)

Locked Engineering Contracts
Part 23 — Architecture Guardrails
Part 24 — Database Schema (Complete)
Part 25 — State Machine Tables (Explicit Transition Tables)
Part 26 — Calculation Formula Sheet (Complete)
Part 27 — API Contract (Locked Endpoints)
Part 28 — Error Handling & UX Contracts
Part 29 — Security & Compliance
Part 30 — Performance, Indexing & Concurrency
Part 31 — Testing & Verification
Part 32 — Custom RBAC (Phase 2 — Reserved)

Governance
Part 33 — SSoT Governance
Part 34 — Glossary
Part 35 — Appendices (Non-Authoritative)
Part 36 — Version History
Part 37 — Final Authority Statement

================================================================================
PART 0 — AUTHORITY, INTERPRETATION & DECISION RECORD
================================================================================

0.1 Nature and Purpose
This document is the sole, complete, and authoritative specification of THE COMPASS Performance Management System — Single-Tenant Edition. It is the result of a spec-freeze pass that answers every architectural and behavioral question before development begins. Every behavior, formula, state machine, API contract, permission, and constraint is derived exclusively from this document.

0.2 Single Source of Truth Principle
One document. One owner per concept. Zero duplication. Internal cross-references are allowed. Duplication is a defect. Appendices are non-authoritative.

0.3 Precedence Order
1. Core Principles and Invariants (Part 1)
2. Entity and Authority Models (Parts 2–3)
3. Lifecycle and Workflow Rules (Parts 4–22)
4. Engineering Contracts (Parts 23–31)
5. Appendices (Part 35) — non-authoritative

0.4 Single-Tenant Declaration
Single organisation per deployment. organisation_id is a constant UUID on every table — never accepted from client inputs — present exclusively for future multi-tenant migration.

0.5 Deferred Features (V1 Exclusions)
The following are explicitly out of scope for V1 and must not be implemented:
1. Email Notifications — in-app only. No email delivery infrastructure.
2. Dark Mode — UI uses light theme only.
3. PDF Export — Executive Summary UI exists but PDF generation is deferred.
4. KPI Library — no schema, no service, no UI, no routes (see Part 21 placeholder).

The following are also not V1 features but require no special implementation because they are adequately handled by existing V1 mechanisms:
- Audit trail: submission history table (kpi_submissions) serves as the operational audit trail for submission events. Admin action audit uses system_events (Part 24.16).
- Real-time updates: client polling only (30-second interval). No WebSockets/SSE.
- Custom RBAC: deferred to Phase 2 (Part 32). Built-in roles only in V1.
- Virus scanning: not required. Vercel edge handles basic upload security.

0.6 Locked Decision Record (78 Questions — All Answered)
Every decision below is final. Cross-referenced sections provide full elaboration.

#   Question                                    Decision                                              Rationale                                                Ref
--- ------------------------------------------- ----------------------------------------------------- -------------------------------------------------------- -------------------
1   System of record                            Hybrid: Cycles = current state, Submissions = history Clean separation of truth vs audit trail                  §2.1
2   Consistency model                           Strict ACID via database transactions                 Performance systems require deterministic accuracy       §1.2
3   Derived values authoritative                No — always recalculated from source                  Prevents data divergence                                 §1.4
4   Auditability mandatory                      Partial — submission history is the audit trail in    Performance systems require dispute resolution           §9, §24.7
                                                V1; system_events for admin actions; full audit log   capability; full UI deferred                             §24.16
                                                UI is Phase 2
5   Business rules retroactive                  Forward-only                                          Prevents historical record corruption                    §0.5
6   One config per org                          Yes — enforced, one row in organisation_config        Avoids ambiguity                                         §24.13
7   Fiscal year handling                        Computed from fiscal_year_start (APRIL or JANUARY)    Simpler, no lookup table required                        §4.2
8   Fiscal year start can change                No — immutable after initialization                   Retroactive changes corrupt historical cadence data    §1.1
9   Timezone handling                           Org timezone stored on organisation table; all          Correct for a single-org system with defined locale      §4.3, §24.1
                                                business dates computed in org timezone; all DB
                                                timestamps stored in UTC
10  Multi-org support                           Single org V1 with organisation_id constant for       Scope boundary                                           §0.4
                                                migration readiness
11  KPIs versioned                              Soft versioning via immutability trigger on first       Prevents retroactive change; no separate version table   §7.4
                                                submission                                            required
12  KPI definition change mid-cycle             Future cycles only — once any cycle is SUBMITTED,     Preserves integrity of submitted data                    §7.4
                                                definition is locked
13  KPI units                                   Free-text label (e.g. "calls", "Rs lakhs", "%").      Organisations have diverse measurement units             §24.5
                                                Stored as unit on KPI. Not enforced as enum
14  KPI target types                            FIXED and CUSTOM (range is expressed as CONTROL       Covers all required patterns                             §7.1
                                                metric type)
15  KPIs reusable                               Deferred to V2 — KPI Library stores templates         V1 exclusion                                             §0.5, §21
16  Cycle granularity                           Configurable: WEEKLY or MONTHLY                       Required feature                                         §7.3
17  Cycles overlap                              No — cycle date ranges within a KPI must be           Prevents double-counting                                 §7.3
                                                non-overlapping. Enforced at cycle generation
18  Cycle ownership                             Employee enters data; Admin/Manager defines timeline  Correct authority model                                  §3
19  Cycle creation                              Auto-generated by system when timeline is defined     Deterministic and prevents manual inconsistency          §7.3
20  Cycles deletable                            Hard delete by Admin only with confirmation             KPI Cycles are the only entity supporting hard delete    §9.6
21  Cycle states                                Fully explicit: DRAFT, SUBMITTED, APPROVED,           No ambiguous transitions                                 §25.1
                                                REJECTED, CANCELLED_BY_SYSTEM, LOCKED
22  LOCKED state                                Yes — included                                        Required for PMS immutability                            §25.1
23  LOCKED trigger                              PMS Review snapshot creation                          Terminal lock tied to formal review                      §25.1
24  LOCKED revert                               No — LOCKED and IMMUTABLE are terminal                PMS Reviews are terminal artifacts                       §1.3
25  Resubmission                                Conditional — allowed up to 3 times per cycle; 4th    Prevents infinite loop while allowing correction         §9.5
                                                attempt blocked
26  Rejection handling                          Cycle returns to REJECTED state; Employee may re-     Clean re-entry pattern                                   §9.4
                                                enter actual value and resubmit
27  Parallel approvals                          No — single approving manager per cycle               Prevents ambiguity on approval authority                 §10.1
28  Approval authority                          Single manager with Admin override                    Sufficient for single-org model                          §10
29  Force close behavior                        Skip LOCKED and APPROVED cycles; cancel SUBMITTED     Preserves approved work                                  §4.4.7
                                                and REJECTED
30  State stored                                Cycles hold current state (denormalized);              Query performance + history                              §2.1
                                                Submissions hold full history
31  Submission type                             Immutable — append-only records                       Audit integrity                                          §2.1
32  Submission purpose                          History / state-change trail                          Not current state authority                              §2.1
33  Duplicate submissions                       Idempotent — same state + same actor within 5         Prevents double-click duplicates                         §9.1
                                                seconds returns the existing submission record
                                                without creating a duplicate
34  Submission versioning                       Yes — each state change creates a new KPI Submission  Append-only audit trail                                  §24.7
                                                record. The latest record is canonical
35  Submission edits                            Never — submissions are immutable once created        Audit integrity                                          §2.1
36  Derived fields storage                      Hybrid: achievement_percent is cached on KPI Cycle      Read performance + correctness                           §26.5
                                                for query performance; it is non-authoritative and
                                                recalculated on demand
37  Running totals                              Computed on read from cycle actuals                   Prevents stale cached totals                             §26.1
38  NULL vs 0                                   Different and always distinct: NULL = no data         Critical for correct exclusion logic                     §26.2
                                                entered; 0 = explicit zero entry
39  Partial month inclusion                     Conditional: see force-close rules                    §4.4.7                                                   §4.4.7
40  Force-closed NULL handling                  Include in cadence with NULL contribution               Month still counts; NULL objectives excluded from score  §4.4.7
41  Calculation engine location                 Backend service layer — pure functions only; never      Determinism + testability                                §23.6
                                                in DB, never in frontend
42  Recalculation trigger                       On read (computed on demand); derived values are      Simplest correct model                                   §23.6
                                                never stale because they are never stored as
                                                authoritative
43  Snapshot calculations                       Yes — immutable snapshot taken at PMS Review            Required for PMS immutability                            §14.1
                                                initiation
44  PMS initial state                           MANAGER_REVIEW_PENDING (INITIATED is the creation     Clean single active state                                §14.2
                                                event, status immediately transitions to
                                                MANAGER_REVIEW_PENDING)
45  Snapshot timing                             On initiation                                         Must capture state before reviews begin                    §14.1
46  Snapshot mutability                         Immutable — once written, snapshot_json is never        PMS is a legal artifact                                  §1.3
                                                updated
47  Review rollback                             Not allowed — no role can reopen a CLOSED PMS Review  Terminal by design                                       §15.3
48  Pagination type                             Cursor-based                                          Stable across concurrent inserts                           §27.3, §30.1
49  Cursor format                               Base64-encoded composite of (created_at ISO string    Stable and opaque to client                              §30.1
                                                + ":" + id)
50  API idempotency                             Yes — state-changing endpoints accept optional          Prevents double submission on network retry              §27.2
                                                Idempotency-Key header (UUID). Same key returns
                                                cached response for 24 hours
51  Error format                                Structured JSON with code, message, fields array      Deterministic client handling                            §28.5
52  API versioning                              URL prefix: /api/v1/                                  Simple and explicit                                      §27.1
53  Rate limiting                               Yes — 100 req/min per authenticated user; 20 req/min  Prevents abuse                                           §29.4
                                                for import endpoints
54  Import file types                           Excel (.xlsx) only — two-sheet format                 Specified in §12.7                                       §12.7
55  Validation timing                           Post-upload, pre-write — full file parsed and         Supports atomic import                                   §12.7
                                                validated before any DB write
56  Max import file size                        10MB default; configurable in organisation_config     Reasonable for expected data volume                      §24.13
57  Partial import success                      Fail-all — atomic import per Invariant 1.8           Prevents inconsistent weightage state                    §1.8
58  Import retry                                Yes — upload returns an import_job_id; same file can  Safe retry                                               §12.8
                                                be re-uploaded idempotently using the same job_id
59  Virus scanning                              No — out of scope for V1. Vercel's edge handles       Deferred                                                 §0.5
                                                basic security
60  Notification delivery                       Polling — client polls /api/v1/notifications?         No SSE/WebSocket in V1                                   §20
                                                status=UNREAD on a 30-second interval
61  Read tracking                               Yes — individual mark-as-read                         §20                                                      §20
62  Bulk read                                   Yes — mark-all-as-read endpoint                         §20                                                      §20
63  Permission model                            RBAC — role-based, enforced server-side               §3                                                       §3
64  Field-level permission                      No — not in V1                                        §0.5                                                     §0.5
65  Role hierarchy                              Hierarchical: Admin > Manager > Employee (BoD Admin   §3                                                       §3
                                                is a restricted Admin variant)
66  Backend                                     Node/TypeScript via SvelteKit 2 server routes         Locked tech stack                                        §23.1
67  Database                                    PostgreSQL (Neon serverless)                            Locked tech stack                                        §23.1
68  ORM                                         Drizzle ORM                                             Locked tech stack                                        §23.1
69  Frontend                                    SvelteKit 2 + Svelte 5 runes + TypeScript               Locked tech stack                                        §23.1
70  Hosting                                     Vercel (compute) + Neon (database)                      Locked tech stack                                        §23.1
71  Audit scope                                 V1: submission history table as operational audit      §24.7                                                    §24.7
                                                trail. system_events table for admin actions.
                                                Full audit log UI deferred
72  Log retention                               Submission history: permanent (never deleted).          No time-bound deletion in V1                             §24.7
                                                Organisation data: retained for duration of
                                                deployment
73  Audit format                                Relational tables (kpi_submissions, system_events)      Query-friendly                                             §24.7
74  All-NULL month                              Conditional: force-closed = include; not force-       §4.4.7                                                   §4.4.7
                                                closed = exclude from cadence denominator
75  Duplicate cycle                             Prevented — cycles are system-generated from           §7.3                                                     §7.3
                                                timeline. No two cycles within the same KPI overlap
76  Concurrent edits                            Optimistic locking via version integer column on       Prevents lost updates                                      §30.2
                                                mutable entities. Client sends current version;
                                                server rejects if version mismatch (HTTP 409 +
                                                CONCURRENT_MODIFICATION)
77  Time boundary errors                        Strict validation — timeline dates must be within      §7.3                                                     §7.3
                                                the declared month; cross-month timelines are blocked
78  Missing required data                       Error — HTTP 400 + VALIDATION_FAILED with field-       §28                                                      §28
                                                level detail

================================================================================
PART 1 — CORE PRINCIPLES AND NON-NEGOTIABLE INVARIANTS
================================================================================

1.1 Invariant One — Monthly Write, Derived Read
Month is the only writable cadence unit. Quarter, Half-Year, and Annual are derived and read-only. Fiscal year configuration is immutable after initialization. API endpoints for derived cadences reject write attempts with HTTP 403 + DERIVED_CADENCE_IMMUTABLE.

1.2 Invariant Two — Strict ACID Transactions
Every state change runs inside a single database transaction. No partial state is permitted. If any operation in a transaction fails, the entire transaction rolls back. Eventual consistency is not used anywhere in this system.

1.3 Invariant Three — PMS Review is Terminal
Once a PMS Review reaches CLOSED state, it is permanently immutable. No role may reopen, edit, or delete it. Snapshot data is write-once. Violation returns HTTP 403 + IMMUTABILITY_VIOLATION.

1.4 Invariant Four — System-Derived Data is Non-Authoritative
Calculated values (OEM, OEQ, OEH, OEA, KPI percent, achievement_percent) are never the source of truth. They are always recalculated from base data on demand. Cached values (e.g., achievement_percent on kpi_cycles) are performance hints only and must be recalculated from source before any decision depends on them.

1.5 Invariant Five — Organisation Scoping
Every table contains organisation_id. Every query includes the server-side organisation constant. organisation_id is never accepted from client input. Violation is a SEV-1 defect.

1.6 Invariant Six — No Inference, No Invention
If a behavior is not written in this document, it does not exist. Undocumented behaviors are change requests requiring a versioned SSoT update before implementation.

1.7 Invariant Seven — Weightage Always Sums to 100
Objective weightages per Employee per Month must equal exactly 100.00. KPI weightages per Objective must equal exactly 100.00. Service layer enforces this before any save. API returns HTTP 400 + WEIGHTAGE_SUM_INVALID on violation.

1.8 Invariant Eight — Excel Import is Atomic
Import either fully succeeds or fully fails. No partial writes. Full validation runs before any database write. The entire import is wrapped in a single transaction. On any failure, the complete error list is returned with row numbers.

1.9 Invariant Nine — NULL is Not Zero
NULL means no data has been entered. 0 (zero) means an explicit zero value was entered. These must never be treated identically in any calculation, display, or exclusion logic. A cycle with actual_value = NULL is excluded from aggregations. A cycle with actual_value = 0 is included.

1.10 Invariant Ten — Optimistic Locking on All Mutable Entities
All mutable entity tables include a version integer column (default 1). Every update operation must receive and match the current version. If the version in the request does not match the stored version, the update is rejected with HTTP 409 + CONCURRENT_MODIFICATION. On successful update, version is incremented by 1.

1.11 Invariant Eleven — Idempotent State-Change Operations
All state-changing API endpoints accept an optional Idempotency-Key header (UUID v4). If a request is received with a previously used Idempotency-Key from the same user within 24 hours, the server returns the cached response without re-processing. This applies to: submit, approve, reject, force-close, PMS initiate, PMS manager-review, PMS admin-review.

1.12 Invariant Twelve — Forward-Only Business Rules
Calculation formulas and business rule changes take effect from the next write operation forward. Closed PMS Reviews, locked cycles, and historical snapshots are never retroactively affected by rule changes.

================================================================================
PART 2 — DOMAIN MODEL
================================================================================

2.1 Entity Definitions

Entity: Organisation
- One row per deployment.
- Stores: name, fiscal_year_start (APRIL | JANUARY), timezone (IANA string, e.g. "Asia/Kolkata"), status (ACTIVE | DEACTIVATED).
- Fiscal year start is immutable after initialization.
- Timezone is the reference for all date computations. DB timestamps are UTC.

Entity: User
- One User per login credential.
- full_name: VARCHAR(255), required.
- Role: ADMIN | MANAGER | EMPLOYEE.
- executive_label (boolean): TRUE for BoD Admins. Restricts to Executive Summary read-only.
- Status: ACTIVE | DEACTIVATED. Deactivated users cannot log in; their records and performance history are preserved.
- Unique: email and username per organisation.

Entity: Employee
- One Employee per User (not all Users have an Employee profile).
- Attributes: full_name, employee_code (unique per org), department, division, business_unit, location, designation, date_of_joining, date_of_birth, gender.
- Exactly one reporting manager (manager_id), except top of hierarchy (NULL).
- department, division, business_unit, location, designation must exist in tenant_attribute_values.
- business_unit values are dependent on division.

Entity: Objective
- Belongs to: Employee, fiscal_year (integer), month (1–12), organisation.
- Type: RC | CO | OE | OTHERS.
- weightage: numeric(5,2). Must participate in per-Employee-per-Month sum = 100.
- Status: system-derived (LAUNCHED | ONGOING | COMPLETED | DELETED).
- version: for optimistic locking.

Entity: KPI
- Belongs to: Objective.
- Properties: title, description, unit (free-text label, nullable), metric_type (INCREASE | DECREASE | CONTROL | CUMULATIVE), target_type (FIXED | CUSTOM — CUMULATIVE is always FIXED), standard (0 for CUMULATIVE), target, aggregation_method (SUM | AVERAGE — CUMULATIVE is always SUM), frequency (WEEKLY | MONTHLY), weightage.
- kpi_state: DRAFT | ACTIVE | LOCKED | IMMUTABLE.
- timeline_start_date, timeline_end_date: set by Admin/Manager. Nullable until defined.
- version: for optimistic locking.

Entity: KPI Cycle
- Generated by system when timeline is defined.
- Belongs to: KPI.
- cycle_start_date, cycle_end_date: system-calculated. Non-overlapping within a KPI.
- standard_value: copied from KPI.standard at generation.
- target_value: copied from KPI.target for FIXED; set per cycle for CUSTOM.
- actual_value: numeric, nullable. NULL = not entered. 0 = explicit zero.
- comments: text, nullable. Employee-entered.
- achievement_percent: numeric, cached (non-authoritative).
- submission_count: integer ≥ 0. Increments on each submit or resubmit. Never decrements.
- state: DRAFT | SUBMITTED | APPROVED | REJECTED | CANCELLED_BY_SYSTEM | LOCKED.
- force_closed: boolean, default FALSE.
- version: for optimistic locking.
- No deleted_at — supports hard delete by Admin only.

Entity: KPI Submission
- Append-only. One row per state-change event on a KPI Cycle.
- kpi_cycle_id: FK to kpi_cycles.
- state: the new state after this event.
- submitted_by, approved_by, rejected_by: FK to users, nullable.
- approval_comment, rejection_comment: text, nullable.
- is_override: boolean, default FALSE.
- created_at: immutable once written.
- Submissions are never updated or deleted.

Entity: Objective Mapping
- Links child Objective to parent Objective.
- child_objective_id: unique constraint — a child may have at most one parent.
- weight_in_parent: numeric(5,2).
- Soft-delete.

Entity: PMS Review
- One per Employee per period_type per fiscal_year per period.
- period_type: QUARTERLY | HALF_YEARLY | ANNUAL.
- snapshot_json: immutable jsonb written at initiation.
- manager_review_json, admin_review_json: jsonb, nullable until submitted.
- status: MANAGER_REVIEW_PENDING | MANAGER_SUBMITTED | ADMIN_REVIEW_PENDING | CLOSED.
- locked_at: timestamptz, set when status = CLOSED.

Entity: In-App Notification
- recipient_user_id, title, message, link_url, status (UNREAD | READ), created_at, read_at.

V2 ENTITY: Not implemented in V1. Schema deferred.

Entity: KPI Library Template
- Reusable KPI definition. Stores all KPI properties except weightage.
- status: ACTIVE | ARCHIVED.
- tags: text array for search.

Entity: Tenant Attribute Value
- type: DEPARTMENT | DIVISION | BUSINESS_UNIT | LOCATION | DESIGNATION.
- parent_value: nullable (used for BUSINESS_UNIT → DIVISION dependency).

Entity: Idempotency Record
- idempotency_key: UUID, unique per user.
- user_id, endpoint, response_body (jsonb), expires_at.
- Used to cache responses for 24 hours per Invariant 1.11.

2.2 Entity Relationships
1. Organisation has many Users.
2. User has at most one Employee.
3. Employee reports to at most one Manager (who is also an Employee).
4. Employee has many Objectives per month per fiscal year.
5. Objective has many KPIs.
6. KPI has many KPI Cycles (system-generated, non-overlapping).
7. KPI Cycle has many KPI Submissions (append-only history).
8. Objective may have one parent Objective via Objective Mapping (child uniqueness enforced).
9. Employee has many PMS Reviews across periods.
10. User has many In-App Notifications.

2.3 Entity Lifecycle Governance
1. All entities except KPI Cycles use soft delete (deleted_at).
2. KPI Cycles: hard delete by Admin only with confirmation.
3. KPI Submissions: never deleted.
4. PMS Review snapshot_json: write-once, never updated.
5. Derived data is never stored as authoritative.

================================================================================
PART 3 — ROLE-BASED AUTHORITY MODEL
================================================================================

3.1 Role Enumeration
1. ADMIN (full org access)
2. ADMIN + executive_label=TRUE (BoD Admin — Executive Summary read-only only)
3. MANAGER (team + self)
4. EMPLOYEE (self only)
5. Custom RBAC roles — deferred to Phase 2 (Part 32)

3.2 Permission Matrix

Action                              Admin   BoD Admin   Manager   Employee
----------------------------------- ------- ----------- --------- ----------
Create/Edit/Delete Users            ✓       ✗           ✗         ✗
Create/Edit Objectives              ✓       ✗           ✗         ✗
Set KPI Timeline                    ✓       ✗           ✓ (direct)  ✗
Enter KPI Actual Values             ✓ (self)  ✗         ✓ (self)    ✓ (self)
Submit KPI Cycles                   ✓ (self)  ✗         ✓ (self)    ✓ (self)
Approve / Reject KPIs               ✓ (all)   ✗         ✓ (direct)  ✗
Override Approval                   ✓       ✗           ✗           ✗
Initiate PMS Review               ✓       ✗           ✗           ✗
Submit Manager Review               ✓       ✗           ✓ (direct)  ✗
Submit Admin Review                 ✓       ✗           ✗           ✗
View own PMS Review               ✓       ✗           ✓           ✓
Force Close Month                 ✓       ✗           ✗           ✗
Delete KPI Cycles                 ✓       ✗           ✗           ✗
Create/Apply KPI Templates        ✓       ✗           ✗           ✗
Bulk Operations                   ✓       ✗           ✗           ✗
Excel Import                      ✓       ✗           ✗           ✗
Export                            ✓       ✗           ✗           ✗
Configure Attributes              ✓       ✗           ✗           ✗
Configure PMS Bands               ✓       ✗           ✗           ✗
View Executive Summary            ✓       ✓           ✗           ✗
View Org-Chart                    ✓       ✓           ✓           ✓
View Team (direct reports)        ✓       ✗           ✓           ✗
View self data                    ✓       ✗           ✓           ✓

3.3 Permission Enforcement Rules
1. All permissions are enforced server-side in the Service layer before any state change.
2. UI disables controls that the role cannot use — but UI state is never trusted.
3. BoD Admin write attempts return HTTP 403 + BOD_WRITE_FORBIDDEN regardless of UI state.
4. Cross-employee access (accessing another employee's data without authority) returns HTTP 403 + PERMISSION_DENIED.
5. All permission-denied events are logged to server application logs (not to a UI-visible audit log in V1).

3.4 Self-Approval Rule
Admin who approves their own KPI cycle is allowed. The approval action is flagged with is_self_approval=TRUE on the KPI Submission record.

================================================================================
PART 4 — TIME, CADENCE, TIMEZONE & CALCULATIONS
================================================================================

4.1 Writable vs Derived Units
Month is the only writable unit. Quarter, Half-Year, and Annual are derived, read-only, and computed from monthly data exclusively.

4.2 Fiscal Year Calendar

APRIL Start:
- Q1: Apr, May, Jun | Q2: Jul, Aug, Sep | Q3: Oct, Nov, Dec | Q4: Jan, Feb, Mar
- H1: Apr–Sep | H2: Oct–Mar
- FY: Apr–Mar

JANUARY Start:
- Q1: Jan, Feb, Mar | Q2: Apr, May, Jun | Q3: Jul, Aug, Sep | Q4: Oct, Nov, Dec
- H1: Jan–Jun | H2: Jul–Dec
- FY: Jan–Dec

Fiscal year label: FY{YYYY-YY} for April start (e.g. FY2025-26); FY{YYYY} for January start (e.g. FY2026).

4.3 Timezone Rules
1. Organisation timezone is stored as an IANA timezone string (e.g. "Asia/Kolkata") in the organisation table (Part 24.1).
2. All business dates (month, fiscal year, cycle dates, timeline dates) are interpreted in org timezone.
3. All timestamps stored in database are UTC.
4. All date comparisons and cycle generation use the org timezone.
5. API responses include dates in ISO 8601 format (YYYY-MM-DD for dates, ISO 8601 UTC for timestamps).
6. "Start of month" means midnight 00:00:00 in org timezone.

4.4 Monthly Structural Snapshots
At the start of each month (first day, org timezone midnight), the system records the org structure state per employee: reporting_manager_id, department, division, business_unit, role. Manager changes mid-month do not affect the approver for that month.

4.5 Calculation Formula Sheet (Complete — Also in Part 26)
This section cross-references Part 26. Part 26 is the canonical formula authority.

4.6 Partial Month Handling and Force Close
Defined fully in Section 4.4.7 of SSoT V1.0. Incorporated here by reference. See Part 26 for the exact NULL vs 0 handling rules.

4.7 Derived Cadence UI Rules
1. Month view is the only writable view.
2. Quarter, Half-Year, and Annual views are read-only.
3. In derived cadence views: no edits, submissions, approvals, or draft saves are permitted.

================================================================================
PART 5 — NAVIGATION AND VIEW HIERARCHY
================================================================================

5.1 Left Sidebar (Role-Gated Visibility)

Item                    Admin   BoD Admin   Manager   Employee
----------------------- ------- ----------- --------- ----------
Home                    ✓       ✓           ✓         ✓
People Management       ✓       ✗           ✗         ✗
Objectives & KPI        ✓       ✗           ✓         ✓
Pending Approvals       ✓       ✗           ✓         ✗
PMS Review              ✓       ✗           ✓         ✓
Executive Summary       ✓       ✓           ✗         ✗
KPI Library (V2)        —       —             —         —

5.2 View Context (Objectives & KPI Module)

View                    Admin   Manager   Employee
----------------------- ------- --------- ----------
Master View (all employees)   ✓       ✗         ✗
Team View (direct reports)    ✓       ✓         ✗
My View (self)                ✓       ✓         ✓

View context never elevates permissions. An Admin in Team View retains Admin permissions.

5.3 Pending Approvals
- Shows all KPI-level approvals awaiting action, grouped by employee then by KPI.
- One batch action per KPI per month.

================================================================================
PART 6 — OBJECTIVES
================================================================================

6.1 Types
RC | CO | OE | OTHERS. All are first-class participants in weightage. Custom titles allowed for all types.

6.2 State Machine
See Part 25.1 for the explicit transition table.

States: LAUNCHED | ONGOING | COMPLETED | DELETED

Valid transitions:
- LAUNCHED → ONGOING: first KPI created under Objective
- ONGOING → COMPLETED: all KPI cycles across all KPIs are APPROVED
- LAUNCHED → DELETED: no execution data (Admin only, with confirmation)
- ONGOING → DELETED: blocked if any KPI has SUBMITTED or APPROVED data
- COMPLETED → ONGOING: Admin reopen with mandatory reason; blocked if covered by closed PMS Review
- DELETED → LAUNCHED: Admin restore, only if no execution data

Invalid transitions (all others): return HTTP 409 + INVALID_STATE_TRANSITION.

6.3 Weightage Constraint
Per Employee per Month: sum of all Objective weightages = 100.00. Enforced at service layer before any save.

6.4 Deletion Rules
- Soft delete only.
- Blocked if any KPI under the Objective has a submitted or approved cycle.
- Restore allowed only if no execution data.

6.5 Incomplete Objective Display
Objectives with zero KPIs display an "Incomplete" badge. This is UI-only and does not block any operation.

================================================================================
PART 7 — KPIS
================================================================================

7.1 Properties (All Required Unless Noted)
- title: varchar(255), required
- description: text, optional
- unit: varchar(50), optional free-text label (e.g. "calls", "Rs lakhs", "units")
- metric_type: INCREASE | DECREASE | CONTROL | CUMULATIVE
- target_type: FIXED | CUSTOM — CUMULATIVE always FIXED (system-enforced)
- standard: numeric — must be 0 for CUMULATIVE (system-enforced)
- target: numeric — must not equal standard for INCREASE/DECREASE; must be > 0 for CUMULATIVE
- aggregation_method: SUM | AVERAGE — CUMULATIVE always SUM (system-enforced)
- frequency: WEEKLY | MONTHLY
- weightage: numeric(5,2) — must participate in Objective-level sum = 100

7.2 CUMULATIVE-Specific Rules (Enforced at KPI Creation)
1. standard = 0 (system sets this; user cannot change it)
2. target_type = FIXED (system sets this; CUSTOM not available for CUMULATIVE)
3. aggregation_method = SUM (system sets this; AVERAGE not available for CUMULATIVE)
4. target > 0 (blocked at creation with HTTP 400 + TARGET_EQUALS_STANDARD if target = 0)
5. CUMULATIVE KPIs are bounded within a single month. Cross-month accumulation is not defined and must not be implemented.

7.3 KPI State Machine
See Part 25.2 for explicit transition table.

States: DRAFT | ACTIVE | LOCKED | IMMUTABLE

7.4 Immutability Triggers
- Standard, Target, metric_type, target_type → immutable on first cycle SUBMITTED
- KPI weightage → immutable when all cycles APPROVED
- All KPI properties → IMMUTABLE when parent Objective is included in a PMS Review snapshot

7.5 Timeline Management
- Admin or Manager sets timeline_start_date and timeline_end_date within one calendar month (org timezone).
- timeline_end_date must be in the same month as timeline_start_date (strict validation).
- Minimum duration: 7 days. Maximum: 31 days.
- On timeline save, system deletes any existing DRAFT cycles and generates new cycles based on frequency.
- If any cycle has been SUBMITTED, timeline is locked. Attempting to redefine returns HTTP 409 + TIMELINE_LOCKED.
- Cycle generation rules:
  - WEEKLY: Cycle 1 = [start, start+6]. Cycle N+1 = [prev_end+1, prev_end+7]. Final cycle takes remaining days (may be < 7).
  - MONTHLY: One cycle = [start, end].

7.6 KPI Units Display
- unit is a free-text label displayed alongside actual_value and target_value in UI.
- Unit has no computational role. It is informational only.
- Example display: "Actual: 4,500 calls | Target: 5,000 calls"

7.7 Target Validation Blocks
- INCREASE: target = standard → HTTP 400 + TARGET_EQUALS_STANDARD
- DECREASE: target = standard → HTTP 400 + TARGET_EQUALS_STANDARD
- CONTROL: standard > target → HTTP 400 + CONTROL_STANDARD_EXCEEDS_TARGET
- CUMULATIVE: target = 0 → HTTP 400 + TARGET_EQUALS_STANDARD (because standard is always 0)
- CUSTOM target, per-cycle: cycle target = standard → HTTP 400 + CYCLE_TARGET_EQUALS_STANDARD at submission time

================================================================================
PART 8 — WEIGHTAGE MODEL
================================================================================

8.1 Objective-Level Constraint
Sum of all Objective weightages for a given Employee in a given Month = exactly 100.00.

8.2 KPI-Level Constraint
Sum of all KPI weightages for a given Objective = exactly 100.00.

8.3 Mapped Objective Constraint
In a parent Objective: sum of (direct KPI weights + mapped child Objective weights) = exactly 100.00.

8.4 Auto Split Algorithm
1. Take N = count of all Objectives for the Employee in the Month.
2. base_weight = floor((100.00 / N) * 100) / 100 (rounded down to 2 decimals).
3. Assign base_weight to all N Objectives.
4. delta = 100.00 − (base_weight × N), rounded to 2 decimals.
5. Add delta to the last Objective in the current list order.
6. Result: sum is exactly 100.00.

8.5 Enforcement
- Service layer validates sum before any save. HTTP 400 + WEIGHTAGE_SUM_INVALID on violation.
- UI displays real-time running total and disables Save until sum = 100.00.
- Import validation checks all weightage groups before any write.

================================================================================
PART 9 — KPI CYCLE EXECUTION AND SUBMISSION
================================================================================

9.1 Data Entry Rules
- Employee enters actual_value (numeric, required for submission, optional for draft save) and comments (text, optional).
- actual_value = 0 is a valid entry. actual_value = NULL means not entered.
- Only the cycle owner (the Employee to whom the Objective belongs) may enter actual values.
- Entry is allowed only when cycle state is DRAFT or REJECTED.

9.2 Submission
1. Employee submits a single cycle.
2. Service validates: actual_value is not NULL, cycle state is DRAFT or REJECTED, submission_count < 3.
3. Service creates a KPI Submission record with state = SUBMITTED.
4. Service updates kpi_cycles.state = SUBMITTED and increments submission_count.
5. Both updates are in one transaction.
6. Idempotency: If the same Idempotency-Key is submitted within 24 hours, return cached response.

9.3 Unsaved Data Warning
UI displays a confirmation dialog if Employee navigates away with unsaved actual_value. Dialog is inline — not a toast. Employee must confirm discard or cancel navigation.

9.4 Three-Submission Rule
- submission_count increments on each submit or resubmit. Never decrements.
- 1st submission: DRAFT → SUBMITTED.
- After rejection: REJECTED → SUBMITTED (submission_count = 2).
- After second rejection: REJECTED → SUBMITTED (submission_count = 3).
- If 3rd submission is rejected: cycle enters REJECTED state with max_submissions_reached = TRUE. Employee cannot resubmit. Only Admin can resolve.
- 4th submission attempt: HTTP 409 + MAX_SUBMISSIONS_EXCEEDED. In-app notification sent to Admin.

9.5 Cycle Deletion (Admin Only)
- Admin must confirm a modal that states: "Deleting this cycle will remove it from [KPI Title] monthly calculation. This cannot be undone."
- Blocked if it is the last cycle for the KPI in that month (HTTP 409 + LAST_CYCLE_DELETION_BLOCKED).
- If last cycle must be removed, Admin deletes the KPI instead.
- Hard delete: removes kpi_cycles row and all kpi_submissions rows for that cycle.

9.6 Idempotency Window
Submit, resubmit, and draft-save endpoints accept Idempotency-Key header. Same key + same user within 24 hours returns cached response without re-processing.

================================================================================
PART 10 — APPROVAL WORKFLOWS
================================================================================

10.1 Batch Approval Model
- Approval occurs at KPI level for a given month — one action covers all eligible cycles.
- Eligible = all cycles in SUBMITTED state that are not CANCELLED_BY_SYSTEM and have actual_value IS NOT NULL.
- If any cycle in the target KPI row has actual_value IS NULL: Approve and Reject controls are hidden in UI; API returns HTTP 412 + PRECONDITION_FAILED.
- If no cycles are in SUBMITTED state: controls are hidden; API returns HTTP 412 + PRECONDITION_FAILED.

10.2 Approval Workflow
1. Manager opens Pending Approvals.
2. Selects a KPI row. Views all cycle summaries and actual values.
3. Enters mandatory comment (10–1000 characters).
4. Selects Approve or Reject.
5. If Approve: all eligible cycles → APPROVED. KPI state → LOCKED (if all cycles approved). KPI Submission records created.
6. If Reject: all eligible cycles → REJECTED. Unlocked for Employee re-entry. Rejection comment visible to Employee.

10.3 Admin Override
- Admin may override any Manager decision (approve or reject) at any time before PMS Review is CLOSED.
- Override requires a mandatory reason.
- KPI Submission record for override: is_override = TRUE.

10.4 System Cancellation Triggers (Exhaustive)
1. Approving manager is deactivated and no alternative approver exists.
2. KPI is soft-deleted by Admin.
3. Objective is soft-deleted by Admin.
4. Employee is deactivated and Admin performs month force-close.
5. Any additional trigger requires a SSoT update before implementation.

Cancelled cycle behavior: terminal state, excluded from calculations, does not block PMS Review eligibility.

================================================================================
PART 11 — OBJECTIVE MAPPING
================================================================================

11.1 Rules
- One parent per child (unique constraint on child_objective_id in objective_mappings).
- Parent and child must be in same fiscal_year and month.
- Circular mappings are blocked at write time. If a circular reference is detected on create or update of an objective mapping, reject the save with HTTP 409 + CIRCULAR_MAPPING_BLOCKED.
- Unmapping removes mapping contributions forward; does not affect closed PMS Review periods.

11.2 Weight Constraint
Parent Objective: sum of (direct KPI weights + all mapped child weights) = 100.00.

================================================================================
PART 12 — DUPLICATION AND BULK OPERATIONS
================================================================================

12.1 Objective Duplication
- Admin only.
- Copies Objective properties + KPI definitions. No cycles copied.
- Identity check: (employee_id + fiscal_year + month + objective_title). Duplicate identity → HTTP 409 + OBJECTIVE_DUPLICATION_BLOCKED.
- Objective weight preserved from source.

12.2 Bulk Operations (All Admin Only)

12.2.1 Objectives & KPI Module
- Clone: Copy Objectives (with KPI definitions, without cycles) from source Employee+Month to target(s). Runs as atomic batch.
- Move: Reassign Objective to different Employee, same Month+FY. Blocked if any cycle is SUBMITTED or APPROVED.
- Delete: Soft-delete multiple Objectives. Per-Objective blocking rules apply individually; eligible ones proceed.
- Import: Excel upload (two-sheet format, §12.3). Atomic.
- Export: Export current view to Excel/CSV. Limited to 10,000 rows.

V2 FEATURE: KPI Library bulk operations are deferred. See Part 0.5, Item 4.

12.2.2 KPI Library (V2)
- Bulk Apply: Apply one or more templates to one or more Employee+Month+Objective targets. Atomic.
- If target Objective doesn't exist: Admin must specify new Objective title and type. System creates it.
- Post-apply weightages: Auto Split applied. Admin must finalize before save.

12.2.3 PMS Review
- Bulk Initiate: Select multiple Employees, initiate PMS Reviews for all. NOT atomic — partial success is allowed. Eligible Employees get reviews created; ineligible Employees are listed with their blocking reasons.

12.3 Excel Import Format (Authoritative)

Sheet 1 — Objectives
Columns (ordered): Employee Code | Fiscal Year | Month (1–12) | Objective Type (RC/CO/OE/OTHERS) | Objective Title | Description | Weightage

Sheet 2 — KPIs
Columns (ordered): Employee Code | Fiscal Year | Month | Objective Title | KPI Title | Description | Unit | Metric Type | Target Type | Standard | Target | Aggregation Method | Frequency | Weightage

Validation Rules (all checked before any write):
1. All Sheet 2 Objective Title references must match a Sheet 1 row by (Employee Code + FY + Month + Objective Title).
2. Objective weightages sum to exactly 100.00 per (Employee Code + FY + Month).
3. KPI weightages sum to exactly 100.00 per (Employee Code + FY + Month + Objective Title).
4. Metric Type values: INCREASE, DECREASE, CONTROL, CUMULATIVE.
5. CUMULATIVE rows: Target Type must be FIXED, Standard must be 0, Aggregation Method must be SUM.
6. INCREASE/DECREASE rows: Standard ≠ Target.
7. CONTROL rows: Standard ≤ Target.
8. Frequency values: WEEKLY or MONTHLY.
9. All required columns must be present and non-empty.
10. Employee Code must exist in the system.
11. Fiscal Year and Month must be a valid combination.
12. No duplicate Objective identity (Employee Code + FY + Month + Objective Title) within the file. Duplicate identities are rejected; no overwrite mode in V1.

12.4 Import Job Model
1. Client uploads file → server returns import_job_id + validation_result.
2. If validation passes: client confirms → server executes write in single transaction → returns result.
3. If validation fails: server returns full error list with row numbers. No write occurs.
4. Same file with same import_job_id: idempotent — returns previous result if completed within 24 hours.

================================================================================
PART 13 — PMS REVIEW ELIGIBILITY
================================================================================

13.1 Blocking Conditions (Review Cannot Proceed)
1. Any KPI cycle in the review period is in DRAFT, SUBMITTED, or REJECTED state.
2. Objective or KPI weightages do not sum to 100.00 for any month in the period.
3. A PMS Review for this Employee + period_type + fiscal_year + period already exists.

13.2 Warning Conditions (Admin Must Acknowledge)
1. Any month in the period has zero Objectives.
2. Any Objective has zero KPIs.
3. Any calculated value is NULL.

13.3 Initiation Authority
Admin only (including BoD Admins: blocked — write action).

================================================================================
PART 14 — PMS REVIEW WORKFLOW
================================================================================

14.1 Status States and Transitions
- MANAGER_REVIEW_PENDING: Set immediately on initiation. Snapshot taken at this point.
- MANAGER_SUBMITTED: Set when Manager submits their review.
- ADMIN_REVIEW_PENDING: Set immediately after MANAGER_SUBMITTED.
- CLOSED: Set when Admin submits their review.

Note: "INITIATED" is not a stored status. It is the creation event. The stored status is MANAGER_REVIEW_PENDING from the start.

14.2 Snapshot
- snapshot_json is written once when PMS Review is created (status → MANAGER_REVIEW_PENDING).
- Contents: employee_id, period_type, fiscal_year, period, objective_data (array of {objective_id, title, type, weightage, objective_percent}), oem_by_month (array of {month, oem}), oeq (if applicable), oeh (if applicable), oea (if applicable), pms_score, pms_rating, captured_at.
- snapshot_json is never updated after creation.

14.3 Manager Review
- Rating: HAPPY | NEUTRAL | SAD.
- Comment: 50–2000 characters. Mandatory.
- Confirmation dialog before submit.
- manager_review_json: {rating, comment, submitted_by, submitted_at}.

14.4 Admin Review
- Same structure as Manager Review.
- admin_review_json: {rating, comment, submitted_by, submitted_at}.
- On save: status → CLOSED. locked_at set to current UTC timestamp.
- All Objectives and KPIs in the review period → state = IMMUTABLE.

================================================================================
PART 15 — POST-REVIEW IMMUTABILITY
================================================================================

1. All Objectives within the review period: read-only.
2. All KPIs within the review period: state = IMMUTABLE, permanently read-only.
3. All KPI Cycles within the review period: read-only.
4. All weightages within the review period: locked.
5. Objective Mappings within the review period: locked.
6. Any modification attempt: HTTP 403 + IMMUTABILITY_VIOLATION.
7. No role can override. No exception.

================================================================================
PART 16 — PEOPLE MANAGEMENT LIFECYCLE
================================================================================

16.1 User Creation
Mandatory: full_name, username, email, password. Optional: all others.
Username and email: unique per organisation. Editable by Admin.

16.2 Role Changes
- Increase in authority (e.g. Employee → Manager): effective first day of next month.
- Decrease in authority: effective immediately.

16.3 Reporting Manager Changes
- Effective first day of next month.
- Pending approvals at time of change must be manually reassigned by Admin.

16.4 Deactivation
- Deactivated users: cannot log in. Historical data preserved. Performance records intact.
- Reactivation: restores access for future periods only.

16.5 Bulk People Operations
- Bulk deactivate: all selected users deactivated simultaneously.
- Bulk role change: all selected users get the new role simultaneously.
- Both follow effective-date rules of individual operations.
- If a deactivated user had pending KPI approvals: in-app notification to Admin.

16.6 Attribute Lists
Admin configures: DEPARTMENT, DIVISION, BUSINESS_UNIT, LOCATION, DESIGNATION.
BUSINESS_UNIT entries have a parent_value pointing to a DIVISION value.

16.7 Org-Chart
- Read-only view derived from manager_id relationships.
- BoD Admins (executive_label=TRUE) appear at the top with label "Board of Directors".
- All roles can view the org-chart.

================================================================================
PART 17 — MONTH FORCE CLOSE
================================================================================

1. Admin only. Mandatory reason required.
2. Cycle state handling:
   - DRAFT: actual_value → NULL, state stays DRAFT, force_closed → TRUE.
   - SUBMITTED: actual_value → NULL, state → CANCELLED_BY_SYSTEM, force_closed → TRUE.
   - REJECTED: actual_value → NULL, state → CANCELLED_BY_SYSTEM, force_closed → TRUE.
   - APPROVED: unchanged.
   - LOCKED: unchanged.
3. Force-closed months always included in cadence calculations.
4. NULL cycles excluded from ObjectivePercent. Objectives with all-NULL KPIs have ObjectivePercent = NULL.
5. OEM computed excluding NULL Objectives.
6. Employee cannot submit cycles after force-close.
7. Missing reason → HTTP 400 + VALIDATION_FAILED.

================================================================================
PART 18 — STATUS INDICATORS AND RATING SCALES
================================================================================

18.1 KPI Status Bands (Default — Admin Configurable)
Band            Condition               Default Color
--------------- ----------------------- -------------
NOT_STARTED     No actual_value entered Grey
                in any cycle
AT_RISK         percent 0–59            Red
OFF_TRACK       percent 60–79           Amber
ON_TRACK        percent 80–99           Yellow-Green
ACHIEVED        percent ≥ 100           Green

18.2 Objective Status Visual Indicators
State       Indicator
----------- -----------
LAUNCHED    Grey circle
ONGOING     Blue circle
COMPLETED   Green circle
DELETED     Hidden from UI

18.3 PMS Rating Scale (Default — Admin Configurable)
Rating                  Condition
----------------------- ----------------------
Exceeds Expectations    score ≥ 100.00
Meets Expectations      90.00 ≤ score < 100.00
Below Expectations      70.00 ≤ score < 90.00
Disappointing           score < 70.00

Custom bands must be contiguous, non-overlapping, and cover the full 0–∞ range.

================================================================================
PART 19 — SEARCH, ORDERING, PAGINATION & EXPORTS
================================================================================

19.1 Default Sort Order
created_at DESC, id ASC (tie-breaker). Module-specific overrides documented in their sections.

19.2 Cursor Pagination
- Cursor: base64(created_at_iso + ":" + id).
- Query params: cursor (opaque), limit (default 25, max 100).
- Response includes: next_cursor (null if no more results), has_more (boolean).

19.3 Export
- Reflects exactly what is on screen for the current filter state.
- Formats: XLSX and CSV.
- Max 10,000 rows.

================================================================================
PART 20 — NOTIFICATIONS
================================================================================

20.1 Delivery
In-app only. Client polls GET /api/v1/notifications?status=UNREAD every 30 seconds.

20.2 Triggers
1. Employee submits KPI cycle → notify approving Manager.
2. KPI approved → notify Employee.
3. KPI rejected → notify Employee (include rejection comment preview, max 100 chars).
4. 3rd submission rejected (max iterations) → notify Admin.
5. PMS Review initiated → notify Manager and Employee.
6. Bulk deactivation of user with pending approvals → notify Admin.

20.3 Notification Model
- status: UNREAD | READ.
- Clicking notification: marks READ, navigates to link_url.
- Unread count badge on bell icon.
- Mark all as read: single endpoint.

================================================================================
PART 21 — KPI LIBRARY — V2 PLACEHOLDER (NOT IMPLEMENTED IN V1)
================================================================================

V1 STATUS: KPI Library is a V2 feature. No schema, no service, no UI, no routes exist in V1.
This section is preserved as a non-authoritative placeholder for Phase 2 planning.
See V1 Exclusions (Part 0.5, Item 4).

21.1 Planned Scope (Non-Authoritative)
- Reusable KPI template store.
- Bulk apply templates to Objectives.
- Auto Split weightages post-apply.

21.2 CUMULATIVE Template Enforcement
Templates with metric_type = CUMULATIVE must have standard = 0, target_type = FIXED, aggregation_method = SUM.

21.3 Apply Template
- Creates KPI in DRAFT state under target Objective.
- Does not create cycles. Cycles generated when timeline is set.

21.4 Bulk Apply
- Atomic transaction. All-or-nothing.
- Preview shown before commit.

================================================================================
PART 22 — EXECUTIVE SUMMARY AND HALL OF FAME
================================================================================

22.1 Access
Read-only. Admin and BoD Admin only.

22.2 Leaderboard
- Ranked by OEM/OEQ/OEH/OEA depending on selected cadence.
- Filters: Department, Division, Business Unit, Reporting Manager.
- Columns: Rank | Employee Name | Designation | Score | KPI Status Distribution (counts per band).
- NULL-score Employees: listed unranked at bottom.

22.3 Status Distribution
- Aggregate counts per KPI Status band for selected month and filter.
- Shown as count + percentage.

22.4 Hall of Fame — Two Lists

List 1 — Most Consistent Performers
- Criterion: highest average OEM over the last 4 completed quarters with minimum 80% of eligible months in ON_TRACK or ACHIEVED.
- "Eligible months" = months with OEM ≠ NULL.
- Top 10. Tie-break: higher average OEM, then earlier date_of_joining.
- Minimum eligibility: at least one complete quarter of data in the last 4 quarters.

List 2 — Top Annual Performers
- Criterion: highest OEA for the current or most recently completed fiscal year.
- Top 10. Tie-break: higher OEA, then lower rejection rate (rejections / total submissions).
- Minimum eligibility: at least 6 valid months in the fiscal year.

Display:
- Both lists side by side.
- Employee may appear in both.
- Both downloadable as PDF.

V1 STATUS: PDF Export is a V2 feature. The Executive Summary UI exists in V1 (read-only), but PDF generation and download behavior is deferred. See Part 0.5, Item 3.

22.5 PDF Export (V2)
- Per-component download and "Export All" button.
- Header includes: organisation name, filter state, fiscal period, generated date.
- Synchronous for single component (≤ 10,000 records); progress indicator for combined export.

================================================================================
PART 23 — ARCHITECTURE GUARDRAILS
================================================================================

23.1 Tech Stack (Locked — Non-Negotiable)
Layer           Technology
--------------- -----------------------------------------------
Framework       SvelteKit 2 (Svelte 5 runes) + TypeScript
ORM             Drizzle ORM
Database        PostgreSQL (Neon serverless)
Auth            BetterAuth
UI Library      shadcn-svelte + Claymorphism light theme
Deployment      Vercel (compute) + Neon (DB)

23.2 Five-Layer Architecture (Strict)

Layer 1 — Routes / +page.svelte + Server Actions (Controller)
- Request parsing, response formatting, auth session check, Zod input validation.
- No business logic. No direct DB calls. No calculations.
- Calls Layer 2 services.

Layer 2 — Services (Business Logic)
- All workflows, state machine transitions, permission checks, weight validation, calculation orchestration.
- One service file per domain: ObjectiveService, KPIService, KPICycleService, ApprovalService, PMSService, PeopleService, ImportService, NotificationService.
- ExportService and KPILibraryService are V2 services; do not create in V1.
- Services call Layer 3 repositories. Services never use Drizzle directly.
- Calculation functions are imported from Layer 5 as pure functions.

Layer 3 — Repositories (Data Access)
- Only Drizzle ORM queries.
- Every query: WHERE organisation_id = CONSTANT AND deleted_at IS NULL (for soft-delete tables).
- No business logic in repositories.

Layer 4 — Schema / Models
- All Drizzle table definitions, relations, constraints, indexes.
- All Zod validation schemas (one schema per entity, one per API request).

Layer 5 — Utils / Helpers / Lib
- Pure calculation functions: no DB calls, no external state, no side effects.
- Date helpers (all timezone-aware using IANA string from org config).
- Weightage validators.
- Status derivators.
- Cursor encoder/decoder.

Architecture Violations (SEV-1 Defects):
- Direct DB calls in Controller layer.
- Business logic in Repository layer.
- Calculation function that queries the DB.
- State machine transition outside Service layer.
- Permissions checked only in UI.

23.3 Organisation Scoping (Mandatory Query Pattern)
WHERE organisation_id = :constant_org_id
AND deleted_at IS NULL   -- for soft-delete tables

Missing organisation_id scoping is a SEV-1 defect.

23.4 State Machine Rule
All state transitions validated in Service layer against the explicit transition table (Part 25). Invalid transitions throw StateTransitionError. No state changes via raw SQL.

23.5 Calculation Engine Rules
- All formulas are pure functions in Layer 5.
- Inputs: raw numeric values. Outputs: computed numeric values.
- No DB queries. No side effects.
- Monthly and derived cadence logic are in separate functions.
- Null handling: functions receive null-flagged inputs and handle them per Part 26.

23.6 Deletion Rules
- Soft delete (set deleted_at): default for all entities.
- Hard delete (physical row removal): KPI Cycles only, by Admin, with confirmation.
- KPI Submissions: never deleted.

23.7 Optimistic Locking Implementation
- All mutable entity tables have version INTEGER NOT NULL DEFAULT 1.
- On read: version is included in the response.
- On update: client sends version in request body. Service checks: if stored_version ≠ request_version → throw HTTP 409 + CONCURRENT_MODIFICATION.
- On successful update: increment version by 1 in same transaction.
- Applies to: objectives, kpis, kpi_cycles, pms_reviews, organisation_config.

23.8 Idempotency Implementation
- idempotency_records table (Part 24.14).
- On state-changing request: check for existing record by (idempotency_key + user_id). If found and not expired: return cached response.
- If not found: process, write record with response_body and expires_at = NOW() + 24 hours.
- Table is cleaned up by a scheduled job (TTL-based).

23.9 Development Workflow Rules
- Vertical slice per feature: schema → repository → service → route/action → UI.
- One pull request per feature slice.
- No feature ships without tests (Part 31 checklist).

================================================================================
PART 24 — DATABASE SCHEMA (COMPLETE — AUTHORITATIVE)
================================================================================

All tables include: organisation_id UUID NOT NULL and created_at TIMESTAMPTZ NOT NULL DEFAULT NOW().

--------------------------------------------------------------------------------
24.1 organisation
--------------------------------------------------------------------------------
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
name              VARCHAR(255) NOT NULL
fiscal_year_start ENUM('APRIL','JANUARY') NOT NULL
timezone          VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata'
status            ENUM('ACTIVE','DEACTIVATED') NOT NULL DEFAULT 'ACTIVE'
created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
version           INTEGER NOT NULL DEFAULT 1

One row per deployment. organisation_id is this row's id, used as constant everywhere else.

--------------------------------------------------------------------------------
24.2 organisation_config
--------------------------------------------------------------------------------
id                      UUID PRIMARY KEY DEFAULT gen_random_uuid()
organisation_id         UUID NOT NULL REFERENCES organisation(id)
pms_cadences_enabled    TEXT[] NOT NULL DEFAULT ARRAY['QUARTERLY','HALF_YEARLY','ANNUAL']
kpi_status_bands        JSONB NOT NULL DEFAULT '{...}'  -- see 24.2.1
pms_rating_bands        JSONB NOT NULL DEFAULT '{...}'  -- see 24.2.2
max_import_file_size_mb INTEGER NOT NULL DEFAULT 10
created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
version                 INTEGER NOT NULL DEFAULT 1
UNIQUE(organisation_id)  -- one config row per org

24.2.1 Default kpi_status_bands JSON:
{
  "at_risk":   {"min": 0,   "max": 59,  "label": "At Risk",   "color": "#EF4444"},
  "off_track": {"min": 60,  "max": 79,  "label": "Off Track", "color": "#F59E0B"},
  "on_track":  {"min": 80,  "max": 99,  "label": "On Track",  "color": "#84CC16"},
  "achieved":  {"min": 100, "max": null,"label": "Achieved",  "color": "#22C55E"}
}

24.2.2 Default pms_rating_bands JSON:
[
  {"min": 100, "max": null, "label": "Exceeds Expectations"},
  {"min": 90,  "max": 99.99,"label": "Meets Expectations"},
  {"min": 70,  "max": 89.99,"label": "Below Expectations"},
  {"min": 0,   "max": 69.99,"label": "Disappointing"}
]

--------------------------------------------------------------------------------
24.3 users
--------------------------------------------------------------------------------
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
organisation_id UUID NOT NULL REFERENCES organisation(id)
full_name       VARCHAR(255) NOT NULL
role            ENUM('ADMIN','MANAGER','EMPLOYEE') NOT NULL
executive_label BOOLEAN NOT NULL DEFAULT FALSE
email           VARCHAR(255) NOT NULL
username        VARCHAR(100) NOT NULL
password_hash   VARCHAR(255) NOT NULL
status          ENUM('ACTIVE','DEACTIVATED') NOT NULL DEFAULT 'ACTIVE'
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
deleted_at      TIMESTAMPTZ
version         INTEGER NOT NULL DEFAULT 1
UNIQUE(organisation_id, email)
UNIQUE(organisation_id, username)

--------------------------------------------------------------------------------
24.4 employees
--------------------------------------------------------------------------------
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
organisation_id UUID NOT NULL REFERENCES organisation(id)
user_id         UUID NOT NULL REFERENCES users(id)
manager_id      UUID REFERENCES employees(id)   -- NULL = top of hierarchy
status          ENUM('ACTIVE','DEACTIVATED') NOT NULL DEFAULT 'ACTIVE'
full_name       VARCHAR(255) NOT NULL
employee_code   VARCHAR(100) NOT NULL
department      VARCHAR(100)
division        VARCHAR(100)
business_unit   VARCHAR(100)
location        VARCHAR(100)
designation     VARCHAR(100)
date_of_joining DATE
date_of_birth   DATE
gender          VARCHAR(50)
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
deleted_at      TIMESTAMPTZ
version         INTEGER NOT NULL DEFAULT 1
UNIQUE(organisation_id, employee_code)
UNIQUE(organisation_id, user_id)

--------------------------------------------------------------------------------
24.5 objectives
--------------------------------------------------------------------------------
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
organisation_id UUID NOT NULL REFERENCES organisation(id)
employee_id     UUID NOT NULL REFERENCES employees(id)
category        ENUM('RC','CO','OE','OTHERS') NOT NULL
weightage       NUMERIC(5,2) NOT NULL DEFAULT 0
fiscal_year     INTEGER NOT NULL
month           SMALLINT NOT NULL CHECK (month BETWEEN 1 AND 12)
status          ENUM('LAUNCHED','ONGOING','COMPLETED','DELETED') NOT NULL DEFAULT 'LAUNCHED'
title           VARCHAR(255) NOT NULL
description     TEXT
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
deleted_at      TIMESTAMPTZ
version         INTEGER NOT NULL DEFAULT 1

--------------------------------------------------------------------------------
24.6 kpis
--------------------------------------------------------------------------------
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
organisation_id     UUID NOT NULL REFERENCES organisation(id)
objective_id        UUID NOT NULL REFERENCES objectives(id)
title               VARCHAR(255) NOT NULL
description         TEXT
unit                VARCHAR(50)
metric_type         ENUM('INCREASE','DECREASE','CONTROL','CUMULATIVE') NOT NULL
target_type         ENUM('FIXED','CUSTOM') NOT NULL DEFAULT 'FIXED'
standard            NUMERIC NOT NULL DEFAULT 0
target              NUMERIC NOT NULL
aggregation_method  ENUM('SUM','AVERAGE') NOT NULL DEFAULT 'SUM'
frequency           ENUM('WEEKLY','MONTHLY') NOT NULL
weightage           NUMERIC(5,2) NOT NULL DEFAULT 0
kpi_state           ENUM('DRAFT','ACTIVE','LOCKED','IMMUTABLE') NOT NULL DEFAULT 'DRAFT'
immutable_flag      BOOLEAN NOT NULL DEFAULT FALSE
timeline_start_date DATE
timeline_end_date   DATE
created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
deleted_at          TIMESTAMPTZ
version             INTEGER NOT NULL DEFAULT 1

--------------------------------------------------------------------------------
24.7 kpi_cycles
--------------------------------------------------------------------------------
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
organisation_id     UUID NOT NULL REFERENCES organisation(id)
kpi_id              UUID NOT NULL REFERENCES kpis(id)
cycle_start_date    DATE NOT NULL
cycle_end_date      DATE NOT NULL
standard_value      NUMERIC NOT NULL
target_value        NUMERIC NOT NULL
actual_value        NUMERIC            -- NULL = not entered; 0 = explicit zero
comments            TEXT
achievement_percent NUMERIC            -- cached, non-authoritative
submission_count    INTEGER NOT NULL DEFAULT 0 CHECK (submission_count >= 0)
state               ENUM('DRAFT','SUBMITTED','APPROVED','REJECTED','CANCELLED_BY_SYSTEM','LOCKED') NOT NULL DEFAULT 'DRAFT'
force_closed        BOOLEAN NOT NULL DEFAULT FALSE
max_submissions_reached BOOLEAN NOT NULL DEFAULT FALSE
created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
version             INTEGER NOT NULL DEFAULT 1
-- No deleted_at: hard delete only by Admin
CONSTRAINT no_overlapping_cycles EXCLUDE USING gist (
  kpi_id WITH =,
  daterange(cycle_start_date, cycle_end_date, '[]') WITH &&
)

--------------------------------------------------------------------------------
24.8 kpi_submissions
--------------------------------------------------------------------------------
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
organisation_id     UUID NOT NULL REFERENCES organisation(id)
kpi_cycle_id        UUID NOT NULL REFERENCES kpi_cycles(id)
state               ENUM('SUBMITTED','APPROVED','REJECTED','CANCELLED_BY_SYSTEM','LOCKED') NOT NULL
submitted_by        UUID REFERENCES users(id)
submitted_at        TIMESTAMPTZ
approved_by         UUID REFERENCES users(id)
approved_at         TIMESTAMPTZ
approval_comment    TEXT CHECK (char_length(approval_comment) BETWEEN 10 AND 1000)
rejected_by         UUID REFERENCES users(id)
rejected_at         TIMESTAMPTZ
rejection_comment   TEXT CHECK (char_length(rejection_comment) BETWEEN 10 AND 1000)
is_override         BOOLEAN NOT NULL DEFAULT FALSE
is_self_approval    BOOLEAN NOT NULL DEFAULT FALSE
cancellation_reason TEXT
created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
-- No updated_at, no deleted_at: immutable append-only records

--------------------------------------------------------------------------------
24.9 objective_mappings
--------------------------------------------------------------------------------
id                   UUID PRIMARY KEY DEFAULT gen_random_uuid()
organisation_id      UUID NOT NULL REFERENCES organisation(id)
parent_objective_id  UUID NOT NULL REFERENCES objectives(id)
child_objective_id   UUID NOT NULL REFERENCES objectives(id)
weight_in_parent     NUMERIC(5,2) NOT NULL
created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
deleted_at           TIMESTAMPTZ
version              INTEGER NOT NULL DEFAULT 1
UNIQUE(child_objective_id) WHERE deleted_at IS NULL  -- single parent rule

--------------------------------------------------------------------------------
24.10 pms_reviews
--------------------------------------------------------------------------------
id                   UUID PRIMARY KEY DEFAULT gen_random_uuid()
organisation_id      UUID NOT NULL REFERENCES organisation(id)
employee_id          UUID NOT NULL REFERENCES employees(id)
period_type          ENUM('QUARTERLY','HALF_YEARLY','ANNUAL') NOT NULL
fiscal_year          INTEGER NOT NULL
period               VARCHAR(10) NOT NULL  -- e.g. 'Q1', 'H1', 'FY'
snapshot_json        JSONB NOT NULL
manager_review_json  JSONB
admin_review_json    JSONB
status               ENUM('MANAGER_REVIEW_PENDING','MANAGER_SUBMITTED','ADMIN_REVIEW_PENDING','CLOSED') NOT NULL DEFAULT 'MANAGER_REVIEW_PENDING'
created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
locked_at            TIMESTAMPTZ
version              INTEGER NOT NULL DEFAULT 1
UNIQUE(organisation_id, employee_id, period_type, fiscal_year, period)

--------------------------------------------------------------------------------
24.11 in_app_notifications
--------------------------------------------------------------------------------
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
organisation_id   UUID NOT NULL REFERENCES organisation(id)
recipient_user_id UUID NOT NULL REFERENCES users(id)
title             VARCHAR(255) NOT NULL
message           TEXT NOT NULL
link_url          VARCHAR(500)
status            ENUM('UNREAD','READ') NOT NULL DEFAULT 'UNREAD'
created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
read_at           TIMESTAMPTZ

--------------------------------------------------------------------------------
24.12 kpi_library_templates — V2 Only (Deferred)
--------------------------------------------------------------------------------
id                  UUID PRIMARY KEY DEFAULT gen_random_uuid()
organisation_id     UUID NOT NULL REFERENCES organisation(id)
title               VARCHAR(255) NOT NULL
description         TEXT
unit                VARCHAR(50)
metric_type         ENUM('INCREASE','DECREASE','CONTROL','CUMULATIVE') NOT NULL
target_type         ENUM('FIXED','CUSTOM') NOT NULL
standard            NUMERIC NOT NULL DEFAULT 0
target              NUMERIC NOT NULL
aggregation_method  ENUM('SUM','AVERAGE') NOT NULL
frequency           ENUM('WEEKLY','MONTHLY') NOT NULL
tags                TEXT[] NOT NULL DEFAULT '{}'
status              ENUM('ACTIVE','ARCHIVED') NOT NULL DEFAULT 'ACTIVE'
created_by          UUID NOT NULL REFERENCES users(id)
created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
deleted_at          TIMESTAMPTZ
version             INTEGER NOT NULL DEFAULT 1

V1 IMPLEMENTATION: Do not create this table in V1. No code references it.

--------------------------------------------------------------------------------
24.13 tenant_attribute_values
--------------------------------------------------------------------------------
id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
organisation_id  UUID NOT NULL REFERENCES organisation(id)
attribute_type   ENUM('DEPARTMENT','DIVISION','BUSINESS_UNIT','LOCATION','DESIGNATION') NOT NULL
attribute_value  VARCHAR(255) NOT NULL
parent_value     VARCHAR(255)  -- BUSINESS_UNIT rows: stores parent DIVISION value
created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
deleted_at       TIMESTAMPTZ
UNIQUE(organisation_id, attribute_type, attribute_value) WHERE deleted_at IS NULL

--------------------------------------------------------------------------------
24.14 idempotency_records
--------------------------------------------------------------------------------
id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
idempotency_key  UUID NOT NULL
user_id          UUID NOT NULL REFERENCES users(id)
endpoint         VARCHAR(255) NOT NULL
response_body    JSONB NOT NULL
created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
expires_at       TIMESTAMPTZ NOT NULL
UNIQUE(idempotency_key, user_id)

--------------------------------------------------------------------------------
24.15 import_jobs
--------------------------------------------------------------------------------
id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
organisation_id  UUID NOT NULL REFERENCES organisation(id)
uploaded_by      UUID NOT NULL REFERENCES users(id)
status           ENUM('PENDING','VALIDATED','FAILED','COMMITTED') NOT NULL DEFAULT 'PENDING'
validation_errors JSONB   -- array of {row, sheet, field, message}
row_count        INTEGER
committed_at     TIMESTAMPTZ
created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
expires_at       TIMESTAMPTZ NOT NULL  -- 24 hours from creation

--------------------------------------------------------------------------------
24.16 system_events (Admin Audit Trail)
--------------------------------------------------------------------------------
id               UUID PRIMARY KEY DEFAULT gen_random_uuid()
organisation_id  UUID NOT NULL REFERENCES organisation(id)
actor_user_id    UUID NOT NULL REFERENCES users(id)
event_type       ENUM(
                   'USER_CREATED','USER_DEACTIVATED','USER_REACTIVATED','ROLE_CHANGED',
                   'MANAGER_CHANGED','FORCE_CLOSE_MONTH','OBJECTIVE_DELETED','KPI_DELETED',
                   'KPI_CYCLE_DELETED','APPROVAL_OVERRIDE','PMS_REVIEW_INITIATED',
                   'PMS_REVIEW_CLOSED','ATTRIBUTE_CHANGED','CONFIG_CHANGED'
                 ) NOT NULL
entity_type      VARCHAR(100) NOT NULL   -- e.g. 'user','objective','kpi_cycle','pms_review'
entity_id        UUID                    -- nullable if not applicable
metadata         JSONB                   -- event-specific details
created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()

- Append-only. Never updated or deleted.
- Written synchronously in the same transaction as the triggering action.
- Provides read-only admin audit feed (Admin only, paginated, no UI search in V1).
- Complements kpi_submissions which tracks submission-specific audit history.

================================================================================
PART 25 — STATE MACHINE TABLES (EXPLICIT TRANSITION TABLES)
================================================================================

25.1 Objective State Machine

Current State   Trigger / Condition         New State   Actor       Blocked If
--------------- --------------------------- ----------- ----------- --------------------------
LAUNCHED        First KPI created           ONGOING     System      —
ONGOING         All KPI cycles APPROVED     COMPLETED   System      —
LAUNCHED        Admin deletes               DELETED     Admin       Has execution data
ONGOING         Admin deletes               DELETED     Admin       Any KPI has SUBMITTED or
                                                                    APPROVED cycle
COMPLETED       Admin reopens (with reason) ONGOING     Admin       Covered by closed PMS Review
DELETED         Admin restores              LAUNCHED    Admin       Has execution data

All other transitions: HTTP 409 + INVALID_STATE_TRANSITION.

--------------------------------------------------------------------------------
25.2 KPI State Machine

Current State   Trigger                     New State   Actor       Notes
--------------- --------------------------- ----------- ----------- -----------
DRAFT           First KPI cycle SUBMITTED   ACTIVE      System      —
ACTIVE          All KPI cycles APPROVED     LOCKED      System      —
LOCKED          Parent Objective in PMS     IMMUTABLE   System      —
                Review snapshot

All other transitions (including any → DRAFT, LOCKED → ACTIVE, ACTIVE → DRAFT,
IMMUTABLE → any): HTTP 409 + INVALID_STATE_TRANSITION.

--------------------------------------------------------------------------------
25.3 KPI Cycle State Machine

Current State   Trigger                     New State   Actor       Condition
--------------- --------------------------- ----------- ----------- -------------------------------
DRAFT           Employee submits            SUBMITTED   Employee    actual_value IS NOT NULL,
                                                                    submission_count < 3
REJECTED        Employee resubmits          SUBMITTED   Employee    actual_value IS NOT NULL,
                                                                    submission_count < 3
SUBMITTED       Manager/Admin approves      APPROVED    Manager/    All eligible cycles have
                                                        Admin       actual_value
SUBMITTED       Manager/Admin rejects       REJECTED    Manager/    Comment provided
                                                        Admin
APPROVED        Admin override (reject)     REJECTED    Admin       Not covered by closed PMS Review
REJECTED        Admin override (approve)    APPROVED    Admin       Not covered by closed PMS Review
APPROVED        PMS Review snapshot         LOCKED      System      —
DRAFT           Force close                 DRAFT       Admin       —
                (force_closed=TRUE,                     /System
                actual_value=NULL)
SUBMITTED       Force close                 CANCELLED_  Admin       —
                                            BY_SYSTEM   /System
REJECTED        Force close                 CANCELLED_  Admin       —
                                            BY_SYSTEM   /System
SUBMITTED       System cancellation         CANCELLED_  System      Per §10.4 triggers
                                            BY_SYSTEM
DRAFT           System cancellation         CANCELLED_  System      Per §10.4 triggers
                                            BY_SYSTEM
REJECTED        System cancellation         CANCELLED_  System      Per §10.4 triggers
                                            BY_SYSTEM

Terminal states (no exits): CANCELLED_BY_SYSTEM, LOCKED.
4th submission attempt (submission_count = 3, state = REJECTED): HTTP 409 + MAX_SUBMISSIONS_EXCEEDED.

--------------------------------------------------------------------------------
25.4 PMS Review State Machine

Current State         Trigger                     New State             Actor
--------------------- --------------------------- --------------------- -----------
(none)                Admin initiates             MANAGER_REVIEW_       Admin
                                                  PENDING
MANAGER_REVIEW_       Manager submits review      MANAGER_SUBMITTED     Manager
PENDING
MANAGER_SUBMITTED     (automatic)                 ADMIN_REVIEW_         System
                                                  PENDING
ADMIN_REVIEW_         Admin submits review        CLOSED                Admin
PENDING

Terminal state: CLOSED (no transitions out).
Rollback from any state: not permitted. HTTP 403 + IMMUTABILITY_VIOLATION.

================================================================================
PART 26 — CALCULATION FORMULA SHEET (COMPLETE — AUTHORITATIVE)
================================================================================

26.1 NULL vs 0 — Fundamental Distinction
- actual_value IS NULL: no data entered. This cycle is EXCLUDED from all aggregations.
- actual_value = 0: explicit zero entered. This cycle IS INCLUDED in aggregations.
- This distinction applies at every level: cycle, KPI, Objective, OEM, OEQ, OEH, OEA.

26.2 KPI Cycle Level Scoring (c_percent)

INCREASE:
IF T = S: KPI creation blocked (TARGET_EQUALS_STANDARD)
IF A ≤ S: c_percent = 0
IF A > S AND A < T: c_percent = ((A - S) / (T - S)) × 100
IF A ≥ T: c_percent = ((A - S) / (T - S)) × 100  [may be ≥ 100, no cap]

DECREASE:
IF T = S: KPI creation blocked (TARGET_EQUALS_STANDARD)
IF A ≥ S: c_percent = 0
IF A < S AND A > T: c_percent = ((S - A) / (S - T)) × 100
IF A ≤ T: c_percent = ((S - A) / (S - T)) × 100  [may be ≥ 100, no cap]

CONTROL:
IF S > T: KPI creation blocked (CONTROL_STANDARD_EXCEEDS_TARGET)
IF min(S,T) ≤ A ≤ max(S,T): c_percent = 100
ELSE: c_percent = 0

CUMULATIVE (per-cycle display only — not used in monthly aggregation):
running_total_i = sum(A_1 + A_2 + ... + A_i)  [only cycles with actual_value IS NOT NULL]
RunningPercent_i = (running_total_i / T) × 100  [T = monthly target, never 0]

Note: RunningPercent_i is displayed per cycle as a progress indicator only. It has no role in any aggregate calculation.

26.3 KPI Monthly Aggregation → MonthlyKPIPercent

FIXED Target — INCREASE or DECREASE:
included_cycles = cycles WHERE actual_value IS NOT NULL
N = count(included_cycles)
IF N = 0: MonthlyKPIPercent = NULL  (KPI excluded from Objective calculation)
IF aggregation_method = SUM:
    MonthlyActual = sum(actual_value over included_cycles)
    MonthlyKPIPercent = formula(MonthlyActual, S, T)
IF aggregation_method = AVERAGE:
    MonthlyActual = sum(actual_value over included_cycles) / N
    MonthlyKPIPercent = formula(MonthlyActual, S, T)

FIXED Target — CONTROL:
Same N logic as above.
MonthlyActual = (SUM: sum; AVERAGE: sum/N)
MonthlyKPIPercent = formula_CONTROL(MonthlyActual, S, T)

CUSTOM Target — INCREASE, DECREASE, or CONTROL:
included_cycles = cycles WHERE actual_value IS NOT NULL
N = count(included_cycles)
IF N = 0: MonthlyKPIPercent = NULL
ELSE: MonthlyKPIPercent = sum(c_percent_i for included_cycles) / N

CUMULATIVE:
included_cycles = cycles WHERE actual_value IS NOT NULL
running_total = sum(actual_value over included_cycles)
IF count(all_cycles) = 0: MonthlyKPIPercent = NULL
ELSE IF running_total IS NULL [no cycles have actual_value]: MonthlyKPIPercent = NULL
ELSE: MonthlyKPIPercent = (running_total / T) × 100

26.4 KPI Weighting Within Objective → ObjectivePercentFromKPIs

included_kpis = kpis WHERE MonthlyKPIPercent IS NOT NULL AND deleted_at IS NULL
IF count(included_kpis) = 0: ObjectivePercent = NULL

IMPORTANT: Weight redistribution does NOT occur.
ObjectivePercent = sum(MonthlyKPIPercent_i × w_i) / 100
where w_i is the original KPI weightage.

When some KPIs have NULL MonthlyKPIPercent (no data), they contribute 0 to the numerator
but their weight still counts in the denominator (100). This means missing data pulls the
Objective score down proportionally.

26.5 Objective Mapping Score Propagation

For a parent Objective P with direct KPIs and mapped child Objectives:
sum_check = sum(direct_kpi_weights) + sum(child_weights_in_parent) = 100 (enforced)

ObjectivePercent_P =
  (sum(MonthlyKPIPercent_i × direct_kpi_weight_i) +
   sum(ObjectivePercent_child_j × child_weight_j)) / 100

Circular mappings are blocked at write time (Part 11.1). The calculation formula assumes
a validated acyclic graph. If a circular reference somehow exists (data integrity violation),
the calculation engine falls back to: sum(MonthlyKPIPercent_i × direct_kpi_weight_i) / 100
for any Objective in the circular chain, excluding all mapped contributions.

26.6 Monthly Employee Score → OEM

included_objectives = objectives WHERE ObjectivePercent IS NOT NULL AND deleted_at IS NULL
IF count(included_objectives) = 0 AND month IS NOT force_closed:
    OEM = NULL  (month excluded from derived cadence)
IF count(included_objectives) = 0 AND month IS force_closed:
    OEM = NULL  (month is included in cadence denominator as a valid but zero-contribution month)

OEM = sum(ObjectivePercent_k × W_k) / 100
where W_k = Objective weightage (original, not redistributed)

26.7 Partial Month and Force Close Rules
- APPROVED cycles: unaffected by force close.
- LOCKED cycles: unaffected by force close.
- SUBMITTED cycles: → CANCELLED_BY_SYSTEM, actual_value = NULL, force_closed = TRUE.
- REJECTED cycles: → CANCELLED_BY_SYSTEM, actual_value = NULL, force_closed = TRUE.
- DRAFT cycles: force_closed = TRUE, actual_value = NULL, state stays DRAFT.
- NULL cycles excluded from aggregations.
- Force-closed month always included in cadence denominator N.

26.8 Derived Cadence Scores

Valid Month Definition:
- A month is VALID if OEM IS NOT NULL.
- Exception: if month IS force_closed, it is VALID even if OEM = NULL (contributes NULL to numerator but counts in denominator as N).

OEQ (Quarterly):
months_in_quarter = [m1, m2, m3]
valid_months = months WHERE OEM IS NOT NULL
N = count(valid_months)
force_closed_null_months = months WHERE force_closed = TRUE AND OEM = NULL
N += count(force_closed_null_months)  [they count in denominator]
IF N = 0: OEQ = NULL
ELSE: OEQ = sum(OEM for valid non-force-closed months + 0 for force-closed NULL months) / N

OEH (Half-Yearly): Same logic, 6 months.
OEA (Annual): Same logic, 12 months.

26.9 Auto Split Formula

N = count(objectives for employee in month)
base = FLOOR((100.00 / N) × 100) / 100  (2-decimal floor)
all_weights = [base × N objectives]
delta = 100.00 - (base × N)
all_weights[N-1] += delta  (last objective in current list order)
assert sum(all_weights) = 100.00

26.10 KPI Status Derivation

IF no cycle has actual_value IS NOT NULL: status = NOT_STARTED
ELSE:
    compute MonthlyKPIPercent
    IF MonthlyKPIPercent IS NULL: status = NOT_STARTED
    ELIF MonthlyKPIPercent < 60: status = AT_RISK
    ELIF MonthlyKPIPercent < 80: status = OFF_TRACK
    ELIF MonthlyKPIPercent < 100: status = ON_TRACK
    ELSE: status = ACHIEVED
(Use configured bands from organisation_config if customized)

26.11 PMS Rating Derivation

score = OEQ (if period_type = QUARTERLY)
      | OEH (if period_type = HALF_YEARLY)
      | OEA (if period_type = ANNUAL)
Apply pms_rating_bands from organisation_config in descending min order.
Return label of first band where score >= band.min.

26.12 Hall of Fame Calculations

Most Consistent Performers:
For each employee:
  last_4_completed_quarters = [Q where all 3 months have OEM != NULL or force_closed=TRUE]
  avg_oem = avg(OEM for all valid months in last_4_completed_quarters)
  total_eligible_months = count(months in last_4_completed_quarters WHERE OEM IS NOT NULL)
  on_track_months = count of months where KPI status is ON_TRACK or ACHIEVED
  on_track_rate = on_track_months / total_eligible_months

Eligible: has data in at least 1 complete quarter in last 4
Filter: on_track_rate >= 0.80
Sort: avg_oem DESC, date_of_joining ASC
Take top 10

Top Annual Performers:
For each employee:
  oea = computed OEA for current or most recently completed FY
  total_submissions = count(kpi_submissions WHERE submitted_by = employee.user_id)
  rejections = count(kpi_submissions WHERE state = REJECTED and submitted_by = employee.user_id)
  rejection_rate = rejections / max(total_submissions, 1)

Eligible: valid_months >= 6
Sort: oea DESC, rejection_rate ASC
Take top 10

================================================================================
PART 27 — API CONTRACT (LOCKED ENDPOINTS)
================================================================================

27.1 Base URL and Versioning
All endpoints prefixed: /api/v1/

27.2 Common Headers
Authorization: Bearer {session_token}     -- required on all authenticated endpoints
Idempotency-Key: {uuid_v4}               -- optional on state-changing endpoints
Content-Type: application/json            -- required on POST/PATCH

27.3 Cursor Pagination
Query params: cursor={base64_encoded_cursor}, limit={integer, default 25, max 100}
Response wrapper:
{
  "data": [...],
  "pagination": {
    "next_cursor": "base64...",
    "has_more": true,
    "limit": 25
  }
}

27.4 Standard Error Response
{
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Human-readable description",
    "fields": [
      {"field": "weightage", "message": "KPI weightages must sum to 100. Current sum: 95.00"}
    ]
  }
}

fields array is present only for field-level validation errors.

27.5 Endpoint Catalogue

AUTH
POST   /api/v1/auth/login
       Body: {email, password}
       Response: {user, session_token, expires_at}
       Errors: 401 INVALID_CREDENTIALS

POST   /api/v1/auth/logout
       Response: 204

POST   /api/v1/auth/refresh
       Response: {session_token, expires_at}

ORGANISATION
GET    /api/v1/org
       Response: {id, name, fiscal_year_start, timezone, status}

PATCH  /api/v1/org/config
       Body: {pms_cadences_enabled?, kpi_status_bands?, pms_rating_bands?, version}
       Response: {updated organisation_config}
       Errors: 403 PERMISSION_DENIED, 409 CONCURRENT_MODIFICATION

USERS
GET    /api/v1/users
       Query: cursor, limit, status?, role?, search?
       Response: paginated User list

POST   /api/v1/users
       Body: {full_name, username, email, password, role, executive_label?}
       Response: 201 {user}
       Errors: 400 VALIDATION_FAILED, 409 USER_ALREADY_EXISTS

GET    /api/v1/users/:id
       Response: {user}

PATCH  /api/v1/users/:id
       Body: {full_name?, username?, email?, role?, status?, version}
       Response: {user}
       Errors: 400, 403, 409 CONCURRENT_MODIFICATION

POST   /api/v1/users/bulk/deactivate
       Body: {user_ids: [uuid]}
       Response: {deactivated: [uuid], failed: [{id, reason}]}

POST   /api/v1/users/bulk/role-change
       Body: {user_ids: [uuid], new_role: ROLE}
       Response: {updated: [uuid], failed: [{id, reason}]}

EMPLOYEES
GET    /api/v1/employees
       Query: cursor, limit, status?, department?, division?, manager_id?, search?
       Response: paginated Employee list

POST   /api/v1/employees
       Body: {user_id, manager_id?, employee_code?, department?, ...all optional attrs}
       Response: 201 {employee}

GET    /api/v1/employees/:id
       Response: {employee with user info}

PATCH  /api/v1/employees/:id
       Body: {manager_id?, department?, ..., version}
       Response: {employee}

GET    /api/v1/employees/org-chart
       Response: {tree structure of employees}

ATTRIBUTES
GET    /api/v1/attributes
       Query: attribute_type?
       Response: {attribute_type: [values]}

POST   /api/v1/attributes
       Body: {attribute_type, attribute_value, parent_value?}
       Response: 201 {attribute}

PATCH  /api/v1/attributes/:id
       Body: {attribute_value?, parent_value?, version}
       Response: {attribute}

DELETE /api/v1/attributes/:id
       Response: 204
       Errors: 409 ATTRIBUTE_IN_USE

OBJECTIVES
GET    /api/v1/objectives
       Query: employee_id, fiscal_year, month, cursor, limit, category?, status?
       Response: paginated Objective list with derived status

POST   /api/v1/objectives
       Body: {employee_id, category, title, description?, fiscal_year, month}
       Response: 201 {objective}

GET    /api/v1/objectives/:id
       Response: {objective with KPIs}

PATCH  /api/v1/objectives/:id
       Body: {category?, title?, description?, weightage?, version}
       Response: {objective}
       Errors: 400 WEIGHTAGE_SUM_INVALID, 403 IMMUTABILITY_VIOLATION, 409

DELETE /api/v1/objectives/:id
       Response: 204
       Errors: 409 OBJECTIVE_HAS_EXECUTION_DATA

POST   /api/v1/objectives/:id/reopen
       Body: {reason, version}
       Response: {objective}
       Errors: 403 IMMUTABILITY_VIOLATION (if covered by closed PMS Review)

POST   /api/v1/objectives/weightage/auto-split
       Body: {employee_id, fiscal_year, month}
       Response: {objectives: [{id, new_weightage}]}

PATCH  /api/v1/objectives/weightage/batch
       Body: {objectives: [{id, weightage, version}]}
       Response: {objectives: [updated]}
       Errors: 400 WEIGHTAGE_SUM_INVALID

POST   /api/v1/objectives/duplicate
       Body: {source_objective_id, target_employee_id, target_fiscal_year, target_month}
       Response: 201 {new_objective}
       Errors: 409 OBJECTIVE_DUPLICATION_BLOCKED

KPIS
GET    /api/v1/objectives/:objective_id/kpis
       Response: [{kpi with cycles}
POST   /api/v1/objectives/:objective_id/kpis
       Body: {title, description?, unit?, metric_type, target_type, standard, target,
              aggregation_method, frequency, weightage}
       Response: 201 {kpi}
       Errors: 400 TARGET_EQUALS_STANDARD | CONTROL_STANDARD_EXCEEDS_TARGET | WEIGHTAGE_SUM_INVALID

GET    /api/v1/kpis/:id
       Response: {kpi with cycles}

PATCH  /api/v1/kpis/:id
       Body: {title?, description?, unit?, standard?, target?, weightage?, version}
       Response: {kpi}
       Errors: 403 IMMUTABILITY_VIOLATION (if ACTIVE+ for standard/target), 409

DELETE /api/v1/kpis/:id
       Response: 204
       Errors: 409 KPI_HAS_EXECUTION_DATA

POST   /api/v1/kpis/:id/timeline
       Body: {start_date, end_date, frequency, version}
       Response: {kpi with generated cycles}
       Errors: 400 TIMELINE_INVALID_DATE | TIMELINE_CROSS_MONTH | TIMELINE_TOO_SHORT
               409 TIMELINE_LOCKED (if any cycle already SUBMITTED+)

PATCH  /api/v1/kpis/weightage/batch
       Body: {kpis: [{id, weightage, version}]}
       Response: {kpis: [updated]}
       Errors: 400 WEIGHTAGE_SUM_INVALID

KPI CYCLES
GET    /api/v1/kpis/:kpi_id/cycles
       Response: [{cycle with achievement_percent, running_total (for CUMULATIVE)}]

PATCH  /api/v1/kpi-cycles/:id/draft
       Body: {actual_value?, comments?, version}
       Response: {cycle}
       Errors: 409 INVALID_STATE_TRANSITION (if not DRAFT or REJECTED)

POST   /api/v1/kpi-cycles/:id/submit
       Headers: Idempotency-Key (optional)
       Body: {actual_value, comments?, version}
       Response: {cycle, submission}
       Errors: 400 VALIDATION_FAILED, 409 MAX_SUBMISSIONS_EXCEEDED | INVALID_STATE_TRANSITION

DELETE /api/v1/kpi-cycles/:id
       Response: 204
       Errors: 409 LAST_CYCLE_DELETION_BLOCKED

APPROVALS
GET    /api/v1/pending-approvals
       Query: employee_id?, cursor, limit
       Response: paginated list grouped by {employee, kpi, cycles}

POST   /api/v1/kpis/:id/approve
       Headers: Idempotency-Key (optional)
       Body: {month, fiscal_year, comment, version}
       Response: {approved_cycles, kpi_state}
       Errors: 400 VALIDATION_FAILED (comment too short), 412 PRECONDITION_FAILED (missing actuals)

POST   /api/v1/kpis/:id/reject
       Headers: Idempotency-Key (optional)
       Body: {month, fiscal_year, comment, version}
       Response: {rejected_cycles}
       Errors: 400 VALIDATION_FAILED, 412 PRECONDITION_FAILED

POST   /api/v1/kpis/:id/override
       Body: {month, fiscal_year, action: 'APPROVE'|'REJECT', reason, version}
       Response: {cycles}
       Errors: 403 PERMISSION_DENIED | IMMUTABILITY_VIOLATION

OBJECTIVE MAPPINGS
GET    /api/v1/objective-mappings
       Query: parent_objective_id?, employee_id?, month?, fiscal_year?
       Response: [{mapping with parent and child objective details}]

POST   /api/v1/objective-mappings
       Body: {parent_objective_id, child_objective_id, weight_in_parent}
       Response: 201 {mapping}
       Errors: 400 CHILD_ALREADY_MAPPED | VALIDATION_FAILED | WEIGHTAGE_SUM_INVALID | CIRCULAR_MAPPING_BLOCKED

PATCH  /api/v1/objective-mappings/:id
       Body: {weight_in_parent, version}
       Response: {mapping}

DELETE /api/v1/objective-mappings/:id
       Response: 204
       Errors: 403 IMMUTABILITY_VIOLATION (if in closed PMS Review period)

FORCE CLOSE
POST   /api/v1/employees/:id/force-close-month
       Headers: Idempotency-Key (optional)
       Body: {fiscal_year, month, reason}
       Response: {cancelled_count, draft_count}
       Errors: 400 VALIDATION_FAILED (missing reason), 403 PERMISSION_DENIED

PMS REVIEWS
GET    /api/v1/pms-reviews
       Query: employee_id?, period_type?, fiscal_year?, status?, cursor, limit
       Response: paginated PMS Review list

POST   /api/v1/pms-reviews
       Headers: Idempotency-Key (optional)
       Body: {employee_id, period_type, fiscal_year, period}
       Response: 201 {pms_review with snapshot}
       Errors: 400 VALIDATION_FAILED | PMS_BLOCKING_CONDITIONS, 409 PMS_REVIEW_EXISTS

POST   /api/v1/pms-reviews/bulk-initiate
       Body: {employee_ids: [uuid], period_type, fiscal_year, period}
       Response: {
         initiated: [{employee_id, pms_review_id}],
         failed:    [{employee_id, reason}]
       }

GET    /api/v1/pms-reviews/:id
       Response: {pms_review full detail}

POST   /api/v1/pms-reviews/:id/manager-review
       Headers: Idempotency-Key (optional)
       Body: {rating: 'HAPPY'|'NEUTRAL'|'SAD', comment, version}
       Response: {pms_review}
       Errors: 400 VALIDATION_FAILED, 403 PERMISSION_DENIED | IMMUTABILITY_VIOLATION

POST   /api/v1/pms-reviews/:id/admin-review
       Headers: Idempotency-Key (optional)
       Body: {rating: 'HAPPY'|'NEUTRAL'|'SAD', comment, version}
       Response: {pms_review}
       Errors: 400 VALIDATION_FAILED, 403 PERMISSION_DENIED

V1 STATUS: KPI Library endpoints are V2. Do not implement in V1.

KPI LIBRARY (V2 — Deferred)
GET    /api/v1/kpi-library
POST   /api/v1/kpi-library
GET    /api/v1/kpi-library/:id
PATCH  /api/v1/kpi-library/:id
DELETE /api/v1/kpi-library/:id
POST   /api/v1/kpi-library/bulk-apply

BULK OPERATIONS (Objectives & KPI)
POST   /api/v1/bulk/objectives/clone
       Body: {
         source_employee_id, source_fiscal_year, source_month,
         objective_ids: [uuid],
         targets: [{employee_id, fiscal_year, month}]
       }
       Response: {cloned: [{new_id, source_id}], failed: [{source_id, reason}]}

POST   /api/v1/bulk/objectives/move
       Body: {objective_ids: [uuid], target_employee_id}
       Response: {moved: [uuid], failed: [{id, reason}]}
       Errors: 409 MOVE_BLOCKED_HAS_EXECUTION_DATA (per objective)

POST   /api/v1/bulk/objectives/delete
       Body: {objective_ids: [uuid]}
       Response: {deleted: [uuid], failed: [{id, reason}]}

IMPORT / EXPORT
POST   /api/v1/import/objectives
       Content-Type: multipart/form-data
       Body: {file: .xlsx, import_job_id?: uuid}
       Response: {
         import_job_id,
         status: 'VALIDATED'|'FAILED',
         validation_errors: [{sheet, row, field, message}],
         row_count
       }

POST   /api/v1/import/objectives/:import_job_id/commit
       Response: {status: 'COMMITTED', objectives_created, kpis_created}
       Errors: 409 IMPORT_JOB_EXPIRED | IMPORT_JOB_ALREADY_COMMITTED

GET    /api/v1/export/objectives
       Query: employee_id?, fiscal_year?, month?, format=xlsx|csv
       Response: file download
       Errors: 400 EXPORT_EXCEEDS_LIMIT

SCORES / DERIVED DATA
GET    /api/v1/scores/employee/:employee_id
       Query: fiscal_year, cadence=MONTHLY|QUARTERLY|HALF_YEARLY|ANNUAL, period
       Response: {oem?, oeq?, oeh?, oea?, objectives: [{...with percent}]}

GET    /api/v1/scores/team
       Query: fiscal_year, cadence, period, cursor, limit
       Response: paginated list of employee scores

V1 NOTE: Leaderboard, status-distribution, and hall-of-fame are V1 read-only endpoints.
PDF export endpoints are V2; do not implement in V1.

EXECUTIVE SUMMARY
GET    /api/v1/executive/leaderboard
       Query: fiscal_year, cadence, period, department?, division?, cursor, limit
       Response: paginated ranked list

GET    /api/v1/executive/status-distribution
       Query: fiscal_year, month, department?, division?
       Response: {not_started, at_risk, off_track, on_track, achieved, total}

GET    /api/v1/executive/hall-of-fame
       Response: {most_consistent: [top10], top_annual: [top10]}

-- V2 only: POST /api/v1/executive/export/pdf
-- V2 only: GET /api/v1/executive/export/pdf/:job_id

NOTIFICATIONS
GET    /api/v1/notifications
       Query: status=UNREAD|READ|ALL, cursor, limit
       Response: paginated notification list

PATCH  /api/v1/notifications/:id/read
       Response: {notification}

POST   /api/v1/notifications/read-all
       Response: {marked_count}

================================================================================
PART 28 — ERROR HANDLING AND UX CONTRACTS
================================================================================

28.1 Error Display Hierarchy
1. Field-level validation errors: render inline below the relevant field. Never as toast.
2. Form-level / state errors: render as inline error banner inside the form or modal header. Never as toast.
3. Network errors (no response) and server errors (5xx): render as a single dismissible toast. Does not auto-dismiss.
4. Success confirmations: dismissible toast, auto-dismisses after 4 seconds.
5. Blocking conditions (e.g., action disabled due to precondition): button disabled + inline explanatory text. Never wait for the user to click and fail.

28.2 Confirmation Dialogs (Required For)
- Delete any entity (Objective, KPI, KPI Cycle).
- Force close a month.
- Bulk delete.
- Bulk deactivate users.
- Submit a PMS Review (Manager and Admin).
- Override an approval.
Every confirmation dialog must state the specific impact. No generic "Are you sure?" dialogs.

28.3 Unsaved Data Warning
Triggered when: Employee has typed an actual_value or comment and navigates away without submitting. Warning is an inline overlay/dialog. Employee must choose: Discard or Stay.

28.4 Optimistic UI Rule
- UI must not show a confirmed state before the server response is received.
- Loading state shown during API call. Final state shown only after server confirms.

28.5 API Error Response (Canonical Shape)
type APIError = {
  error: {
    code: ErrorCode;          // machine-readable constant
    message: string;          // human-readable
    fields?: Array<{
      field: string;          // dot-notation path, e.g. "weightage" or "kpis.0.target"
      message: string;
    }>;
    request_id?: string;      // for server error tracing
  }
}

28.6 Complete Error Code Registry

VALIDATION_FAILED              400  General field validation
WEIGHTAGE_SUM_INVALID          400  Weightage does not sum to 100
TARGET_EQUALS_STANDARD         400  KPI target = standard (INCREASE/DECREASE/CUMULATIVE)
CONTROL_STANDARD_EXCEEDS_TARGET 400 CONTROL KPI: standard > target
CYCLE_TARGET_EQUALS_STANDARD   400  Custom target cycle: target = standard
TIMELINE_INVALID_DATE          400  Timeline date out of valid range
TIMELINE_CROSS_MONTH           400  Timeline spans multiple months
TIMELINE_TOO_SHORT             400  Timeline < 7 days
IMPORT_VALIDATION_FAILED       400  Excel import has validation errors
MISSING_REASON                 400  Force close or reopen called without reason
PERMISSION_DENIED              403  Role lacks authority for action
BOD_WRITE_FORBIDDEN            403  BoD Admin attempted a write action
IMMUTABILITY_VIOLATION         403  Attempt to modify immutable data
DERIVED_CADENCE_IMMUTABLE      403  Attempt to write to derived cadence
UNAUTHORIZED_APPROVAL_ATTEMPT  403  Approval for non-direct-report
INVALID_CREDENTIALS            401  Login failed
SESSION_EXPIRED                401  Session token expired
INVALID_STATE_TRANSITION       409  State machine transition not permitted
CONCURRENT_MODIFICATION        409  Optimistic lock version mismatch
MAX_SUBMISSIONS_EXCEEDED       409  4th submission attempt
CHILD_ALREADY_MAPPED           409  Objective already has a parent mapping
CIRCULAR_MAPPING_BLOCKED       409  Circular reference detected in objective mapping
OBJECTIVE_DUPLICATION_BLOCKED  409  Duplicate objective identity in target
TIMELINE_LOCKED                409  Timeline cannot be changed after first submission
LAST_CYCLE_DELETION_BLOCKED    409  Cannot delete the only cycle for a KPI
OBJECTIVE_HAS_EXECUTION_DATA   409  Cannot delete objective with submitted/approved cycles
KPI_HAS_EXECUTION_DATA         409  Cannot delete KPI with submitted/approved cycles
MOVE_BLOCKED_HAS_EXECUTION_DATA 409 Cannot move objective with execution data
PMS_REVIEW_EXISTS              409  PMS Review already exists for this period
IMPORT_JOB_EXPIRED             409  Import job older than 24 hours
IMPORT_JOB_ALREADY_COMMITTED   409  Import job already executed
EXPORT_EXCEEDS_LIMIT           400  Export would exceed 10,000 rows
PRECONDITION_FAILED            412  Approve/reject attempted with missing actual values
ATTRIBUTE_IN_USE               409  Cannot delete attribute with active references
USER_ALREADY_EXISTS            409  Email or username already taken
RATE_LIMIT_EXCEEDED            429  Too many requests
INTERNAL_SERVER_ERROR          500  Unexpected server error (include request_id)

================================================================================
PART 29 — SECURITY AND COMPLIANCE
================================================================================

29.1 Authentication
- BetterAuth session management. HTTP-only cookie sessions.
- CSRF protection on all state-changing routes.
- Session expiry: 24 hours of inactivity.

29.2 Organisation Scoping
- organisation_id constant in server config. Never from client.
- Every Drizzle query includes the organisation_id scope.

29.3 Input Sanitization
- All inputs validated via Zod schemas before Service layer.
- Drizzle ORM parameterized queries — no raw SQL interpolation.

29.4 Rate Limiting
- 100 requests/minute per authenticated user (HTTP 429 + RATE_LIMIT_EXCEEDED).
- 20 requests/minute per user for import endpoints.
- Applied at Vercel edge.

29.5 Sensitive Data
- Passwords: bcrypt-hashed. Never logged, never in responses.
- Session tokens: HTTP-only cookies. Never in response bodies.

29.6 BoD Admin Security
- executive_label check performed server-side in every Service function that performs a write.
- UI restriction alone is not sufficient.

================================================================================
PART 30 — PERFORMANCE, INDEXING AND CONCURRENCY
================================================================================

30.1 Cursor Pagination Specification
Cursor encoding: base64url(JSON.stringify({created_at: ISO_STRING, id: UUID}))
Cursor decoding: parse the JSON, use created_at and id for WHERE clause:
  WHERE (created_at, id) < (:cursor_created_at, :cursor_id)  [for DESC order]
  ORDER BY created_at DESC, id ASC
  LIMIT :limit + 1  [fetch one extra to determine has_more]

30.2 Optimistic Locking
- version INTEGER NOT NULL DEFAULT 1 on all mutable entities.
- On UPDATE: WHERE id = :id AND version = :expected_version. If 0 rows affected → HTTP 409 + CONCURRENT_MODIFICATION.
- On success: SET version = version + 1.
- Client always reads the current version before any update.

30.3 Required Indexes

-- Global
CREATE INDEX ON objectives(organisation_id, employee_id, fiscal_year, month);
CREATE INDEX ON objectives(employee_id, status) WHERE deleted_at IS NULL;
CREATE INDEX ON kpis(objective_id) WHERE deleted_at IS NULL;
CREATE INDEX ON kpis(kpi_state);
CREATE INDEX ON kpi_cycles(kpi_id, state);
CREATE INDEX ON kpi_cycles(kpi_id, cycle_start_date);
CREATE INDEX ON kpi_submissions(kpi_cycle_id, created_at DESC);
CREATE INDEX ON pms_reviews(organisation_id, employee_id, period_type, fiscal_year);
CREATE INDEX ON pms_reviews(status);
CREATE INDEX ON in_app_notifications(recipient_user_id, status, created_at DESC);
CREATE INDEX ON in_app_notifications(recipient_user_id) WHERE status = 'UNREAD';
-- CREATE INDEX ON kpi_library_templates(organisation_id, status);  -- V2 table; deferred
CREATE INDEX ON idempotency_records(idempotency_key, user_id);
CREATE INDEX ON idempotency_records(expires_at);  -- for cleanup job
CREATE INDEX ON import_jobs(organisation_id, expires_at);

30.4 Performance Constraints
- All list endpoints: paginated. No unbounded queries.
- N+1 queries: forbidden. Use JOIN or batch loading.
- Default page size: 25. Maximum: 100.
- Export: maximum 10,000 rows.

================================================================================
PART 31 — TESTING AND VERIFICATION
================================================================================

Every feature is incomplete without passing tests in all applicable categories. An untested feature must not be merged.

31.1 Test Categories

RBAC Tests
- Every role + action + endpoint combination that should succeed → returns correct 2xx.
- Every role + action + endpoint combination that should fail → returns correct 403.
- BoD Admin: every write endpoint returns 403 + BOD_WRITE_FORBIDDEN.
- Employee submitting another employee's cycle: 403 + PERMISSION_DENIED.

State Machine Tests
- Every valid transition → succeeds and returns correct new state.
- Every invalid transition → returns 409 + INVALID_STATE_TRANSITION with state unchanged.
- Submission count: increments on submit, does not increment on draft save, does not decrement.
- 3rd submission → submits. 4th submission → 409 + MAX_SUBMISSIONS_EXCEEDED.
- Max iterations notification: fires on 3rd rejection.

Calculation Tests (Unit — Pure Functions)
Each test must specify exact numeric inputs and expected outputs.
- INCREASE formula: normal case, A < S (zero result), A > T (overshoot), T = S (blocked).
- DECREASE formula: normal case, A > S (zero result), A < T (overshoot), T = S (blocked).
- CONTROL formula: A within range (100), A outside range (0), S > T (blocked).
- CUMULATIVE formula: running total, multiple cycles, all-NULL cycles (NULL result).
- MonthlyKPIPercent: FIXED SUM, FIXED AVERAGE, CUSTOM, CUMULATIVE.
- Null cycle exclusion: cycle with actual_value = 0 included; actual_value = NULL excluded.
- ObjectivePercent: normal, all-NULL KPIs (NULL result), mixed NULL/non-NULL KPIs.
- OEM: normal, force-closed month, all-NULL objectives (non-force-closed → NULL OEM).
- OEQ, OEH, OEA: valid months only, force-closed month in denominator, all-NULL month exclusion.
- Auto Split: N=1, N=3, N=7 (verify delta on last objective), sum always = 100.00.
- Hall of Fame calculations: on_track_rate threshold, tie-breaking.

Weightage Tests
- Objective weightages sum < 100 → save blocked (400 + WEIGHTAGE_SUM_INVALID).
- Objective weightages sum > 100 → save blocked.
- KPI weightages sum ≠ 100 → save blocked.
- Auto Split result sum = exactly 100.00 for N = 1, 3, 7, 10.
- Import with invalid weightages → all-or-nothing failure.

Optimistic Locking Tests
- Update with correct version → success, version incremented.
- Update with stale version → 409 + CONCURRENT_MODIFICATION, no state change.
- Two concurrent updates, one should succeed and one should fail.

Idempotency Tests
- Submit with Idempotency-Key → success.
- Re-submit with same Idempotency-Key within 24 hours → same response, no duplicate record.
- Re-submit after 24 hours → new processing.

KPI Timeline Tests
- WEEKLY generation: verify exact cycle dates for 28-day, 30-day, 31-day months.
- WEEKLY generation: final short cycle has correct dates.
- MONTHLY generation: single cycle spanning full timeline.
- Timeline redefine: DRAFT cycles deleted and regenerated.
- Timeline lock: redefine after first SUBMITTED cycle → 409 + TIMELINE_LOCKED.
- Timeline cross-month → 400 + TIMELINE_CROSS_MONTH.
- Timeline < 7 days → 400 + TIMELINE_TOO_SHORT.

CUMULATIVE KPI Tests
- Creation: standard must be 0, target_type must be FIXED, aggregation must be SUM.
- Creation: target = 0 → 400 + TARGET_EQUALS_STANDARD.
- actual_value = 0 entry: included in running total.
- actual_value = NULL: excluded from running total.
- MonthlyKPIPercent = running_total / T × 100.

Objective Mapping Tests
- Single parent constraint: second mapping for same child → 400 + CHILD_ALREADY_MAPPED.
- Circular mapping: blocked at write time with HTTP 409 + CIRCULAR_MAPPING_BLOCKED.
- Circular fallback: if cycle exists in data, contributions excluded, direct KPIs only.
- Score propagation: verify parent ObjectivePercent with mapped child.

PMS Review Tests
- Eligibility: DRAFT cycle blocks initiation.
- Eligibility: SUBMITTED cycle blocks initiation.
- Eligibility: CANCELLED_BY_SYSTEM cycle does not block.
- Snapshot immutability: snapshot_json unchanged after manager review.
- CLOSED review: all modification attempts → 403 + IMMUTABILITY_VIOLATION.
- KPI IMMUTABLE state: set on all KPIs in period when PMS closed.

Force Close Tests
- SUBMITTED cycle → CANCELLED_BY_SYSTEM with force_closed = TRUE.
- REJECTED cycle → CANCELLED_BY_SYSTEM with force_closed = TRUE.
- DRAFT cycle → stays DRAFT with force_closed = TRUE, actual_value = NULL.
- APPROVED cycle → unchanged.
- Force-closed month included in OEQ denominator.

Import Tests
- Valid file → VALIDATED status.
- File with weightage violation → FAILED, correct error row.
- File with CUMULATIVE standard ≠ 0 → FAILED.
- File with orphaned KPI reference → FAILED.
- Commit valid job → COMMITTED, objects created.
- Commit already-committed job → 409 + IMPORT_JOB_ALREADY_COMMITTED.
- Commit expired job → 409 + IMPORT_JOB_EXPIRED.

Organisation Scoping Tests
- All repository queries include organisation_id in WHERE clause (static analysis check).
- All queries include deleted_at IS NULL for soft-delete entities.

Concurrency Tests
- Two simultaneous submissions for same cycle → one succeeds, one gets 409.
- Two simultaneous approvals → one succeeds, one gets CONCURRENT_MODIFICATION.

================================================================================
PART 32 — CUSTOM RBAC — PHASE 2 RESERVED
================================================================================

Deferred to the final development phase. No schema, no service, no UI exists in V1.
Before implementation: this section must be expanded into a fully normative specification with rules, state machines, UI contracts, and schema additions.

Planned scope (non-authoritative):
- Admin defines custom roles in addition to built-in roles.
- Per-role, per-module permission matrix (View / Create / Edit / Delete toggles).
- Built-in roles (Admin, Manager, Employee, BoD Admin) retain fixed permissions and cannot be modified.

================================================================================
PART 33 — SSOT GOVERNANCE
================================================================================

1. This SSoT V1.1-FINAL is the only authoritative document for THE COMPASS Single-Tenant Edition V1.
2. All prior documents (V1.0, V1.1_LOCKED, V1.1 planning artifacts, conversation logs, sketches) are archived and non-authoritative.
3. Any behavior change requires a versioned SSoT update before implementation begins.
4. During active development, changes are recorded in a change log and reconciled into the next version.

================================================================================
PART 34 — GLOSSARY
================================================================================

Term                    Definition
----------------------- -----------------------------------------------------------------
Organisation            Single root entity per deployment
organisation_id         Constant UUID on every table for forward multi-tenant compatibility
ACID                    Atomicity, Consistency, Isolation, Durability — the transaction model used throughout
OEM                     Overall Employee Monthly score
OEQ                     Overall Employee Quarterly score
OEH                     Overall Employee Half-Yearly score
OEA                     Overall Employee Annual score
NULL                    No data entered. Distinct from 0. Causes cycle exclusion from aggregations
0 (zero)                Explicit zero entry. Included in aggregations
Soft Delete             Set deleted_at timestamp. Record hidden from UI and queries
Hard Delete             Physical row removal. KPI Cycles only
Optimistic Locking      Version-based concurrency control. Prevents lost updates
Idempotency Key         Client-provided UUID preventing duplicate processing of repeated requests
Vertical Slice          One PR = schema + repository + service + route + UI + tests for one feature
Cursor                  Opaque base64 token encoding position in a paginated result set
Snapshot                Immutable capture of calculated data written once at PMS Review initiation
IMMUTABLE               KPI state. Permanent read-only, triggered by PMS Review snapshot
LOCKED                  KPI Cycle terminal state triggered by PMS Review snapshot
Batch Approval          Single approval action covering all eligible cycles of one KPI in one month
CUMULATIVE KPI          Metric where each cycle records incremental actual value; monthly % = running total / target
Auto Split              Equal-weight distribution algorithm with deterministic rounding
Hall of Fame            Two ranked lists: Most Consistent Performers and Top Annual Performers
BoD Admin               Admin with executive_label=TRUE. Read-only access to Executive Summary only
Circular Mapping        Objective mapping loop. Blocked at write time; acyclic graph assumed for calculations
Import Job              Two-phase import: validate → commit. Atomic write on commit

================================================================================
PART 35 — APPENDICES (NON-AUTHORITATIVE)
================================================================================

35.1 Formula Quick Reference
1. INCREASE: c_percent = ((A−S)/(T−S)) × 100. Floor at 0 if A ≤ S. No cap.
2. DECREASE: c_percent = ((S−A)/(S−T)) × 100. Floor at 0 if A ≥ S. No cap.
3. CONTROL: 100 if in range, 0 otherwise.
4. CUMULATIVE: MonthlyKPIPercent = (sum of actuals / T) × 100. S always 0.
5. OEM = sum(ObjectivePercent × W) / 100.
6. OEQ/OEH/OEA = sum(valid OEMs) / N (including force-closed NULL months in N).
7. Circular mappings: blocked at write time (HTTP 409). Calculation assumes acyclic graph.

35.2 State Machine Summary (Non-Authoritative)
Authoritative tables in Part 25.
- Objective: LAUNCHED → ONGOING → COMPLETED ↔ ONGOING; any → DELETED (conditions apply).
- KPI: DRAFT → ACTIVE → LOCKED → IMMUTABLE (all terminal). No KPI Library in V1.
- KPI Cycle: DRAFT ↔ SUBMITTED ↔ REJECTED → APPROVED → LOCKED; any → CANCELLED_BY_SYSTEM (terminal).
- PMS Review: MANAGER_REVIEW_PENDING → MANAGER_SUBMITTED → ADMIN_REVIEW_PENDING → CLOSED.

================================================================================
PART 36 — VERSION HISTORY
================================================================================

V1.1-FINAL — April 23, 2026. Production-ready release. Spec-freeze pass + verification audit.
Changes from V1.1_LOCKED:
- Fixed: V1 Exclusions list scoped to 4 deferred features (Email, Dark Mode, PDF Export, KPI Library) (Part 0.5)
- Fixed: Timezone stored on organisation table, not organisation_config (Parts 0.6 Q9, 4.3)
- Fixed: users schema missing full_name — added full_name VARCHAR(255) NOT NULL (Part 24.3)
- Fixed: employees.employee_code changed from nullable to NOT NULL (Part 24.4)
- Fixed: Batch approval eligibility — restricted to SUBMITTED cycles only (Part 10.1)
- Fixed: Circular mappings blocked at write time with HTTP 409 + CIRCULAR_MAPPING_BLOCKED (Parts 11.1, 26.5, 28.6)
- Fixed: Import duplicate rule — removed overwrite mode ambiguity (Part 12.3)
- Fixed: kpi_submissions.state enum removed DRAFT (state-change events only) (Part 24.8)
- Deferred: KPI Library — all schema, service, route, and nav references removed from V1 (Parts 5.1, 21, 23.2, 24.12, 27.5, 30.3)
- Deferred: PDF Export — removed from V1 API; Executive Summary UI remains read-only (Parts 22.5, 27.5)
- Added: system_events audit table for admin action audit trail (Part 24.16)
- Added: CIRCULAR_MAPPING_BLOCKED error code (Part 28.6)
- Updated: Decision Record Q15 (KPI Library deferred to V2)

V1.1 — April 20, 2026. Spec-freeze pass incorporating 78 architectural decisions.
Changes from V1.0:
- Added: Decision Record (78 questions — Part 0.6)
- Added: Strict ACID invariant (Part 1.2)
- Added: NULL vs 0 invariant (Part 1.9)
- Added: Optimistic locking invariant and implementation (Parts 1.10, 23.7, 24 all tables)
- Added: Idempotency invariant and implementation (Parts 1.11, 23.8, 24.14)
- Added: Timezone handling (Parts 0.6 Q9, 4.3, 24.1, 24.13)
- Added: KPI unit (free-text label) field (Parts 0.6 Q13, 7.1, 7.6, 24.6)
- Added: KPI soft versioning definition (Part 0.6 Q11)
- Added: Rate limiting (Parts 0.6 Q53, 29.4)
- Added: Import job model with two-phase commit (Parts 12.4, 24.15, 27.5)
- Added: Idempotency record table (Part 24.14)
- Added: Cursor pagination specification (Parts 0.6 Q48-49, 30.1)
- Added: API versioning as URL prefix (Part 27.1)
- Added: Complete locked endpoint catalogue (Part 27.5)
- Added: Complete error code registry (Part 28.6)
- Added: Explicit state machine tables (Part 25)
- Added: Complete locked calculation formula sheet (Part 26)
- Added: Concurrency test requirements (Part 31)
- Added: No-overlap constraint on kpi_cycles (Part 24.7)
- Changed: PMS initial status is MANAGER_REVIEW_PENDING (not INITIATED) (Part 14.1)
- Changed: Bulk PMS initiate is explicitly non-atomic — partial success documented (Part 12.2.3)
- Removed: 8-week development timeline from Appendix
- Removed: INITIATED as a stored PMS Review status

================================================================================
PART 37 — FINAL AUTHORITY STATEMENT
================================================================================

This document — THE COMPASS Single-Tenant Edition SSoT V1.1-FINAL, effective April 23, 2026 — is the final and sole authority for THE COMPASS. Any conflict between this document and any other artifact is resolved in favor of this document. Any change to system behavior requires a versioned SSoT update before implementation begins. If a behavior is not written here, it does not exist and must not be implemented.

END OF DOCUMENT
================================================================================