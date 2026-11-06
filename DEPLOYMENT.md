# Deployment

This repository is configured for a free demo deployment using Render (FastAPI),
Neon (persistent PostgreSQL), and Vercel (Vite frontend).

## Render backend

1. In Render, create a Blueprint from this repository and select `render.yaml`.
2. Set the prompted `DATABASE_URL` to the direct, unpooled connection string for
   your Neon project. Use Neon's `DATABASE_URL_UNPOOLED` value, not its pooled
   connection string. Keep this value in Render's environment settings; never
   commit it to the repository.
3. Set the prompted `FRONTEND_URL` to the deployed Vercel site URL.
4. Wait for the service deployment. The API health check is at `/health`.

On startup, the backend creates the tables and seeds the demo dataset only when
the database has no users. Neon offers a free tier with persistent PostgreSQL
storage; its compute may suspend while idle and resume on the next connection.
Render's free web service can also sleep while idle. The app can still use local
SQLite for development, but Render's filesystem is ephemeral, so SQLite data
must not be used for deployment.

## Vercel frontend

1. Import this repository in Vercel and set the project root directory to
   `frontend`.
2. Add the environment variable `VITE_API_URL` with the deployed Render API
   base URL, for example `https://your-service.onrender.com/api/v1`.
3. Deploy or redeploy the frontend.

`frontend/vercel.json` enables client-side route fallback for React Router.
The backend's `FRONTEND_URL` must exactly match the Vercel deployment origin so
the browser's CORS checks pass.
