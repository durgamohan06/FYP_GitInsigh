# GitInsight AI — Backend

Express.js API backend for the GitInsight AI platform. Handles GitHub OAuth, repository data, team analytics, and all business logic.

## Tech Stack

- **Runtime**: Node.js (ESM)
- **Framework**: Express.js
- **Language**: TypeScript (via `tsx` for development)
- **GitHub API**: REST v3

## Directory Structure

```
backend/
├── src/
│   ├── app.ts              ← Express application entry point
│   ├── config/
│   │   └── env.ts          ← Environment variable loader
│   ├── routes/
│   │   ├── auth.ts         ← /api/auth/* (GitHub OAuth)
│   │   ├── repos.ts        ← /api/repos/*
│   │   ├── dashboard.ts    ← /api/dashboard
│   │   ├── team.ts         ← /api/team/*
│   │   ├── search.ts       ← /api/search
│   │   └── notifications.ts← /api/notifications
│   ├── services/
│   │   ├── github-api.ts           ← Core GitHub REST API client
│   │   ├── github-oauth.ts         ← GitHub OAuth handlers
│   │   ├── github-global-api.ts    ← Search & notifications
│   │   ├── github-team-analytics-api.ts
│   │   ├── github-team-projects-api.ts
│   │   ├── dashboard-api.ts
│   │   ├── repo-detail-api.ts
│   │   └── repo-insights.ts
│   ├── middleware/
│   │   ├── auth.ts         ← Token extraction & auth guard
│   │   └── error-handler.ts← Global error handler
│   ├── utils/
│   │   ├── adapt-web-handler.ts    ← Adapts Web API handlers to Express
│   │   └── contributor-scoring.ts  ← Contributor scoring algorithm
│   └── types/
│       └── team-analytics.types.ts ← Shared TypeScript types
├── .env.example
├── package.json
└── tsconfig.json
```

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create your .env from the example
cp .env.example .env

# 3. Fill in your GitHub OAuth credentials in .env

# 4. Start development server (auto-restarts on changes)
npm run dev
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/auth/github` | Redirect to GitHub OAuth |
| GET | `/api/auth/github/callback` | GitHub OAuth callback |
| GET | `/api/auth/user` | Get current user profile |
| GET | `/api/auth/logout` | Clear session & logout |
| GET | `/api/repos` | List all repositories |
| GET | `/api/repos/insights` | Repository insights |
| GET | `/api/repos/detail?owner=&repo=` | Detailed repo analytics |
| GET | `/api/dashboard` | Dashboard metrics |
| GET | `/api/team/analytics?repository=` | Team analytics |
| GET | `/api/team/projects?contributors=` | Contributor projects |
| GET | `/api/search?q=` | Global search |
| GET | `/api/notifications` | GitHub notifications |

## Environment Variables

See `.env.example` for all required variables.
