# Magi AI-Powered Content Editor

This is a full-stack assignment implementation with:

- TipTap-based rich editor (open-source extensions only)
- AI content generation for blog posts and social posts
- Progressive rendering via SSE streaming events
- Conversation persistence with TipTap snapshots

## Tech stack

- Frontend: React + Vite + TipTap
- Backend: Node.js + Express + OpenAI SDK
- Language: TypeScript across frontend and backend

## Features delivered

### Must-haves

1. Functional rich editor using TipTap OSS.
2. AI generation from prompt input with content type selection (`blog`, `social`).
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
