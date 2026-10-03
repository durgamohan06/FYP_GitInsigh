# GitInsight AI — Setup Guide

## Prerequisites

| Tool | Version | Notes |
|------|---------|-------|
| Node.js | 18+ | Required |
| npm | 9+ | Bundled with Node.js |
| Git | Any | For version control |

## GitHub OAuth App Setup

You need a GitHub OAuth App to allow users to sign in.

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **"New OAuth App"**
3. Fill in the details:
   - **Application name**: `GitInsight AI` (or any name)
   - **Homepage URL**: `http://localhost:8080`
   - **Authorization callback URL**: `http://localhost:8080/api/auth/github/callback`
4. Click **"Register application"**
5. Copy the **Client ID**
6. Click **"Generate a new client secret"** and copy it

> ⚠️ Never share your Client Secret or commit it to version control.

## Installation

```bash
# Clone (or navigate to) the project
cd fyp_project

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

## Environment Configuration

### Backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```env
GITHUB_CLIENT_ID=your_actual_client_id
GITHUB_CLIENT_SECRET=your_actual_client_secret
GITHUB_CALLBACK_URL=http://localhost:8080/api/auth/github/callback
PORT=3001
FRONTEND_URL=http://localhost:8080
```

### Frontend

The frontend `.env` is optional for local development (the Vite proxy handles API routing automatically):

```bash
cd frontend
cp .env.example .env
# No changes needed for local dev
```

## Running Locally

You need two terminal windows:

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Output: 🚀 GitInsight AI Backend running at http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Output: VITE ready in ...ms — Local: http://localhost:8080/
```

Open **http://localhost:8080** in your browser.

## Building for Production

```bash
# Build frontend
cd frontend
npm run build

# Start backend in production mode
cd backend
npm run build   # Compiles TypeScript to dist/
npm run start   # Runs dist/app.js
```

## Troubleshooting

### "GitHub OAuth credentials missing" error
→ Make sure `backend/.env` has valid `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.

### API calls failing (401 / network error)
→ Ensure the backend is running on port 3001 before starting the frontend.

### Port already in use
→ Backend defaults to port 3001. Change `PORT=3002` in `backend/.env` and update `VITE_API_URL=http://localhost:3002` in `frontend/.env`.
