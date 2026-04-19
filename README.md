# Campus Sprint Hub

Campus Sprint Hub is a web app for student teams to manage projects: sign up, create or join projects with a join code, plan sprints, and track tasks on a Kanban-style board and backlog view.

- **Frontend:** React (Vite), React Router, Bootstrap — runs in the browser and talks to the API under `/api` (proxied to the backend in development).
- **Backend:** Node.js, Express, Prisma with SQLite, JWT auth and bcrypt for passwords.

## Prerequisites

- **Node.js** (current LTS, e.g. 20.x or 22.x) and **npm** (comes with Node).
- No separate database server: SQLite is used via a local file (`backend/dev.db`).

## Repository layout

| Path | Role |
|------|------|
| `frontend/` | React + Vite UI |
| `backend/` | REST API |
| `scripts/run-dev.mjs` | Optional helper to start frontend and backend together |

## Backend dependencies

Installed with `npm install` inside `backend/`. Main packages:

| Package | Purpose |
|---------|---------|
| `express` | HTTP API |
| `@prisma/client`, `prisma` | Database access and migrations |
| `@prisma/adapter-better-sqlite3` | SQLite driver adapter for Prisma |
| `bcryptjs` | Password hashing |
| `jsonwebtoken` | JWT sessions |
| `cors` | Cross-origin requests |
| `dotenv` | Load `.env` |
| `nodemon` (dev) | Restart server on file changes |

## Frontend dependencies

Installed with `npm install` inside `frontend/`. Main packages:

| Package | Purpose |
|---------|---------|
| `react`, `react-dom` | UI |
| `react-router-dom` | Client-side routing |
| `bootstrap` | Styling |
| `vite`, `@vitejs/plugin-react` (dev) | Dev server and build |

## Environment variables (backend)

Create `backend/.env` (not committed) with at least:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="choose-a-long-random-secret"
PORT=5000
```

- **`DATABASE_URL`** — SQLite file path (relative to `backend/` is typical).
- **`JWT_SECRET`** — secret used to sign login tokens.
- **`PORT`** — API port (default `5000` if omitted).

Optional **frontend** variable:

- **`VITE_API_URL`** — If set, API requests go to this base URL instead of same-origin. Leave unset in dev so Vite’s proxy (`/api` → `http://localhost:5000`) is used.

## Commands

### 1. Backend (first time and each clone)

```bash
cd backend
npm install
```

Create `backend/.env` as above, then apply the schema to SQLite:

```bash
npx prisma migrate dev
```

Start the API (with auto-restart):

```bash
npm run dev
```

Production-style (no nodemon):

```bash
npm start
```

API default: **http://localhost:5000**

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

App default: **http://localhost:5173** (Vite proxies `/api` to port 5000).

Other scripts:

- `npm run build` — production build to `frontend/dist`
- `npm run preview` — preview the production build locally

### 3. Run frontend and backend together (optional)

From the **repository root** (needs Node; does not use a root `package.json`):

```bash
node scripts/run-dev.mjs
```

Stops both when you press **Ctrl+C** (or if one process exits).

## Typical local workflow

1. Configure `backend/.env` and run `npx prisma migrate dev` once in `backend/`.
2. Start backend: `cd backend && npm run dev`.
3. Start frontend: `cd frontend && npm run dev`.
4. Open **http://localhost:5173**, register or log in, then use the dashboard and projects.

## API overview

Protected routes expect a **Bearer** token (`Authorization: Bearer <token>`) from `POST /api/auth/login` or after register/login flow in the UI.

Examples of route groups: `/api/auth`, `/api/projects`, `/api/sprints`, `/api/tasks`. See `backend/README.md` for a shorter endpoint list maintained with the backend.

## Recent changes

### Project discovery and joining

- Projects page now shows **all projects** (`GET /api/projects`) with joined/not joined status.
- Join and create project actions were moved from Dashboard to the **Projects** page.
- Joined projects now show role badges and join code in the list.
- Project page header shows the project join code for easier sharing.

### Project management

- Owners can now update and delete projects from the UI.
- Added project member management endpoints and frontend wiring:
  - `GET /api/projects/:id/members`
  - `POST /api/projects/:id/members`
  - `PATCH /api/projects/:id`
  - `DELETE /api/projects/:id`

### Sprint management

- Added a dedicated **Sprints** tab on the project page (next to Board and Backlog).
- Sprints tab supports create, view, edit, and delete sprint.
- Backend sprint routes now include:
  - `GET /api/sprints/project/:projectId`
  - `PATCH /api/sprints/:id`
  - `DELETE /api/sprints/:id`
  - `GET /api/sprints/:id/completion`
- Sprint cards now show a completion indicator (done/total tasks, percentage, progress bar).

### Task management

- Tasks can now be edited with real backend updates (not local-only):
  - `PATCH /api/tasks/:id`
- Tasks can be deleted through the API:
  - `DELETE /api/tasks/:id`
- Existing task status route is still supported:
  - `PATCH /api/tasks/:id/status`

