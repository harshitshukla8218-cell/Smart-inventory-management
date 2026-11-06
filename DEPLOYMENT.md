# Deployment

This repository is configured for a free demo deployment using Render (FastAPI)
and Vercel (Vite frontend).

## Render backend

1. In Render, create a Blueprint from this repository and select `render.yaml`.
2. Set the prompted `FRONTEND_URL` to the deployed Vercel site URL.
3. Wait for the service deployment. The API health check is at `/health`.

The free configuration uses the included SQLite demo database. Render's free
web service has ephemeral storage, so database changes can be lost when the
service restarts or redeploys. Use a persistent managed PostgreSQL database for
production data; that may incur charges.

## Vercel frontend

1. Import this repository in Vercel and set the project root directory to
   `frontend`.
2. Add the environment variable `VITE_API_URL` with the deployed Render API
   base URL, for example `https://your-service.onrender.com/api/v1`.
3. Deploy or redeploy the frontend.

`frontend/vercel.json` enables client-side route fallback for React Router.
The backend's `FRONTEND_URL` must exactly match the Vercel deployment origin so
the browser's CORS checks pass.
