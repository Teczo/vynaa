# Vynaa AI — Branching Node Chat

A branching node AI chat interface built with React 19 + TypeScript + Vite + Tailwind on the frontend, and Node.js + Express + MongoDB on the backend. Conversations render as draggable bubble nodes on an infinite canvas, connected by animated bezier curves, allowing users to explore multiple inquiry threads simultaneously.

## Features

- **Branching conversations** — fork any node to explore multiple lines of inquiry
- **Infinite canvas** — pan, zoom, drag nodes freely
- **BYOK (Bring Your Own Key)** — supports Google Gemini, OpenAI, and Anthropic. API keys stored in browser session only, never on the server
- **Streaming responses** — AI responses appear token-by-token
- **Session management** — create, rename, delete, and switch between chat sessions
- **Canvas persistence** — node positions saved to database

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Framer Motion
- **Backend**: Node.js, Express 5, MongoDB (Mongoose)
- **Auth**: JWT + bcrypt (email/password)

## Setup

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Install

```bash
npm install
```

### Configure

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

Required environment variables:

- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — random secret for JWT signing

### Run

```bash
# Start backend (port 3001)
npm run server

# Start frontend (port 3000)
npm run dev
```

### Build

```bash
npm run build
```

## Architecture

- **Backend**: Express REST API at `/api/auth`, `/api/sessions`, `/api/user`
- **Database**: Normalized schema with `User`, `ChatSession`, and `Turn` collections
- **AI Calls**: Server proxies requests to AI providers using the user's API key (sent per-request, never stored)
- **Auth**: JWT access tokens (15min) + refresh tokens via httpOnly cookies
