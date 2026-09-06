# SAMANVAYSETU — Innovexa

Functional prototype for Smart India Hackathon 2026, problem statement **SIH26129**: interoperable government digital services without replacing departmental platforms.

SAMANVAYSETU demonstrates one end-to-end service: a citizen submits a scholarship application; the platform collects consented identity, education, and income records from independent mock departments; transforms differing schemas into one canonical model; validates eligibility; and submits the final result to the scholarship department.

## Status

**Phase 1 complete: runnable FastAPI foundation and React/Vite application shell.** Department integrations, authentication, persistence, mapping, and workflow behavior remain intentionally out of scope until later phases.

## Architecture decisions

- **One backend gateway/orchestrator:** FastAPI exposes the UI-facing API, enforces JWT/RBAC, manages consent, orchestrates the workflow, records audits, and normalizes errors.
- **Four independent mock APIs:** identity, education, income, and scholarship services have distinct endpoints and incompatible payloads. They will run separately so latency/failure/retry behavior is real in the demo.
- **Canonical model at the integration boundary:** adapters transform departmental payloads into `CitizenProfile`, `EducationRecord`, `IncomeRecord`, and `ScholarshipApplication` models. Department-specific shapes never leak to workflow decisions or the UI.
- **AI with deterministic fallback:** an AI mapping adviser may recommend field matches, but a versioned mapping registry is authoritative for the demo. The workflow must succeed when no AI key is configured.
- **Prototype-focused persistence:** PostgreSQL holds users, consent grants, applications, workflow runs, mappings, and immutable audit events. Mock departments use seeded in-memory data initially, which makes reset and judge demos reliable.

Full component boundaries are in [docs/architecture.md](docs/architecture.md). The judge-facing flow is in [docs/demo-scenario.md](docs/demo-scenario.md).

## Planned workspace layout

```text
backend/                  FastAPI gateway, orchestration, adapters, and domain models
frontend/                 React + Vite citizen/officer interface
mock-services/
  identity/               Independent mock Identity Department API
  education/              Independent mock Education Department API
  income/                 Independent mock Income Department API
  scholarship/            Independent mock Scholarship Department API
shared/                   Contract notes and canonical model specifications
docs/                     Architecture, runbook, demo script, API notes
tests/                    Cross-service and end-to-end tests
```

## Delivery plan

1. **Foundation:** initialize FastAPI and React/Vite apps, health checks, environment loading, lint/test scripts, and local run instructions. **Complete.**
2. **Department simulation:** implement seeded, independently runnable mock APIs with intentionally heterogeneous schemas and controllable faults.
3. **Interoperability core:** add canonical Pydantic models, adapters, deterministic mapping registry, optional AI mapping adviser, and mapping review endpoint.
4. **Trust and workflow:** add JWT/RBAC, consent capture/enforcement, scholarship orchestration, eligibility decisioning, audit events, and PostgreSQL persistence.
5. **Demo UI:** citizen application/consent journey; officer workflow detail; React Flow dependency graph; mapping and audit views.
6. **Operational demo:** live monitoring, retry/fallback controls, failure injection, end-to-end tests, seed/reset command, API documentation, and judge runbook.

Each phase is implemented, run, tested, fixed, and documented before moving to the next.

## Local prerequisites

- Git
- Python 3.11+ with permission to execute `python`/`py`
- Node.js 20+ **with npm**
- Docker Desktop with Compose (recommended for PostgreSQL; a documented local PostgreSQL alternative will be supported)

Copy `.env.example` to `.env` before running a future implementation phase. Never commit `.env` or provider keys.

## Run Phase 1 locally

Start the backend:

```powershell
cd backend
py -3 -m pip install --user -r requirements.txt
py -3 -m uvicorn app.main:app --reload --port 8000
```

In a second terminal, start the frontend:

```powershell
cd frontend
Copy-Item .env.example .env
npm install
npm run dev
```

Open `http://127.0.0.1:5173/login`. The green **Gateway online** status confirms that the browser reached `http://127.0.0.1:8000/api/v1/health`. Interactive API documentation is at `http://127.0.0.1:8000/docs`.

## Phase 1 scope

Implemented: modular backend packages, a health endpoint, CORS for local Vite development, a typed frontend health client, responsive routing, and the SAMANVAYSETU visual foundation.

Not implemented yet: sign-in, JWT/RBAC, database models, mock department APIs, schema mapping, consent, workflows, service graph, monitoring, and retry controls. Pages for those capabilities are deliberately identified as planned rather than showing inactive controls.
