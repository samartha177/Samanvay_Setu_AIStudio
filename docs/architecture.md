# Architecture: SAMANVAYSETU prototype

## Component flow

```text
Citizen / Officer UI (React + Vite)
                |
                v
FastAPI Backend: API + JWT/RBAC + Consent + Audit + Orchestration
                |
                v
Interoperability Gateway
  | Department adapters       | Schema Mapper          | Monitoring
  v                           v                        v
Identity   Education   Income mock APIs         Workflow events/retries
  \            |           /
   \-----------v----------/
      Canonical data model
                |
                v
Scholarship validation and final mock Scholarship Department submission
```

## Responsibilities

| Component | Prototype responsibility |
| --- | --- |
| Frontend | Citizen application and consent, officer oversight, dependency graph, mapping/audit visibility, retry action. |
| Backend | Auth, RBAC, request validation, orchestration, audit persistence, user-facing status API. |
| Gateway | Adapter dispatch, timeouts, normalized department errors, retry policy, correlation IDs. |
| Adapters | Translate each department's request/response shapes to the canonical model. |
| Schema mapper | Scores suggested field matches; mapping registry provides deterministic approved mappings. |
| Consent manager | Stores purpose-scoped, time-bounded grants and blocks retrieval without an active grant. |
| Workflow engine | Executes retrieval → transformation → validation → submission as observable steps. |
| Monitoring | Per-step status, timing, error classification, retry count, and audit events. |

## Canonical-data boundary

The first implementation will define Pydantic models whose exact fields are versioned in `shared/`. Expected core fields are:

- `CitizenProfile`: `citizen_id`, `full_name`, `date_of_birth`
- `EducationRecord`: `citizen_id`, `student_name`, `date_of_birth`, `course_name`, `institution_name`, `enrollment_status`
- `IncomeRecord`: `citizen_id`, `applicant_name`, `annual_income`, `financial_year`
- `ScholarshipApplication`: `application_id`, `citizen_id`, `course_name`, `annual_income`, `eligibility_status`, `workflow_status`

For example, `Identity.full_name`, `Education.studentName`, and `Income.applicant_name` all map to canonical person-name fields; date formats and income amounts are normalized by the relevant adapter.

## Failure recovery for the demo

Department mock APIs will support a controlled failure mode. The gateway will record a timed-out/unavailable request, apply a bounded retry policy for transient errors, and expose a retry action for a failed workflow step. The UI will show the failure and its recovery using the same backend endpoint used in normal operation.

No production availability, inter-department legal agreement, national identity access, or real citizen data is implied by this prototype.

