# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project overview
Delore is a full‑stack staff management app: React (client/) + Express (server/) + MongoDB. Auth is JWT‑based with role gating (staff vs admin). In production the Express server serves the built React app.

## Commands

- Install and environment
  ```powershell
  # Install deps per package
  cd server; npm install; cd ../client; npm install; cd ..

  # Create local env from example
  cd server
  copy .env.example .env   # Ensure MONGODB_URI and JWT_SECRET are set
  ```

- Run in development (two terminals)
  ```powershell
  # Terminal A (API)
  cd server
  npm run dev   # http://localhost:5000

  # Terminal B (web)
  cd client
  npm start     # http://localhost:3000 (proxy -> :5000)
  ```

- Tests (frontend only via CRA/Jest)
  ```powershell
  cd client
  npm test                         # watch mode
  npm test -- -t "pattern"         # run by name pattern
  npm test -- src/foo.test.js      # run a single test file
  ```
  Backend: no test scripts defined.

- Build and run (production)
  ```powershell
  cd server
  npm run build   # runs client build (see server/package.json)
  npm start       # serves API + static client on :5000
  ```

- Lint
  No explicit lint scripts are defined. CRA surfaces ESLint warnings during `npm start`.

- Utilities
  ```powershell
  node generate-jwt-secret.js   # prints a strong JWT secret
  ```
  Note: References to `test-db-connection.js`/`create-admin-user.js` do not exist in this repo.

## Architecture (big picture)

- Runtime model
  - Dev: CRA dev server for the SPA and an Express API, connected via CRA proxy (`client/package.json -> proxy`).
  - Prod: Express exposes REST under `/api/*` and serves the SPA from `client/build` with a catch‑all route.
- Server (`server/`)
  - `server.js` bootstraps: validates `JWT_SECRET`/`MONGODB_URI`, sets TZ to `America/Toronto`, connects to MongoDB with retry, serves `/uploads`, mounts route groups, defines health check, then catch‑all to `index.html`.
  - Route groups (`server/routes/`): `auth`, `documents`, `tasks`, `payments`, `messages`, `admin`, `clients`, `leaveRequests`, `reports`. Health: `GET /api/health`.
  - Data: Mongoose models (e.g., User/Task/Document/Payment/Message/Client/ActivityLog). File uploads are stored under `server/uploads`.
- Client (`client/src`)
  - `App.js` wires routing with `ProtectedRoute`/`PublicRoute`, redirects admins under `/admin` and staff under `/staff/*`.
  - Auth is via a context (`context/AuthContext`) that drives `isAuthenticated/isAdmin`; axios calls hit `/api/*` relying on CRA proxy in dev.

## Environment

- See `server/.env.example` for all keys. Required: `MONGODB_URI`, `JWT_SECRET`, `PORT` (default 5000), `NODE_ENV`. Optional: `EMAIL_USER`, `EMAIL_PASS`, `CLIENT_BASE_URL`.
- Health check: `GET /api/health` → `{ message: 'Delore server is running!' }`.
- Engines: `server/package.json` requires Node >= 18.

## Deployment

- Render deployment via `render.yaml`. `server/postinstall` builds the client; `npm start` serves API + SPA.
- Initial admin: after first deploy you can visit `/api/auth/create-admin` to seed an admin; change the password immediately (see `DEPLOYMENT.md`).
- More details: `DEPLOYMENT.md` (environment, troubleshooting).
