# BigPoker

Real-time Planning Poker for teams — no accounts, no installs. Pick a name, create or join a room by code, and estimate together.

## Features

- Create a room and share its 6-character code, or join an existing one.
- Master starts a round with a question; everyone votes with a Fibonacci card.
- Auto-reveal once every seat has voted, or the master reveals manually.
- Live sync across all participants via Server-Sent Events (SSE) — no polling.
- Master can kick participants; anyone (except the master) can leave.
- No login: identity is a name + a per-room id kept in `localStorage`.

## Stack

- [TanStack Start](https://tanstack.com/start) + TanStack Router (file-based routing), React 19, Vite 8.
- Tailwind CSS v4 (`@tailwindcss/vite`).
- [Biome](https://biomejs.dev) for linting/formatting.
- [Vitest](https://vitest.dev) for tests.
- Package manager: pnpm.

No database — rooms are held in memory on the server for the process's lifetime (`InMemoryRoomRepository`). No auth, no external services.

## Getting started

```bash
pnpm install
pnpm dev       # http://localhost:3000
```

## Scripts

| Command        | Description                                       |
| -------------- | -------------------------------------------------- |
| `pnpm dev`     | Start the dev server on port 3000                  |
| `pnpm build`   | Production build (`dist/client` + `dist/server`)   |
| `pnpm preview` | Preview the production build                       |
| `pnpm test`    | Run the test suite (Vitest)                        |
| `pnpm lint`    | Lint with Biome                                    |
| `pnpm format`  | Format and write with Biome                        |
| `pnpm check`   | Lint + format + import sort, write                 |

## Project structure

Feature-based (Screaming Architecture): each feature owns its own `domain` / `application` / `infrastructure` / `presentation` layers.

```
src/
  app/            composition root — wires repositories/gateways into use-cases
  features/
    room/         the core aggregate: room lifecycle, state machine, invariants
    participants/ joining, leaving, kicking
    voting/       casting votes, starting rounds, revealing/closing results
    connection/   client-side connection status UI
  routes/         TanStack Router file-based routes (incl. the SSE endpoint)
  server/         server entry
  shared/         cross-feature UI primitives and utilities
```

Each feature's `domain` layer holds types and pure business rules; `application` holds use-cases (one class per action, DI'd with ports); `infrastructure` implements those ports (in-memory repository, SSE gateway, server functions); `presentation` holds routes/components/hooks.

## Testing

```bash
pnpm test
```

Use-case tests share one harness (`src/app/testing/room-harness.ts`) that wires an in-memory repository and gateway per test, so each test file runs isolated from the others.

## Deployment

Not configured — `pnpm build` produces a Node-targetable server bundle, but no hosting adapter has been chosen yet.
