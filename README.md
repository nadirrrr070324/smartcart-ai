# SmartCart AI — Online Shopping Cart Optimizer

Pick products, set a budget, and let Dynamic Programming build your
highest-utility cart. Frontend is React + Vite + Tailwind; the optimizer
also ships as a FastAPI backend (`backend/`).

## Frontend (Vercel)

- Framework: Vite — build `npm run build`, output `dist`
- `vercel.json` pins that for zero-config deploys
- Local dev: `npm install`, then `npm run dev`

## Backend (Render, Docker)

- App: `backend/app/main.py` (`backend.app.main:app`)
- Endpoints: `GET /`, `GET /health`, `POST /solve /scenarios /compare /path /trace /curve`
- Local dev:
  ```powershell
  python -m venv backend/.venv
  backend/.venv/Scripts/Activate.ps1
  pip install -r backend/requirements.txt
  uvicorn backend.app.main:app --reload --port 8000
  ```
- Render deploys the repo via `render.yaml` using `backend/Dockerfile.render`
  (uvicorn on `$PORT`).

## Verify

- Frontend: `npm run typecheck && npm run test && npm run build`
- Backend: `backend/.venv/Scripts/python.exe -m pytest backend -q` (once tests exist)
