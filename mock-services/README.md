# Simulated government department systems

These are **local, simulated APIs for the SIH prototype**. They do not connect to, represent, or expose any real government system or citizen data.

Each department has a separate FastAPI application, process, seed store, OpenAPI document, and API contract.

| Service | Port | Contract |
| --- | ---: | --- |
| Identity Department | 8001 | `GET /citizens/{citizen_id}` returns a direct snake_case citizen record. |
| Education Department | 8002 | `GET /students/{student_id}` returns a camelCase record nested under `student`. |
| Income Department | 8003 | `GET /income/{citizen_id}` returns an income record nested under `income_record`. |
| Scholarship Department | 8004 | `POST /applications` accepts the final canonical scholarship payload. |

Every service also exposes `GET /health` and interactive API documentation at `/docs`.

## Run locally

From the repository root, start each service in a separate terminal:

```powershell
py -3 -m uvicorn identity_service.main:app --app-dir mock-services/identity --port 8001
py -3 -m uvicorn education_service.main:app --app-dir mock-services/education --port 8002
py -3 -m uvicorn income_service.main:app --app-dir mock-services/income --port 8003
py -3 -m uvicorn scholarship_service.main:app --app-dir mock-services/scholarship --port 8004
```

Use the fictional demo identity `CIT-1001` and education record `STU-5001` for Aarav Sharma.
