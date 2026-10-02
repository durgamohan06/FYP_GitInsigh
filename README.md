# GitInsight AI — AI-Powered GitHub Project Intelligence Dashboard

<div align="center">

![GitInsight AI](public/favicon.png)

**An intelligent engineering leadership platform and AI-powered project dashboard that turns GitHub activity into real-time analytics, automated summaries, blocker detection, and voice-assisted intelligence.**

[![React](https://img.shields.io/badge/React-19.2-blue?logo=react)](https://react.dev/)
[![TanStack Start](https://img.shields.io/badge/TanStack-Start%20%2F%20Router-orange?logo=tanstack)](https://tanstack.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS%20v4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178c6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Tech Stack & Architecture](#-tech-stack--architecture)
- [Frontend Pages & UI Components](#-frontend-pages--ui-components)
  - [1. Landing & Gateway Page (`/`)](#1-landing--gateway-page-)
  - [2. Executive Dashboard (`/dashboard`)](#2-executive-dashboard-dashboard)
  - [3. Repositories Directory (`/repositories`)](#3-repositories-directory-repositories)
  - [4. Repository Deep-Dive (`/repositories/:id`)](#4-repository-deep-dive-repositoriesid)
  - [5. AI Insights Engine (`/ai-insights`)](#5-ai-insights-engine-ai-insights)
  - [6. AI Voice Assistant (`/voice`)](#6-ai-voice-assistant-voice)
  - [7. Team Analytics (`/team`)](#7-team-analytics-team)
  - [8. Intelligence Reports (`/reports`)](#8-intelligence-reports-reports)
  - [9. Settings & Configurations (`/settings`)](#9-settings--configurations-settings)
- [GitHub Integration Architecture](#-github-integration-architecture)
  - [OAuth 2.0 Flow](#github-oauth-20-authentication)
  - [Dual-Affiliation Repository Fetching](#dual-affiliation-repository-fetching-owned--collaborated)
  - [Live Dashboard Aggregation](#live-dashboard-aggregation-get-apidashboard)
- [Backend API Endpoints](#-backend-api-endpoints)
- [Environment Setup](#-environment-setup)
- [Getting Started](#-getting-started)
- [Project Structure](#-project-structure)

---

## 🌟 Overview

**GitInsight AI** addresses the common software coordination bottleneck where engineering managers and teams spend substantial time manually tracking GitHub commits, PR reviews, and standup blockers.

The platform connects to the GitHub REST API and OAuth 2.0 to provide:

- **Instant Project Visibility**: Real-time project health scoring, commit velocity, and module completion tracking.
- **Collaborator & Owned Repository Separation**: Distinguishes between repositories created by the user and projects where the user is an invited collaborator.
- **AI Blocker Detection**: Flagging stale PRs, open issue backlogs, and delayed releases before they block progress.
- **Voice Assistant**: An interactive voice/chat interface allowing leaders to ask natural language questions like _"What was completed today?"_ or _"Which PRs are pending?"_.
- **Developer Analytics**: Contributor velocity scorecards, skill radar charts, and work distribution graphs.

---

## 🛠️ Tech Stack & Architecture

- **Full-Stack Framework**: [TanStack Start](https://tanstack.com/start) with [TanStack Router](https://tanstack.com/router) (file-based routing with SSR support).
- **Core Frontend**: [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/), and [Radix UI](https://www.radix-ui.com/) component primitives.
- **Data Visualization**: [Recharts](https://recharts.org/) (Area charts, Bar charts, Pie charts, Radar charts, Line charts), custom SVG Sparklines, and circular progress gauges.
- **Icons & Styling**: [Lucide React](https://lucide.dev/), Glassmorphism cards, animated mesh gradients, and light/dark theme switching.
- **Backend & SSR**: Node.js, [Nitro](https://nitro.unjs.io/) server entry, and Web Fetch standard API request handlers.
- **Authentication**: GitHub OAuth 2.0 with HTTP-only cookies and browser session sync.

---

## 📱 Frontend Pages & UI Components

### 1. Landing & Gateway Page (`/`)

- **File:** `src/routes/index.tsx`
- **Features:**
  - Modern hero section with animated ambient gradient blobs.
  - **"Continue with GitHub"** button triggering the full OAuth 2.0 authorization flow.
  - Direct **"Demo Dashboard"** link for instant evaluation.
  - Responsive glassmorphism card layout with security disclaimers.

---

### 2. Executive Dashboard (`/dashboard`)

- **File:** `src/routes/dashboard.tsx`
- **Features:**
  - **Personalized Header**: Dynamic greeting with the authenticated user's name (`Good Morning, @User 👋`).
  - **Project Health Score**: Animated circular progress ring showing overall multi-repository health (computed from open issues, stale PRs, and recent commit velocity).
  - **Metric Stat Cards**: 6 cards with sparklines displaying Repositories, Commits (30d), Open Issues, Open PRs, Active Contributors, and AI Blockers.
  - **Activity Area Chart**: 30-day interactive area chart tracking Commits vs. PR volume.
  - **Contribution Heatmap**: 26-week GitHub-style activity grid.
  - **Monitored Repositories Table**: Tabular overview with direct links to repository drill-downs.

---

### 3. Repositories Directory (`/repositories`)

- **File:** `src/routes/repositories.tsx`
- **Features:**
  - **3-Tab Affiliation Segmentation**:
    - 📁 **All Repositories**: Complete list of connected repositories.
    - 👤 **My Owned Repos**: Repositories created directly by the user.
    - 🤝 **Collaborated Repos**: Repositories where the user has been invited as a collaborator (e.g. `durgamohan06/Git-fyp`), styled with a purple **Collaborator** badge and owner avatar.
  - **Dynamic Search & Filtering**: Real-time filtering by repository name, owner, description, and programming languages.
  - **Loading Skeletons**: Smooth animated placeholder cards while fetching data.
  - **Token Modal**: Quick-configure personal access token directly in the browser for flexible testing.
  - **Repo Cards**: Shows repo visibility (Public/Private), language badge, star count, fork count, default branch, and relative update time.

---

### 4. Repository Deep-Dive (`/repositories/:id`)

- **File:** `src/routes/repositories.$id.tsx`
- **Features:**
  - **8-Tab Navigation Workspace**:
    1. **Overview**: High-level repository metrics and quick actions (Star, Fork, View on GitHub).
    2. **Commits**: Recent commit activity timeline.
    3. **Issues**: Issue tracking with status tags (Open, Closed, In Progress).
    4. **Pull Requests**: Open and merged PR tracker.
    5. **Reviews**: Code review velocity and reviewer assignments.
    6. **Contributors**: Contributor list with productivity scores (A+, A, B+).
    7. **Analytics**: 30-day commit vs. PR trend chart.
    8. **AI Summary**: Automated daily/weekly digests, risk analysis, and recommended next actions.

---

### 5. AI Insights Engine (`/ai-insights`)

- **File:** `src/routes/ai-insights.tsx`
- **Features:**
  - **Executive Brief**: AI-generated cross-repository summary highlighting high-priority deliverables.
  - **Categorized Intelligence Cards**:
    - _Daily, Weekly, and Sprint Velocity Summaries_.
    - _Risk Analysis_ & _Release Shipping Predictions_ (with confidence scores).
    - _Completed vs. Pending Task Breakdown_.
    - _Recommended Actions_ (e.g. review reassignments, backfill splitting).

---

### 6. AI Voice Assistant (`/voice`)

- **File:** `src/routes/voice.tsx`
- **Features:**
  - **Interactive Voice Interface**: Microphone button with pulsing rings and animated audio equalizer wave.
  - **Conversational Chat**: Clean chat stream with voice playback support.
  - **Quick Suggestion Chips**:
    - _"What was completed today?"_
    - _"Which pull requests are pending?"_
    - _"Who is working on Authentication?"_
    - _"Show inactive contributors."_
    - _"Which module has blockers?"_

---

### 7. Team Analytics (`/team`)

- **File:** `src/routes/team.tsx`
- **Features:**
  - **Contributor Scorecards**: Individual productivity metrics (Commits, Closed Issues, Reviews) with letter grades.
  - **Contribution Comparison**: Bar chart comparing commits vs. reviews across developers.
  - **Issue Distribution**: Donut chart breaking down work into Bugs, Features, Chores, and Docs.
  - **Skill Radar Chart**: Comparing developer metrics (Delivery, Quality, Reviews, Velocity, Impact) against team averages.
  - **Project Timeline**: Planned vs. actual progress bar chart.

---

### 8. Intelligence Reports (`/reports`)

- **File:** `src/routes/reports.tsx`
- **Features:**
  - Pre-built digest templates: _Daily, Weekly, Sprint, and Monthly Reports_.
  - Multi-format exports: **PDF**, **CSV**, and shareable URLs.
  - Export download history log.

---

### 9. Settings & Configurations (`/settings`)

- **File:** `src/routes/settings.tsx`
- **Features:**
  - Configuration cards for GitHub OAuth, AI Model selection (e.g. GPT-4o / Gemini), Theme, Voice Preferences, Notification channels (Slack/Email), and User Profile.

---

## 🔐 GitHub Integration Architecture

### GitHub OAuth 2.0 Authentication

```
[ User Clicks "Continue with GitHub" ]
                  │
                  ▼
[ Redirects to GET /api/auth/github ]
                  │
                  ▼
[ GitHub Authorization Screen (scopes: repo, read:user, user:email) ]
                  │
                  ▼
[ Redirects to GET /api/auth/github/callback?code=... ]
                  │
                  ▼
[ Server Exchanges Code for access_token with GitHub ]
                  │
                  ▼
[ Server Fetches User Profile -> Sets 30-Day Cookie -> Syncs localStorage ]
                  │
                  ▼
[ Redirects User to /dashboard with Live Profile & Repositories ]
```

### Dual-Affiliation Repository Fetching (Owned & Collaborated)

GitHub's REST API separates repository access levels by `affiliation`:

1. `GET /user/repos?affiliation=owner&sort=updated&per_page=100` $\rightarrow$ Returns repositories authored and owned by the user.
2. `GET /user/repos?affiliation=collaborator&sort=updated&per_page=100` $\rightarrow$ Returns external repositories where the user has push/pull collaborator access.
3. **Resilient Token Scope Fallback**: If an OAuth token has restricted third-party organization scope on private collaborator repos, the server automatically queries with the server's `GITHUB_ACCESS_TOKEN` (PAT) to ensure all collaborated projects are retrieved.

### Live Dashboard Aggregation (`GET /api/dashboard`)

The aggregator endpoint combines multi-repo metrics:

- **30-Day Activity Curve**: Aggregates daily commit timestamps and pull request creation events.
- **Health Score Formula**:
  $$\text{Health Score} = \text{clamp}\Big(100 - (\text{openIssues} \times 2) - (\text{stalePRs} \times 3) + \text{recentCommits}_{7\text{d}},\, 0,\, 100\Big)$$
- **Performance Caching**: In-memory 60-second TTL cache with `_t` timestamp cache-busting on manual sync requests.

---

## 🔌 Backend API Endpoints

| Method | Endpoint                    | Description                                                             |
| :----- | :-------------------------- | :---------------------------------------------------------------------- |
| `GET`  | `/api/auth/github`          | Initiates GitHub OAuth login redirect                                   |
| `GET`  | `/api/auth/github/callback` | Handles OAuth callback and exchanges code for token                     |
| `GET`  | `/api/auth/user`            | Fetches authenticated user's GitHub profile                             |
| `GET`  | `/api/auth/logout`          | Clears authentication cookies and session                               |
| `GET`  | `/api/repos`                | Fetches owned and collaborated repositories via dual affiliation        |
| `GET`  | `/api/repos/detail`         | Fetches comprehensive 8-module analytics payload for a specific repo    |
| `GET`  | `/api/dashboard`            | Aggregates multi-repository metrics, 30-day activity, and health scores |

---

## ⚙️ Environment Setup

Create a `.env` file in the project root:

```env
# GitHub Personal Access Token (for direct PAT testing & collaborator fallback)
GITHUB_ACCESS_TOKEN=your_personal_access_token_here

# GitHub OAuth App Configuration
# Create an OAuth App at: https://github.com/settings/developers
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
GITHUB_CALLBACK_URL=http://localhost:8080/api/auth/github/callback
```

### GitHub OAuth App Setup:

1. Go to **[GitHub Developer Settings -> OAuth Apps](https://github.com/settings/developers)**.
2. Click **"New OAuth App"**.
3. Set **Homepage URL**: `http://localhost:8080`
4. Set **Authorization callback URL**: `http://localhost:8080/api/auth/github/callback`
5. Copy the **Client ID** and **Client Secret** into your `.env` file.

---

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Start the Development Server

```bash
npm run dev
```

### 3. Open in Browser

Visit **[http://localhost:8080](http://localhost:8080)** to preview and use the application.

### 4. Build for Production

```bash
npm run build
```

---

## 📂 Project Structure

```
Git-fyp-main/
├── src/
│   ├── components/
│   │   ├── app-shell.tsx         # Sidebar, dynamic user header, avatar, logout & theme toggle
│   │   ├── ui-bits.tsx           # Reusable cards, badges, count-up animations, gauges, sparklines
│   │   └── ui/                   # Radix UI primitives (modals, dropdowns, tooltips, dialogs)
│   ├── routes/
│   │   ├── __root.tsx            # Root HTML layout, QueryClient provider & error boundaries
│   │   ├── index.tsx             # Landing page with GitHub OAuth login trigger
│   │   ├── dashboard.tsx         # Executive dashboard with live activity charts & metrics
│   │   ├── repositories.index.tsx# Repository directory with Owned vs Collaborated tabs
│   │   ├── repositories.$id.tsx  # 8-section repository deep-dive analytics
│   │   ├── ai-insights.tsx       # AI digests, risk analysis & recommendations
│   │   ├── voice.tsx             # AI Voice Assistant with soundwave UI
│   │   ├── team.tsx              # Team productivity scorecards & skill radar
│   │   ├── reports.tsx           # Report generator (PDF / CSV export)
│   │   ├── settings.tsx          # System, AI model & notification settings
│   ├── lib/
│   │   ├── env.ts                # Zero-dependency .env loader for server & Vite runtimes
│   │   ├── github-api.ts         # Dual-affiliation repo fetcher (owned & collaborated)
│   │   ├── repo-detail-api.ts    # Service for fetching 8-module repo analytics payload
│   │   ├── dashboard-api.ts      # Multi-repository activity & health score aggregator
│   │   ├── github-oauth.ts       # OAuth 2.0 login, callback, session & user profile handler
│   │   ├── mock-data.ts          # Static sample dataset for offline fallbacks
│   │   ├── error-capture.ts      # SSR error capture
│   │   ├── error-page.ts         # 500 error page fallback renderer
│   │   └── utils.ts              # Tailwind CSS class merging utilities
│   ├── server.ts                 # Nitro server entry & SSR API route dispatcher
│   ├── styles.css                # Tailwind CSS v4 variables & custom animations
│   ├── routeTree.gen.ts          # Auto-generated TanStack router tree
│   └── router.tsx                # TanStack Router instance creation
├── .env.example                  # Environment variables template
├── vite.config.ts                # Vite build, TanStack Start & API dev middleware plugin
└── package.json                  # Dependencies & scripts
```

## GitHub OAuth: local development and production

OAuth credentials are read on the server through `getEnv` in `src/lib/env.ts`.
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

1. Copy `.env.example` to `.env` in the project root.
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

Run `node --test tests/oauth.test.cjs`, `npx tsc --noEmit`, and `npm run build`.
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
