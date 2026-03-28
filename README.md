# Magi AI-Powered Content Editor

This is a full-stack assignment implementation with:

- TipTap-based rich editor (open-source extensions only)
- AI content generation for blog posts and social posts
- Structured TipTap JSON output (not plain text dumps)
- Progressive rendering via streamed block chunks into the editor

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

- Progressive rendering: `/api/generate-stream` streams NDJSON block chunks and the editor appends them live.
- Generation can be stopped mid-run from the UI.

### Nice-to-have included

- Optional reference context input for prompt grounding.
- UX touches: status indicators and stop button.

## Architecture

### Backend (`api/`)

- `POST /api/generate`: returns a complete TipTap doc.
- `POST /api/generate-stream`: streams `chunk`, `done`, `error` events.
- AI layer:
  - Builds system/user prompts by content type.
  - Requests structured JSON from OpenAI.
  - Validates with Zod.
  - Falls back to deterministic structured content if model output is invalid or key is missing.

### Frontend (`web/`)

- Prompt panel with:
  - Content type selector
  - Prompt field
  - Optional context field
  - Generate/Stop actions
- TipTap editor receives streamed chunks and inserts each valid node progressively.

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

- **Streaming granularity**: block-level streaming was chosen for reliability and editor state safety. Token-level JSON streaming is possible but requires more complex partial-structure recovery.
- **Schema-first validation**: AI output is validated before use to prevent malformed ProseMirror trees from breaking the editor.
- **Fallback strategy**: deterministic fallback ensures demo reliability even without API access.
- **Extensibility**: new content types can be added by extending prompt templates + block post-processing and keeping the same API contract.

## With more time

- True partial JSON assembly from model deltas.
- Attach files and perform retrieval/grounding.
- Support richer layout primitives (custom column nodes/drag-drop sections).
- Add tests for API contracts and stream parsing.
