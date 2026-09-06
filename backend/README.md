# SAMANVAYSETU backend

FastAPI gateway foundation. The only implemented functional endpoint in Phase 1 is:

- `GET /api/v1/health` — gateway liveness and runtime metadata

Run locally from this directory:

```powershell
py -3 -m pip install --user -r requirements.txt
py -3 -m uvicorn app.main:app --reload --port 8000
```

Interactive API documentation is available at `http://localhost:8000/docs`.

The `adapters`, `gateway`, `workflow`, `consent`, `monitoring`, `ai`, `graph`, `database`, and `auth` packages are intentional Phase 1 extension points. They contain no false implementation yet.
