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
