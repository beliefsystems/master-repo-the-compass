# THE COMPASS - Execution SSoT V1.0

Status: Active Constitutional Authority  
Supersedes: Execution planning artifacts  
Deprecated Reference: `docs/SSoT_Compass_V1.1_FINAL.md` remains archived as a deprecated reference and must not override this document.

## 1. Authority

This document is the only constitutional authority for THE COMPASS Execution SSoT V1.0.

All slice documents in this folder are derived execution specifications. They are authoritative only within their bounded slice scope and only insofar as they remain aligned with this master document.

If a slice doc conflicts with this master doc, this master doc wins.

If a behavior is not written in this master doc or in the applicable slice doc, it does not exist.

## 2. Purpose

This document architecture is optimized for AI-driven implementation.

The old SSoT was organized for human reference. This Execution SSoT is organized for deterministic delivery:

- one constitutional master
- one self-sufficient execution spec per slice
- no required cross-document memory during implementation
- implementation-shaped contracts
- verification-driven completion

## 3. Structural Rules

### 3.1 Master and Slice Relationship

- `README.md` is the only constitutional authority.
- Each slice doc is a derived execution brief for one vertical slice.
- Slice docs must be individually usable in isolation during implementation.

### 3.2 Duplication Policy

Duplication is intentional.

If a rule, schema fragment, enum, helper contract, or verification rule must appear in more than one slice, it must be duplicated verbatim where needed.

Cross-reference-by-memory is forbidden.

### 3.3 Invariant Injection Rule

Every slice must copy the invariants it depends on inline.

Slice docs must not say:

- "see master doc"
- "see Section 0"
- "same as prior slice"

for any rule needed during implementation or verification.

### 3.4 Execution Standard

Implementation sections must use implementation-shaped TypeScript, typed payloads, explicit contracts, and deterministic validation rules.

They must not depend on repo-specific symbol names being pre-known by the implementer.

## 4. Locked Stack

The locked implementation stack for V1.0 is:

- SvelteKit 2
- Svelte 5
- TypeScript
- Drizzle ORM
- PostgreSQL
- BetterAuth

Neon may be named in slice docs where a concrete PostgreSQL connectivity pattern is needed. Deployment platform, hosting platform, queue platform, and observability vendor remain intentionally unspecified in this version.

## 5. System Shape

### 5.1 Tenancy

THE COMPASS remains single-tenant in V1.

- one organisation per deployment
- `organisation_id` exists on relevant tables
- `organisation_id` is always server-owned
- `organisation_id` is never accepted from client input

### 5.2 V1 Exclusions

The following are explicitly excluded from V1:

- email delivery
- dark mode
- PDF export
- KPI library

If a later slice needs to mention one of these, it must state it as excluded rather than silently assuming support.

## 6. Global Invariants

These invariants define the minimum constitutional runtime behavior. Each slice must copy the relevant subset inline.

I1. Every repository query that touches organisation-owned data must scope by `organisation_id = ORG_ID_CONSTANT`.

I2. Every query against a soft-deletable table must exclude rows where `deleted_at IS NOT NULL` unless the operation is an explicit restore or admin recovery flow.

I3. Layer 5 utils are pure functions only. They do not query the database, mutate external state, or perform side effects.

I4. Every state-changing workflow executes inside a single database transaction.

I5. `NULL` and `0` are never treated as the same value. `NULL` means no data. `0` means explicit zero.

I6. Every mutable table uses optimistic locking through a `version` integer. Version mismatch returns `409 CONCURRENT_MODIFICATION`.

I7. Idempotency applies only to state-changing HTTP methods: `POST`, `PATCH`, and `DELETE`. It never applies to `GET`.

I8. Weightage totals must equal exactly `100.00` before save or commit.

I9. A user with `executive_label = true` is read-only. Any write attempt returns `403 BOD_WRITE_FORBIDDEN`.

I10. Permission checks are enforced in the Service layer. UI state is never trusted.

I11. Restore of a soft-deleted row is always an explicit service action. Restore is never implicit.

