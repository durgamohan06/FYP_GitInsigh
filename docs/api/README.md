# GitInsight AI — API Reference

## Base URL

**Development:** `http://localhost:3001`
**Production:** Your deployed backend URL

All API routes are prefixed with `/api`.

---

## Authentication

Most endpoints require GitHub authentication via cookie (`github_token`) or `Authorization: Bearer <token>` header.

### Auth Flow

```
GET /api/auth/github
  → 302 redirect to GitHub OAuth

GET /api/auth/github/callback?code=...
  → Sets github_token cookie (30 days)
  → Redirects to /dashboard

GET /api/auth/user
  → { id, login, name, avatar_url, email, ... }

GET /api/auth/logout
  → Clears cookie, redirects to /
```

---

## Endpoints

### Health

#### `GET /api/health`
Returns server health status.

**Response:**
```json
{
  "status": "ok",
  "service": "GitInsight AI Backend",
  "timestamp": "2026-09-29T00:00:00.000Z"
}
```

---

### Repositories

#### `GET /api/repos`
Returns all repositories for the authenticated user (owned + collaborated).

**Auth:** Required

**Response:**
```json
{
  "currentUser": "username",
  "count": 42,
  "ownedCount": 30,
  "collaboratedCount": 12,
  "ownedRepos": [...],
  "collaboratedRepos": [...],
  "data": [...]
}
```

---

#### `GET /api/repos/insights`
Returns repository insights including contributed repos (via public events).

**Auth:** Required

---

#### `GET /api/repos/detail`
Returns detailed analytics for a single repository.

**Auth:** Required

**Query Parameters:**
| Param | Required | Description |
|-------|----------|-------------|
| `owner` | Yes | Repository owner (e.g., `octocat`) |
| `repo` | Yes | Repository name (e.g., `hello-world`) |
| `timeframe` | No | `7d`, `30d`, `3m`, `6m`, `1y` (default: `30d`) |

---

### Dashboard

#### `GET /api/dashboard`
Returns aggregated dashboard metrics across all repositories.

**Auth:** Required

**Response:**
```json
{
  "totalRepos": 42,
  "totalCommits": 1240,
  "openIssues": 18,
  "openPRs": 7,
  "healthScore": 87,
  "stats": [...],
  "activity": [...],
  "repositories": [...],
  "blockers": [...]
}
```

---

### Team Analytics

#### `GET /api/team/analytics`
Returns team analytics for a specific repository.

**Auth:** Required

**Query Parameters:**
| Param | Required | Description |
|-------|----------|-------------|
| `repository` | Yes | Full repo name (e.g., `owner/repo`) |
| `dateRange` | No | `today`, `7d`, `30d`, `90d`, `year` (default: `30d`) |

---

#### `GET /api/team/projects`
Returns project history for specified contributors.

**Auth:** Required

**Query Parameters:**
| Param | Required | Description |
|-------|----------|-------------|
| `contributors` | Yes | Comma-separated GitHub usernames |

---

### Search

#### `GET /api/search`
Global search across repositories, issues, and users.

**Auth:** Required

**Query Parameters:**
| Param | Required | Description |
|-------|----------|-------------|
| `q` | Yes | Search query string |

**Response:**
```json
{
  "repositories": [...],
  "issues": [...],
  "users": [...]
}
```

---

### Notifications

#### `GET /api/notifications`
Returns GitHub notifications for the authenticated user.

**Auth:** Required

**Response:**
```json
{
  "count": 12,
  "items": [...]
}
```
