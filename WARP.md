# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

Delore is a full‑stack staff management app: React SPA (client/) + Express API (server/) + MongoDB. Auth is JWT-based with role gating (staff vs admin). The server also serves the built React app in production.

## Commands (common)

### Install & env setup
```powershell
# Install dependencies (run in each package)
cd server; npm install; cd ../client; npm install; cd ..

# Configure server env
cd server
copy .env.example .env   # Ensure MONGODB_URI and JWT_SECRET are set
```

### Run in development (two terminals)
```powershell
# Terminal A (API)
cd server
npm run dev   # http://localhost:5000

# Terminal B (web)
cd client
npm start     # http://localhost:3000 (proxy -> :5000)
```

### Tests
```powershell
# Frontend tests (CRA + Jest)
cd client
npm test                    # watch mode
npm test -- -t "pattern"    # run tests matching name pattern
npm test -- src/foo.test.js # run a single test file
# Backend: no test scripts defined
```

### Build and run (production)
```powershell
# Build React and serve via Express
cd server
npm run build   # builds client into client/build
npm start       # serves API + static client on :5000
```

### Utilities (root scripts)
```powershell
node generate-jwt-secret.js   # print a strong JWT secret
node test-db-connection.js    # verify MongoDB connectivity
node create-admin-user.js     # seed an initial admin (local dev)
```

## Architecture (big picture)

- Process model
  - Dev: separate React dev server (CRA) and Express API (CORS + CRA proxy).
  - Prod: Express serves REST endpoints and the built SPA from client/build.
- Server (server/)
  - server.js: validates JWT_SECRET and MONGODB_URI; connects to MongoDB with retry; mounts route groups under /api/*; serves /uploads statically; catch‑all serves index.html.
  - Auth: middleware/auth.js provides auth() and adminAuth(); JWT payload contains userId and role.
  - Route domains: auth, admin, documents, tasks, payments, messages, clients; health at /api/health.
  - Data: Mongoose models for User/Task/Document/Payment/Message/Client/ActivityLog; uploads stored on disk under server/uploads.
- Client (client/src)
  - AuthContext sets/clears axios Authorization header from localStorage token; checks /api/auth/me on load.
  - App.js defines ProtectedRoute/PublicRoute and redirects admins to /admin via DashboardRouter.
  - CRA proxy forwards /api/* to http://localhost:5000 in dev.

Notes
- Public self‑registration is disabled; create staff via admin flows. For first‑time setup, POST /api/auth/create-admin (returns credentials—change immediately).
- No monorepo workspace tooling; run npm commands inside server/ and client/ separately.

## Environment

- Required (see server/.env.example): MONGODB_URI, JWT_SECRET, PORT (default 5000), NODE_ENV.
- Health check: GET /api/health → { message: 'Delore server is running!' }.

## Deployment

- Render is used; server/package.json runs build (installs client and builds) during deploy; then npm start serves API + SPA.
- See DEPLOYMENT.md for service config, Node version (18+), and post‑deploy admin creation.
