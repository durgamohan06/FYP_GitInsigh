# GitInsight AI

> AI-Powered GitHub Project Intelligence Dashboard for Engineering Teams

GitInsight AI transforms your GitHub activity into actionable intelligence — tracking commits, PRs, issues, team performance, and project health in real-time.

---

## Architecture

```
fyp_project/
├── frontend/          ← TanStack Start (React SSR) — Vite, TailwindCSS, shadcn/ui
├── backend/           ← Express.js API server — GitHub OAuth, REST API
├── docs/              ← Architecture & API documentation
├── .gitignore
├── README.md
└── package.json       ← Root scripts (dev:frontend, dev:backend)
```

**Frontend** communicates with **Backend** via HTTP. During development, Vite proxies all `/api/*` requests to the Express backend automatically.

```
Browser
  ↓
frontend (Vite — :8080)
  ↓ /api/* proxy
backend (Express — :3001)
  ↓
GitHub API
```

---

## Technology Stack

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | TanStack Start (React 19, SSR) |
| Router | TanStack Router (file-based) |
| State | TanStack Query |
| UI Components | shadcn/ui + Radix UI |
| Styling | TailwindCSS v4 |
| Charts | Recharts |
| Build | Vite 8 |
| Language | TypeScript |

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript (tsx) |
| GitHub API | REST v3 |
| Auth | GitHub OAuth (cookie-based) |

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+
- A GitHub OAuth App ([create one here](https://github.com/settings/developers))

### 1. Clone and install

```bash
# Install all dependencies
npm run install:all

# Or install separately:
cd frontend && npm install
cd ../backend && npm install
```

### 2. Configure environment variables

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env with your GitHub OAuth credentials
```

**Frontend:**
```bash
cd frontend
cp .env.example .env
# Usually no changes needed for local development
```

### 3. Run both servers

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Starts at http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Starts at http://localhost:8080
```

Open **http://localhost:8080** in your browser.

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_CLIENT_ID` | Yes | GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | Yes | GitHub OAuth App Client Secret |
| `GITHUB_CALLBACK_URL` | Yes | OAuth callback URL (e.g., `http://localhost:8080/api/auth/github/callback`) |
| `GITHUB_ACCESS_TOKEN` | No | Personal access token (for testing) |
| `PORT` | No | Backend port (default: 3001) |
| `FRONTEND_URL` | No | Frontend URL for CORS (default: http://localhost:8080) |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Backend URL (default: http://localhost:3001, auto-proxied in dev) |

---

## Authentication Setup

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Set:
   - **Homepage URL**: `http://localhost:8080`
   - **Authorization callback URL**: `http://localhost:8080/api/auth/github/callback`
4. Copy the **Client ID** and **Client Secret** into `backend/.env`

The auth flow:
```
User clicks "Sign in with GitHub"
  → Frontend redirects to /api/auth/github
  → Backend redirects to GitHub OAuth
  → GitHub redirects to /api/auth/github/callback
  → Backend exchanges code for token, sets cookie
  → User redirected to /dashboard
```

---

## API Overview

All API routes are served by the Express backend at `http://localhost:3001`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/auth/github` | Start GitHub OAuth |
| GET | `/api/auth/github/callback` | OAuth callback |
| GET | `/api/auth/user` | Get current user |
| GET | `/api/auth/logout` | Logout |
| GET | `/api/repos` | List repositories |
| GET | `/api/repos/insights` | Repository insights |
| GET | `/api/repos/detail` | Repository detail analytics |
| GET | `/api/dashboard` | Dashboard metrics |
| GET | `/api/team/analytics` | Team analytics |
| GET | `/api/team/projects` | Contributor projects |
| GET | `/api/search` | Global search |
| GET | `/api/notifications` | Notifications |

See [docs/api/README.md](docs/api/README.md) for detailed API documentation.

---

## Development Workflow

```bash
# From the root of the project:

# Run frontend dev server
npm run dev:frontend

# Run backend dev server
npm run dev:backend

# Lint frontend
npm run lint:frontend

# Build frontend for production
npm run build:frontend
```

---

## Project Structure (Detailed)

```
fyp_project/
│
├── frontend/                    ← React/TanStack Start SPA
│   ├── src/
│   │   ├── components/         ← Reusable UI components
│   │   │   ├── ui/             ← shadcn/ui components
│   │   │   ├── app-shell.tsx   ← Main layout (sidebar + nav)
│   │   │   └── ui-bits.tsx     ← Custom reusable components
│   │   ├── hooks/              ← Custom React hooks
│   │   ├── lib/                ← Import shims for backward compatibility
│   │   ├── routes/             ← Page components (file-based routing)
│   │   ├── services/           ← Browser-side services & API clients
│   │   ├── types/              ← TypeScript interfaces (frontend-safe)
│   │   ├── utils/              ← Utility functions
│   │   ├── router.tsx          ← Router factory
│   │   ├── start.ts            ← TanStack Start entry
│   │   ├── server.ts           ← SSR entry (no API logic)
│   │   └── styles.css          ← Global styles
│   ├── public/
│   ├── vite.config.ts          ← Vite + proxy config
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
│
├── backend/                     ← Express REST API
│   ├── src/
│   │   ├── app.ts              ← Express application entry
│   │   ├── config/             ← Environment config
│   │   ├── routes/             ← Express route definitions
│   │   ├── services/           ← GitHub API business logic
│   │   ├── middleware/         ← Auth, error handling
│   │   ├── utils/              ← Utilities & adapters
│   │   └── types/              ← Shared TypeScript types
│   ├── tsconfig.json
│   ├── package.json
│   └── .env.example
│
├── docs/
│   ├── architecture/           ← System design docs
│   ├── api/                    ← API reference docs
│   └── setup/                  ← Setup guides
│
├── .gitignore
├── README.md
└── package.json                 ← Root scripts only
```

## GitHub OAuth: local development and production

OAuth credentials are read on the server through `getEnv` in `backend/src/config/env.ts`.
The server reads `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and
`GITHUB_CALLBACK_URL`. Existing process environment values take precedence over
`.env`. Credentials must never use a `VITE_` prefix or be placed in client code.
The client ID is public by design in GitHub's authorization URL; the client secret
is sent only by the server to GitHub's token endpoint. `.gitignore` excludes `.env`
and environment variants, while `.env.example` contains placeholders only.

### Developers cloning without .env

The landing page and its sample preview work without OAuth configuration. Login
and callback routes return a styled HTML setup screen (HTTP 503) when credentials
are missing, blank, or still use the template placeholders. The screen links to
`/#preview` and home; the preview is illustrative, not an authenticated dashboard.

1. Copy `backend/.env.example` to `backend/.env`.
2. Create your own GitHub OAuth App in GitHub Developer Settings.
3. Set its homepage to `http://localhost:8080` and callback URL to
   `http://localhost:8080/api/auth/github/callback`.
4. Fill in `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`, and set
   `GITHUB_CALLBACK_URL` to the same callback URL.
5. Restart the server and open `http://localhost:8080`. If using `127.0.0.1` or a
   different port, update both callback settings and open the matching origin.

### End users on a production deployment

The site operator configures the OAuth credentials in the hosting platform's
server environment and registers the public HTTPS callback URL, for example
`https://your-domain.example/api/auth/github/callback`. Start the deployment with
those variables available to the server. End users click Log in, authorize on
GitHub, and return to the dashboard; they do not clone the project, create `.env`,
or supply a client secret. Missing deployment configuration is the operator's
responsibility, not the visitor's. Behind a reverse proxy, ensure the application
receives the public HTTPS request URL so callback origin checks and Secure cookies
work correctly.

### Audit and validation

Source review found no hardcoded OAuth client ID or client secret. Documentation
uses placeholders. The audit covers current source, not published Git history or
external hosting configuration. Both login and callback validate configuration;
provider failures return HTML without raw upstream details. Sign-in uses a random
state value in a 10-minute HttpOnly SameSite cookie, verifies it before exchanging
codes, and clears it after callback processing. OAuth tokens use HttpOnly cookies
(Secure on HTTPS); they are no longer written to localStorage or embedded in HTML.

The separate manual personal-access-token feature still stores user-entered tokens
in browser storage, and the optional server `GITHUB_ACCESS_TOKEN` fallback remains.
Do not configure a shared personal token for a public multi-user deployment without
reviewing its access implications. These legacy features are not OAuth credentials.

With Node 22.12+ (Node 24 recommended), install dependencies with `npm install`
and `npm run install:all`. Run `npm run typecheck`, `npm run build`, then
`npm test`. Tests exercise the compiled backend, so build it first.
OAuth tests use mocked GitHub responses; a live authorization round trip requires
your own configured OAuth App. No real credentials are needed for the tests.

## Manager repository setup

Open **Repositories → Create repository**. Enter a name, optional description,
visibility (private by default), and up to 20 GitHub usernames separated by commas
or new lines. The app creates an initialized repository under the signed-in
account and requests write-access invitations. GitHub handles invitation delivery;
collaborators must accept before joining. Existing collaborators are reported as
already having access. Invitations are not automatically accepted.

The result lists each invitation independently. **Retry failed invitations** only
retries failed members and never creates the repository again. To add people later
or recover after an interrupted request, select **Invite members to an existing
repository I own**. A failed or interrupted create request may already have reached
GitHub, so check the repository list before submitting again.

Both development and production use `POST /api/manage-repository`. Mutations
require a same-origin JSON request and a user token cookie, never the shared server
PAT fallback. The server resolves the account from GitHub and enforces repository
ownership; organization-owned repositories are not supported by this flow.
All signed-in users are treated as managers in this version; there is no separate
approved-manager registry or organization role provisioning yet.

Run `node --test tests/repository-management.test.cjs` for mocked mutation tests.
These tests do not create live repositories or send real invitations.

### Frontend/backend integration

Run `npm run dev:backend` and `npm run dev:frontend` in separate terminals.
The frontend proxies `/api` to the backend on port 3001. Keep `FRONTEND_URL`
and the OAuth callback origin aligned with the browser URL (normally
`http://localhost:8080`). The Express adapter uses this configured public origin
for OAuth and same-origin checks, and forwards each session cookie separately.
For production, route `/api/*` to Express and other paths to the frontend SSR
server under the same public HTTPS origin. Vite's development proxy is not a
production proxy. Set `FRONTEND_URL` to that public origin on the backend.

The repository creation form uses a browser-only validation schema in
`frontend/src/lib/repository-management-schema.ts`; the backend validates requests
independently. Keep these schemas aligned when changing the request contract.
