# AI content creator

This is a full-stack assignment implementation with:

- TipTap-based rich editor (open-source extensions only)
- AI content generation for blog posts and LinkedIn posts
- Progressive rendering via SSE streaming events
- Conversation persistence with TipTap snapshots

## Tech stack

- Frontend: React + Vite + TipTap
- Backend: Node.js + Express + OpenAI SDK
- Language: TypeScript across frontend and backend

## Features delivered

### Must-haves

1. Functional rich editor using TipTap OSS.
2. AI generation from prompt input with content type selection for blog posts and LinkedIn posts (`blog`, `social`).
3. Structured content rendering in editor, including richer elements like images and tables.
4. Separated frontend/backend/AI orchestration with explicit API contracts.

### Strong bonus

- Progressive rendering: `/api/stream` streams SSE events (`delta`, `block`, `done`, `error`) and the editor applies them live.
- Generation can be stopped mid-run from the UI.
- Ongoing conversations are resumed with `conversationId`.

### Nice-to-have included

- Optional reference context input for prompt grounding.
- UX touches: status indicators and stop button.

## Architecture

### Backend (`api/`)

- `POST /api/stream`: streams structured events over SSE.
- AI layer:
  - Calls OpenAI with `stream: true`.
  - Parses model token deltas into server-validated events.
  - Emits explicit block boundaries for safe TipTap updates.
- Persistence layer:
  - Stores conversations, messages, and document snapshots in `api/data/conversations.json`.

### Frontend (`web/`)

- Prompt panel with:
  - Content type selector
  - Prompt field
  - Optional context field
  - Generate/Stop actions
- TipTap editor keeps a valid in-memory document and applies stream events incrementally.

## Local setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file:

```bash
cp .env.example .env
```

3. Add your `OPENAI_API_KEY` in `.env` (optional; app still runs with fallback content).

4. Run both services:

```bash
npm run dev
```

- Web: `http://localhost:5173`
- API: `http://localhost:4000`

## Build / type-check

```bash
npm run build
npm run lint
```

## Deploying on Vercel

Deploy the backend first, then deploy the frontend with the backend URL.

### 1. Backend deploy (`api/`)

This backend is now Vercel-compatible as an Express app exported from `api/src/index.ts`.

Recommended Vercel project settings:

- Root Directory: `api`
- Framework Preset: `Other`
- Install Command: leave default
- Build Command: leave default

Backend environment variables:

- `OPENAI_API_KEY` or `GEMINI_API_KEY`, depending on provider
- `AI_TEXT_PROVIDER`
- `AI_IMAGE_PROVIDER`
- `OPENAI_MODEL` or `GEMINI_TEXT_MODEL`
- `GEMINI_IMAGE_MODEL` if you enable Gemini image generation
- `CORS_ORIGINS=https://<your-frontend-domain>`
- Optional: `ALLOW_VERCEL_PREVIEW_ORIGINS=true` if you want preview frontend URLs on `*.vercel.app` to call the API

After deploy, verify:

- `https://<your-backend-domain>/api/health` returns `{ "ok": true }`

Important backend notes on Vercel:

- Vercel functions do not provide durable local filesystem storage. This app falls back to `/tmp/magi-conversations.json` on Vercel so the API works, but conversation history and snapshots are not guaranteed to survive cold starts or instance changes.
- If you need real persistence, move `api/src/conversation-store.ts` to external storage such as Neon, Supabase, Upstash Redis, or another hosted database.
- Reference-file uploads are stricter on Vercel because function payloads are limited. The deployed backend now caps uploads to 1 file up to 4 MB. Keep the total request small.

### 2. Frontend deploy (`web/`)

Recommended Vercel project settings:

- Root Directory: `web`
- Framework Preset: `Vite`
- Install Command: leave default
- Build Command: leave default
- Output Directory: `dist`

Frontend environment variables:

- `VITE_API_BASE_URL=https://<your-backend-domain>`

After deploy, open the frontend and test:

- Save
- Generate
- Stop generation
- Reload after a save

### 3. Suggested deploy order

1. Push your repo to GitHub.
2. Import the repo into Vercel as a backend project with root `api`.
3. Add backend env vars and deploy.
4. Copy the backend production URL.
5. Import the same repo again into Vercel as a frontend project with root `web`.
6. Add `VITE_API_BASE_URL` pointing to the backend URL.
7. Deploy the frontend.
8. Add the final frontend URL back into backend `CORS_ORIGINS` and redeploy the backend if needed.

### 4. Preview deploys

If you want frontend preview deployments to work against the same backend:

- Set `ALLOW_VERCEL_PREVIEW_ORIGINS=true` on the backend, or
- Add the exact preview URLs to `CORS_ORIGINS`

### 5. Custom domains

If you later attach custom domains:

- Update `CORS_ORIGINS` on the backend to use the custom frontend domain
- Update `VITE_API_BASE_URL` on the frontend if the backend gets a custom domain too

## Design choices and tradeoffs

- **Streaming protocol**: SSE with JSON payloads (`event:` + `data:`) keeps transport simple and robust for long responses.
- **Safety**: the client never parses partial TipTap JSON; it applies explicit `delta`/`block` events to a valid document tree.
- **Persistence model**: both raw message text and final TipTap JSON are stored to support LLM context and exact editor recreation.
- **Layout strategy**: basic blocks stream live (paragraphs, headings, lists, images); complex layout can be post-processed after stream completion.

## With more time

- True partial JSON assembly from model deltas.
- Attach files and perform retrieval/grounding.
- Support richer layout primitives (custom column nodes/drag-drop sections).
- Add tests for API contracts and stream parsing.
