<!-- intent-skills:start -->
## Skill Loading

Before editing files for a substantial task:
- Run `pnpm dlx @tanstack/intent@latest list` from the workspace root to see available local skills.
- If a listed skill matches the task, run `pnpm dlx @tanstack/intent@latest load <package>#<skill>` before changing files.
- Use the loaded `SKILL.md` guidance while making the change.
- Monorepos: when working across packages, run the skill check from the workspace root and prefer the local skill for the package being changed.
- Multiple matches: prefer the most specific local skill for the package or concern you are changing; load additional skills only when the task spans multiple packages or concerns.
<!-- intent-skills:end -->

## Project Context

### Scaffolding

Created with the TanStack CLI, run from the parent workspace directory (`code/`):

```
npx @tanstack/cli@latest create big-poker --framework react --package-manager pnpm --tailwind --agent -y
```

Then, from inside `big-poker/`:

```
npx @tanstack/intent@latest install
npx @tanstack/intent@latest list
```

### Stack

- TanStack Start + TanStack Router (file-based routing), React 19, Vite 8.
- Tailwind CSS v4 (via `@tailwindcss/vite`) — standard scaffold always includes it; the `--tailwind` flag is a deprecated no-op kept only for command fidelity.
- TanStack Devtools + Router Devtools (dev-only; stripped from production builds automatically by `@tanstack/devtools-vite`).
- Package manager: pnpm.
- No lint/format toolchain was installed (no `--toolchain` flag passed, and `-y` skipped the prompt) — no Biome/ESLint config or scripts exist yet.
- No deployment adapter configured (no `--deployment` flag passed) — `vite build` produces a Node-targetable server bundle in `dist/`, but no host-specific adapter has been chosen or tested.
- No add-ons/integrations installed (no `--add-ons`, no auth/DB/etc.) — this is intentionally a blank/minimal starting point beyond the default example route (`/`, `/about`) and Header/Footer/ThemeToggle components the standard scaffold ships with.
- Git repo initialized by the CLI itself inside `big-poker/` (separate from the parent `code/` folder, which is not a git repo).

### Environment variables

None required. No auth, database, or deployment integrations were selected, so there's no `.env` to configure. If integrations are added later via `tanstack add`, document their required env vars here.

### Deployment

Not configured. `pnpm build` produces `dist/client` and `dist/server` (SSR-capable). Pick a deployment adapter later with `tanstack add` (Cloudflare Workers, Netlify, Vercel, Node/Docker, Bun, Railway) — see the `@tanstack/start-client-core#start-core/deployment` Intent skill above before wiring one up.

### Key decisions

- Chose the **standard** scaffold (default example UI/devtools/tests, Tailwind included) over `--blank`, per explicit user confirmation — `--blank` would have produced a single bare route with no Tailwind/devtools, which conflicted with the literal `--tailwind` flag in the requested command.
- `--agent` is a valid but hidden CLI flag (telemetry only: marks the invocation as agent-originated); it does not change scaffold output.
- Skipped toolchain and deployment selection entirely rather than guessing — left for a future explicit decision.

### Gotchas

- `pnpm` field `onlyBuiltDependencies` in `package.json` triggers a pnpm warning ("no longer read by pnpm") on every install/dev/build — pnpm has moved this setting elsewhere; harmless but noisy. Not fixed here since it was CLI-generated and out of scope for a blank scaffold.
- Running `intent install` again without `--map` rewrites the managed block to the generic "lightweight guidance" form (what's above) instead of the specific per-skill `id`/`run`/`for` mappings the CLI wrote automatically during scaffolding. Re-run with `--map` if the explicit mapping list is preferred.

### Next steps

- `pnpm dev` to run locally at `http://localhost:3000`.
- `pnpm build` / `pnpm preview` to check production output.
- Use `tanstack add` to bring in add-ons (auth, database, deployment adapter, toolchain, etc.) when needed — then re-run `npx @tanstack/intent@latest list` to pick up new skills.
