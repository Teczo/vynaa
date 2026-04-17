# VynaaAI — Branching Node Chat Interface

An AI chat interface where conversations branch into draggable nodes on an infinite canvas. Fork any message to explore multiple lines of inquiry simultaneously — like a mind map meets ChatGPT.

Built with React 19 + TypeScript + Vite + Tailwind on the frontend, Node.js + Express + MongoDB on the backend.

## Why This Exists

Linear chat interfaces force you into a single conversation thread. VynaaAI lets you branch off at any point — compare different prompts, explore tangents, and keep your main thread clean. Every node is draggable, and the canvas is infinite.

## Features

- **Branching conversations** — fork any node to explore multiple inquiry threads at once
- **Infinite canvas** — pan, zoom, and drag nodes freely with animated bezier curve connections
- **BYOK (Bring Your Own Key)** — supports Google Gemini, OpenAI, and Anthropic; API keys stay in your browser session, never stored server-side
- **Streaming responses** — AI responses appear token-by-token in real time
- **Session management** — create, rename, delete, and switch between chat sessions
- **Canvas persistence** — node positions and layout saved to database across sessions
- **Auth system** — JWT + bcrypt email/password authentication with refresh tokens

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Framer Motion |
| Backend | Node.js, Express 5, MongoDB (Mongoose) |
| Auth | JWT access tokens (15min) + httpOnly refresh cookies |
| AI Providers | OpenAI, Anthropic, Google Gemini (user-supplied keys) |

## Architecture

```
Client (React) ──► Express API ──► MongoDB
                       │
                       ├── /api/auth      → signup, login, refresh
                       ├── /api/sessions  → CRUD chat sessions & turns
                       └── /api/user      → preferences, API key proxy
                       │
                       ▼
                 AI Provider APIs
            (using user's key per-request)
```

- **Normalised schema** — `User`, `ChatSession`, and `Turn` collections
- **Server-proxied AI calls** — user's API key sent per-request, never persisted
- **Canvas state** — node positions serialised and stored per session

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
# Add MONGODB_URI and JWT_SECRET to .env.local

# Start backend (port 3001)
npm run server

# Start frontend (port 3000)
npm run dev
```

### Build

```bash
npm run build
```

## About

Built by [Jayagaren Paramasivam](https://linkedin.com/in/jayagaren) at [Teczo](https://github.com/Teczo). VynaaAI started as an experiment in non-linear AI interfaces — exploring how spatial layouts can make AI conversations more useful for research, brainstorming, and complex problem-solving.

## License

Proprietary — all rights reserved.
