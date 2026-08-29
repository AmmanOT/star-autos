# STAR AUTOS

Suzuki spare parts POS — **React (Vercel)** + **NestJS (Render)** + **PostgreSQL (Neon)**.

## Staff login

| Role | Username | Password |
|------|----------|----------|
| SA / Admin | `sa` | `1234` |

## Architecture

```
Browser → Vercel (Vite/React)
              ↓ VITE_API_URL
         Render (NestJS /api)
              ↓ DATABASE_URL (SSL)
         Neon (PostgreSQL)
```

## Local development

### 1. PostgreSQL

Use any Postgres (local install or `docker compose up -d db` on port **5433**). Copy env:

```bash
cd backend
copy .env.example .env
```

Set `DATABASE_*` (or `DATABASE_URL`). First boot with wipe:

```
SEED_ON_START=true
SEED_RESET=true
```

After the API starts once, set `SEED_RESET=false`.

### 2. API

```bash
cd backend
npm install
npm run start:dev
```

API: http://localhost:3000/api · Swagger: http://localhost:3000/api/docs

### 3. Web

```bash
npm install
npm run dev
```

http://localhost:5173 — Vite proxies `/api` → `localhost:3000`.

---

## Deploy (free tiers)

### A. Neon (PostgreSQL)

1. Create a project at [neon.tech](https://neon.tech) (free).
2. Copy the connection string (include `?sslmode=require`).
3. You will paste it into Render as `DATABASE_URL`.

### B. Render (NestJS API)

1. Push this repo to GitHub.
2. [Render](https://dashboard.render.com) → **New Web Service** → connect the repo.
3. Settings:

| Field | Value |
|--------|--------|
| Root Directory | `backend` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm run start:prod` |
| Health Check Path | `/api/health` |
| Plan | Free |

4. Environment variables:

```
NODE_ENV=production
DATABASE_URL=<neon connection string>
JWT_SECRET=<long random secret>
CORS_ORIGIN=https://YOUR-APP.vercel.app
SEED_ON_START=true
SEED_RESET=false
TYPEORM_SYNC=true
```

5. Deploy. Open `https://YOUR-API.onrender.com/api/health`.

Free Render sleeps after idle; the first request can take 30–60s.

Optional: use [`render.yaml`](./render.yaml) as a Blueprint (still set `DATABASE_URL` and `CORS_ORIGIN` manually).

### C. Vercel (React)

1. [Vercel](https://vercel.com) → Import the same GitHub repo (root `.`, framework Vite).
2. Environment variable:

```
VITE_API_URL=https://YOUR-API.onrender.com
```

(no trailing slash — the app appends `/api`)

3. Deploy. Then set Render `CORS_ORIGIN` to the exact Vercel URL and redeploy the API if needed.

### Smoke test

1. `GET /api/health` on Render  
2. Login on Vercel with admin credentials above  
3. Create a bill or payment  

---

## Features

- JWT auth (admin + employee) with permissions
- Inventory, customers, ledger, POS billing, payments, reports
- Activity logs
- Toasts on create / update / delete
- Urdu / English + dark mode
- Thermal receipt print (AS CodeWorks footer)

## Note

This app is **not** meant to run in Docker for production. Use Neon + Render + Vercel as above.
