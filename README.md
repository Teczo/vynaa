# VynaaAI — Branching Node Chat Interface

An AI chat interface where conversations branch into draggable nodes on an infinite canvas. Fork any message to explore multiple lines of inquiry simultaneously — like a mind map meets ChatGPT.

Built with React 19 + TypeScript + Vite + Tailwind on the frontend, Node.js + Express 5 + MongoDB on the backend.

## Why This Exists

Linear chat interfaces force you into a single conversation thread. VynaaAI lets you branch off at any point — compare different prompts, explore tangents, and keep your main thread clean. Every node is draggable, the canvas is infinite, and each branch carries its own conversation history up to the root.

## Features

- **Branching conversations** — every message is a node; reply from any node to fork a new line of inquiry. The server rebuilds context by walking the `parentTurnId` chain back to the root, so each branch keeps an independent history.
- **Infinite canvas** — pan, zoom, and drag nodes freely, with animated bezier-curve connections between parent and child turns.
- **BYOK (Bring Your Own Key)** — supports Google Gemini, OpenAI, and Anthropic. Keys live only in your browser's `sessionStorage` and are sent per-request; they are never persisted to the database.
- **Streaming responses** — AI output is streamed token-by-token over Server-Sent Events and rendered live on the node.
- **Connection test** — validate a provider/model/key combination from the settings panel before you start chatting.
- **Session management** — create, rename, delete, and switch between canvases. The first message auto-titles the canvas.
- **Canvas persistence** — node positions are saved per-turn, so your layout is restored exactly when you reopen a session.
- **Theme toggle** — dark / light mode.
- **Undo** — step back through canvas actions.
- **Account & data control** — JWT + bcrypt email/password auth with rotating refresh-token sessions, plus one-click full data export (JSON) and account deletion (cascading delete of all sessions and turns).

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite 6, Tailwind CSS, Framer Motion, React Router 7, lucide-react |
| Backend | Node.js, Express 5, MongoDB (Mongoose 9), tsx |
| Auth | JWT access tokens (Bearer) + httpOnly refresh cookies, bcrypt password hashing |
| Security | Helmet, CORS allow-list, rate-limited login |
| AI Providers | OpenAI, Anthropic, Google Gemini (user-supplied keys) |

## Architecture

```
Client (React / Vite, :3000)
        │  axios + fetch (SSE)
        ▼
Express API (:3001)
        │
        ├── /api/auth      → signup, login (rate-limited), logout, refresh
        ├── /api/user      → profile, data export, account deletion   [protected]
        └── /api/sessions  → CRUD canvases                            [protected]
              ├── /:id/turns              → create turn + stream AI reply (SSE)
              └── /:id/turns/:t/position  → persist node position
        │
        ▼
   MongoDB (Mongoose)        AI Provider APIs
                             (user's key, per-request, proxied — never stored)
```

### Data model

Four collections:

| Collection | Purpose |
|------------|---------|
| `User` | email, bcrypt password hash, name |
| `Session` | refresh-token sessions (hashed token, user agent, IP) with a TTL index for expiry |
| `ChatSession` | a canvas — title + owner |
| `Turn` | a single node — role, content, provider/model, `parentTurnId`, and `{x, y}` position |

- **Server-proxied AI calls** — the browser sends the user's key with each turn request; the server streams the provider response back and never writes the key anywhere.
- **Ownership-scoped queries** — every session/turn query is filtered by the authenticated `userId`.

## Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Install & Run

```bash
git clone https://github.com/Teczo/vynaa.git
cd vynaa
npm install
cp .env.example .env.local
# Set MONGODB_URI and JWT_SECRET in .env.local (see below)

# Start the backend API (port 3001)
npm run server

# In a second terminal, start the frontend (port 3000)
npm run dev
```

Open http://localhost:3000, create an account, then add a provider API key under **Settings** to start chatting.

### Environment variables

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `MONGODB_URI` | ✅ | — | MongoDB connection string |
| `JWT_SECRET` | ✅ | — | Secret for signing access tokens |
| `PORT` | — | `3001` | Backend server port |
| `VITE_APP_URL` | — | `http://localhost:5173` | Added to the CORS allow-list |
| `VITE_API_URL` | — | `http://localhost:3001/api` | Frontend → API base URL |
| `NODE_ENV` | — | `development` | Enables stack traces in error responses |

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start the Vite dev server (frontend) |
| `npm run server` | Start the Express API via tsx |
| `npm run build` | Build the frontend for production |
| `npm run preview` | Preview the production build |

## About

Built by [Jayagaren Paramasivam](https://linkedin.com/in/jayagaren) at [Teczo](https://github.com/Teczo). VynaaAI started as an experiment in non-linear AI interfaces — exploring how spatial layouts can make AI conversations more useful for research, brainstorming, and complex problem-solving.

## License

Proprietary — all rights reserved.
