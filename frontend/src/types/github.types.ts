/**
 * GitHub API shared types (frontend-safe).
 * These mirror the types defined in backend/src/services/github-api.ts
 * and backend/src/services/github-oauth.ts.
 */

// ── From github-oauth.ts ──────────────────────────────────────────────────────

export interface GitHubUserProfile {
  id: number;
  login: string;
  name: string | null;
  avatar_url: string;
  email: string | null;
  bio: string | null;
  public_repos: number;
  followers: number;
  following: number;
  html_url: string;
}

// ── From github-api.ts ────────────────────────────────────────────────────────

export interface SimplifiedRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  language: string | null;
  stargazers_count: number;
  forks_count: number;
  updated_at: string;
  pushed_at?: string | null;
  archived?: boolean;
  html_url: string;
  default_branch: string;
  open_issues_count: number;
  private: boolean;
  is_collaborator: boolean;
  is_owner: boolean;
  owner: {
    login: string;
    avatar_url: string;
  };
}

export interface ReposApiResponse {
  currentUser: string;
  count: number;
  ownedCount: number;
  collaboratedCount: number;
  ownedRepos: SimplifiedRepo[];
  collaboratedRepos: SimplifiedRepo[];
  data: SimplifiedRepo[];
}

export interface GitHubErrorResponse {
  error: string;
  message: string;
  status?: number;
}
