# GitInsight AI — Architecture

## System Overview

GitInsight AI is a full-stack web application split into two independently runnable services:

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│                                                             │
│   React (TanStack Start)  port 8080                         │
│   ├── /dashboard                                            │
│   ├── /repositories                                         │
│   ├── /team                                                  │
│   └── ...                                                   │
│                          │                                  │
│                    /api/* proxy                             │
└──────────────────────────┼──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Express Backend  port 3001                  │
│                                                             │
│   Routes          Services                                  │
│   ├── /api/auth   ├── github-oauth.ts                       │
│   ├── /api/repos  ├── github-api.ts                         │
│   ├── /api/dash   ├── dashboard-api.ts                      │
│   ├── /api/team   ├── github-team-analytics-api.ts          │
│   └── /api/search └── github-global-api.ts                  │
│                          │                                  │
└──────────────────────────┼──────────────────────────────────┘
                           │
                           ▼
                 ┌─────────────────────┐
                 │    GitHub REST API   │
                 │  api.github.com/v3  │
                 └─────────────────────┘
```

## Frontend Architecture

### Framework: TanStack Start (React 19 + SSR)

TanStack Start is an SSR-capable framework built on Vite + TanStack Router. In this app, the SSR layer only handles page rendering — **no API logic runs in the frontend server**.

### File-Based Routing

Routes live in `frontend/src/routes/`. TanStack Router auto-generates `routeTree.gen.ts` from the file names:

```
routes/
  __root.tsx          → Layout wrapper (QueryClientProvider)
  index.tsx           → / (Login page)
  dashboard.tsx       → /dashboard
  repositories.index.tsx → /repositories
  repositories.$id.tsx   → /repositories/:id
  team.tsx            → /team
  team.developers.$id.tsx → /team/developers/:id
  ai-insights.tsx     → /ai-insights
  voice.tsx           → /voice
  reports.tsx         → /reports
  settings.tsx        → /settings
```

### Data Fetching

All data fetching uses **TanStack Query** (`useQuery`). Queries call the backend via `fetch('/api/...')`. In development, Vite proxies these to the Express backend.

### State Management

| Concern | Solution |
|---------|---------|
| Server data (GitHub API) | TanStack Query |
| User settings | localStorage via `settings-service.ts` |
| Reports history | localStorage via `reports-service.ts` |
| Auth session | Cookie (`github_token`) + localStorage mirror |
| Theme | localStorage + CSS class on `<html>` |

---

## Backend Architecture

### Framework: Express.js

The backend is a plain Express server with TypeScript, run via `tsx` in development.

### Layer Responsibilities

```
routes/          → Define endpoint paths, connect to services
services/        → All GitHub API calls and business logic
middleware/      → Token extraction, error handling
utils/           → adapt-web-handler.ts (bridges Web API ↔ Express)
config/          → Environment loading
types/           → Shared TypeScript interfaces
```

### Key Design: Web API Handler Adapter

The original codebase used Web API-style handlers (`Request` → `Response`). To reuse them in Express without rewriting, `adapt-web-handler.ts` bridges them:

```typescript
// Original service function (Web API style):
export async function handleGetRepos(request: Request): Promise<Response>

// Adapter wraps it for Express:
reposRoutes.get("/", adaptWebHandler(handleGetRepos))
```

---

## Authentication Flow

```
1. User visits /
2. Clicks "Sign in with GitHub"
3. Browser → GET /api/auth/github
4. Backend → 302 redirect to github.com/login/oauth/authorize
5. User grants permission on GitHub
6. GitHub → GET /api/auth/github/callback?code=xxx
7. Backend exchanges code → GitHub access token
8. Backend sets cookie: github_token=<token>; Path=/; Max-Age=30days
9. Backend sends HTML bridge (sets localStorage mirror)
10. Browser → redirect to /dashboard
```

**Token storage:** The GitHub token is stored in:
- HTTP-only-like cookie (`github_token`) — sent automatically with every `/api/*` request
- `localStorage` mirror — used by frontend for display (user profile, avatar)

---

## Environment Variables

### Backend (sensitive — never expose to frontend)
- `GITHUB_CLIENT_ID` — OAuth app client ID
- `GITHUB_CLIENT_SECRET` — OAuth app client secret (**never expose!**)
- `GITHUB_CALLBACK_URL` — OAuth redirect URL
- `GITHUB_ACCESS_TOKEN` — Optional PAT for dev/testing

### Frontend (VITE_ prefix — safe to expose)
- `VITE_API_URL` — Backend URL (auto-proxied in dev, not needed in `.env`)