I12. Session validation is performed on every authenticated request before service execution.

## 7. Five-Layer Architecture

### Layer 1 - Routes and Controllers

Files:

- `+server.ts`
- `+page.server.ts`

Responsibilities:

- parse request
- validate input with Zod
- enforce auth presence
- call service layer
- return response

Never:

- query the database directly
- implement business rules
- perform calculation logic

`+page.svelte` belongs to the UI surface, not the controller boundary.

### Layer 2 - Services

Typical location:

- `src/lib/server/services/`

Responsibilities:

- workflows
- state transitions
- rule enforcement
- orchestration across repositories
- permission enforcement

Never:

- write raw SQL
- define formula math inline

### Layer 3 - Repositories

Typical location:

- `src/lib/server/repositories/`

Responsibilities:

- Drizzle-powered data access only
- organisation scoping
- soft-delete filtering by default

Never:

- perform business validation
- enforce workflow rules
- calculate derived scores

### Layer 4 - Schema and Validation Models

Typical location:

- `src/lib/server/db/`
- Zod schemas paired with routes or service boundaries as required

Responsibilities:

- tables
- enums
- constraints
- relations
- data contracts

### Layer 5 - Utils and Pure Helpers

Typical location:

- `src/lib/server/utils/`

Responsibilities:

- calculations
- pure validators
- deterministic helpers

Never:

- access the database
- mutate session state
- emit notifications

## 8. Global Response and Error Contract

All stateful application errors must resolve to a structured error payload:

```json
{
  "code": "ERROR_CODE",
  "message": "Human-readable explanation",
  "fields": [
    { "field": "fieldName", "message": "Validation detail" }
  ],
  "request_id": "optional-correlation-id"
}
```

Rules:

- `fields` is optional and used for validation-style failures.
- `request_id` is optional on client-visible failures and required on unexpected server failures where available.
- Errors thrown in services must use the canonical application error type.
- Route handlers must normalize errors through a single error handler.

Minimum global error codes:

- `VALIDATION_FAILED`
- `PERMISSION_DENIED`
- `BOD_WRITE_FORBIDDEN`
- `SESSION_EXPIRED`
- `CONCURRENT_MODIFICATION`
- `INTERNAL_SERVER_ERROR`

Slice docs may extend this list, but must not redefine existing meanings.

## 9. Naming Standard for Metrics

The only approved metric vocabulary in this Execution SSoT is:

- `base`: required mathematical baseline
- `standard`: optional activation threshold or stricter qualifying threshold
- `target`: goal endpoint

No slice doc may use alternate historical naming.

## 10. Slice Dependency Map

The canonical slice order is:

- `S00` -> Foundation & Infrastructure
- `S-CALC` -> Calculation Engine
- `S01` -> Organisation & Config
- `S02` -> User & Employee Management
- `S03` -> Objectives & Weightage
- `S04` -> KPIs & Timeline
- `S05` -> KPI Cycles & Submission
- `S06` -> Approvals & Overrides
- `S07` -> Month Force Close
- `S08` -> Objective Mapping
- `S09` -> Scores & Derived Views
- `S10` -> PMS Reviews
- `S11` -> Excel Import & Export
- `S12` -> Bulk Operations
- `S13` -> Executive Summary & Hall of Fame
- `S14` -> In-App Notifications
- `S15` -> System Events Audit Trail

## 11. Required Slice Template

Every slice doc must use this order:

1. What This Slice Delivers
2. Depends On
3. Invariants
4. Data Model
5. State Machine
6. Business Rules
7. Permission Matrix
8. API Contracts
9. Implementation - Repository Layer
10. Implementation - Service Layer
11. Implementation - Route Layer
12. Implementation - UI
13. Verification Checklist
14. Done When

If a section is truly not applicable to a slice, it must say `Not applicable in this slice.` rather than being omitted.

## 12. Completion Rule

A slice is complete only when:

- its verification checklist passes in full
- its contracts are internally consistent
- it does not rely on un-copied rules from another slice
- its implementation can be attempted from that slice alone

End of constitutional master.
