# GitInsight AI — Frontend

React/TanStack Start frontend for the GitInsight AI platform. AI-powered GitHub project intelligence dashboard.

## Tech Stack

- **Framework**: TanStack Start (React SSR)
- **Router**: TanStack Router (file-based routing)
- **State**: TanStack Query (server state)
- **UI**: shadcn/ui + Radix UI
- **Styling**: TailwindCSS v4
- **Charts**: Recharts
- **Language**: TypeScript
- **Build**: Vite

## Directory Structure

```
frontend/
├── public/
│   └── favicon.png
├── src/
│   ├── components/
│   │   ├── ui/             ← shadcn/ui components
│   │   ├── app-shell.tsx   ← Main layout with sidebar/nav
│   │   └── ui-bits.tsx     ← Reusable custom components
│   ├── hooks/
│   │   └── use-mobile.tsx  ← Mobile breakpoint hook
│   ├── lib/                ← Compatibility shims (import aliases)
│   │   ├── utils.ts        ← cn() utility (re-exported)
│   │   ├── github-oauth.ts ← GitHub types shim
│   │   ├── github-api.ts   ← GitHub types shim
│   │   ├── dashboard-api.ts← Dashboard types shim
│   │   ├── repo-detail-api.ts ← Repo detail types shim
│   │   ├── settings-service.ts← Settings service shim
│   │   ├── reports-service.ts ← Reports service shim
│   │   ├── team-analytics-service.ts ← Team service shim
│   │   ├── error-capture.ts  ← SSR error capture
│   │   ├── error-page.ts     ← SSR error page renderer
│   │   └── error-reporting.ts← Client error reporter
│   ├── routes/             ← TanStack Router pages (auto-generated route tree)
│   │   ├── __root.tsx      ← HTML shell + query provider
│   │   ├── index.tsx       ← Login page (/)
│   │   ├── dashboard.tsx   ← Dashboard (/dashboard)
│   │   ├── repositories.index.tsx
│   │   ├── repositories.$id.tsx
│   │   ├── team.tsx
│   │   ├── team.developers.$id.tsx
│   │   ├── ai-insights.tsx
│   │   ├── voice.tsx
│   │   ├── reports.tsx
│   │   └── settings.tsx
│   ├── services/           ← Browser-side services (localStorage, API clients)
│   │   ├── settings-service.ts
│   │   ├── reports-service.ts
│   │   ├── team-analytics-service.ts
│   │   └── error-reporting.ts
│   ├── types/              ← TypeScript type definitions (frontend-safe)
│   │   ├── github.types.ts
│   │   ├── dashboard.types.ts
│   │   └── repo-detail.types.ts
│   ├── utils/              ← Utility functions
│   │   ├── utils.ts        ← cn() helper
│   │   ├── contributor-scoring.ts
│   │   └── mock-data.ts
│   ├── router.tsx          ← TanStack Router factory
│   ├── start.ts            ← TanStack Start instance
│   ├── server.ts           ← SSR entry point
│   ├── routeTree.gen.ts    ← Auto-generated (do not edit)
│   └── styles.css          ← Global styles + TailwindCSS
├── .env.example
├── package.json
├── vite.config.ts          ← Vite config with API proxy
└── tsconfig.json
```

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your .env from the example
cp .env.example .env

# 3. Start development server
npm run dev
```

> **Important**: The backend must also be running for API calls to work.
> Start the backend first with `cd ../backend && npm run dev`

## Development

The Vite dev server (port 8080) automatically proxies all `/api/*` requests to the Express backend (port 3001). You don't need to configure CORS or URLs manually during development.

## Building

```bash
npm run build
```

## Available Routes

| Path | Description |
|------|-------------|
| `/` | Login page (GitHub OAuth) |
| `/dashboard` | Main project dashboard |
| `/repositories` | All repositories |
| `/repositories/:id` | Repository detail analytics |
| `/team` | Team analytics |
| `/team/developers/:id` | Individual developer profile |
| `/ai-insights` | AI-powered insights |
| `/voice` | Voice assistant |
| `/reports` | Reports management |
| `/settings` | Application settings |
