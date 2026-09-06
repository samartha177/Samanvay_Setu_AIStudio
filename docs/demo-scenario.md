# Judge demo: scholarship application interoperability

## Seeded citizen

The implementation will seed a fictional applicant, **Aarav Sharma**, and four corresponding fictional department records. No real personal data is used.

| Department | Deliberately different source fields |
| --- | --- |
| Identity | `full_name`, `dob`, `citizen_id` |
| Education | `studentName`, `birthDate`, `courseName` |
| Income | `applicant_name`, `annual_income`, `financial_year` |
| Scholarship | receives the canonical submission shape |

## Demo script

1. Citizen signs in and selects the scholarship service.
2. The UI presents purpose-specific consent for identity, education, and income verification; the backend records the grant.
3. The workflow graph shows the three departmental dependency checks before scholarship submission.
4. The gateway invokes the three independent mock APIs. The adapter view shows the heterogeneous payloads transformed to canonical records.
5. The workflow validates matching identity/DOB and income eligibility, then submits to the Scholarship Department.
6. The citizen sees the submitted/eligible decision; the officer sees the audit trail and dependency graph.
7. The demonstrator enables a transient Income Department failure and starts/retries an application. Monitoring shows the failed attempt, bounded retry, recovery, and final completion.

## Evaluation points made visible

- Existing systems are connected rather than replaced.
- Semantic and format differences are normalized at adapters.
- Consent gates all data exchange.
- A dependency graph makes multi-department service delivery intelligible.
- Failure is observable and recoverable.
- Mapping suggestions are AI-assisted but execution is deterministic and reliable.

