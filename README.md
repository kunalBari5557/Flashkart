# Sales Platform

This repository contains the frontend and backend for the FlashKart sales platform.

## Project structure

/
├── client/
│   ├── package.json
│   ├── package-lock.json
│   └── src/
├── server/
│   ├── package.json
│   ├── package-lock.json
│   ├── src/
│   ├── migrations/
│   └── docker-compose.yml
├── .github/
│   └── workflows/
├── README.md
└── .gitignore

## Local development

### Frontend

```bash
cd client
npm ci
cp .env.example .env
npm run dev
```

### Backend

```bash
cd server
cp .env.example .env
npm ci
npm run migration:run
npm run dev
```

### Shared services

Start PostgreSQL + Redis from the server directory:

```bash
cd server
docker compose up -d postgres redis
```

## Render deployment setup

For Render, set the root directory to `server` and use:

```bash
npm install
npm run build
```

Start command:

```bash
npm run start
```

Environment variables to add in Render:

```env
DATABASE_URL=postgresql://postgres:yourpassword@yourhost:5432/flashkart
REDIS_URL=redis://your-redis-host:6379
JWT_SECRET=your-secret-key
NODE_ENV=production
PORT=10000
```

This project expects the backend runtime values from the server environment configuration and the app health endpoint at `/health`.

## CI/CD architecture

GitHub Actions is the single source of truth for deployment.

Developer
  ↓
GitHub
  ↓
Pull Request -> CI validation
  ↓
Merge to main
  ↓
GitHub Actions CI
  ↓
GitHub Actions CD
  ├── TypeORM migration run
  ├── Render backend deploy
  └── Vercel frontend deploy

## GitHub Actions workflow behavior

### Pull requests to main

CI runs for both the client and server without deploying anything.

### Push to main

CI runs first. If CI succeeds, production deployment proceeds in the separate deploy workflow.

## Required GitHub secrets

Create these repository or environment secrets in GitHub:

- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
- `RENDER_DEPLOY_HOOK`
- `DATABASE_URL`
- `PRODUCTION_API_URL`
- `PRODUCTION_FRONTEND_URL`

### Notes

- `DATABASE_URL` should be the Render PostgreSQL connection string.
- `PRODUCTION_API_URL` should point to the live backend URL, for example `https://your-render-app.onrender.com`.
- `PRODUCTION_FRONTEND_URL` should point to the production Vercel URL.

## Vercel configuration

- Disable automatic Git deployments in the Vercel dashboard.
- Use the Vercel CLI from GitHub Actions only.
- Keep deployment controlled by the `deploy.yml` workflow.

## Render configuration

- Disable auto deploy in the Render dashboard so GitHub Actions is the deployment trigger.
- Keep the Render service connected to the repository, but set Render auto deploy to off.
- Use the Render deploy hook stored in `RENDER_DEPLOY_HOOK`.

## Production deployment order

1. CI pass on main
2. Run TypeORM migrations
3. Trigger Render backend deployment
4. Poll `/health` until it responds successfully
5. Deploy frontend to Vercel
6. Verify frontend and backend availability

## Environment variables

Frontend:

```env
VITE_API_URL=https://your-render-api-url
```

Backend:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
REDIS_URL=redis://host:6379
JWT_SECRET=replace-me
NODE_ENV=production
PORT=3000
```

Do not commit real secrets or `.env` files to GitHub.

## Rollback strategy

- Redeploy the previous successful GitHub commit via GitHub Actions if the latest deployment fails.
- Redeploy the previous Vercel frontend version from the Vercel dashboard.
- Redeploy the backend from Render if needed.
- Keep database migrations backward-compatible where possible.

## Manual deployment test

```bash
git checkout main
git pull
# merge feature branch locally or via PR
git push origin main
```

Once pushed to `main`, the GitHub Actions workflows handle CI and production deployment automatically.
