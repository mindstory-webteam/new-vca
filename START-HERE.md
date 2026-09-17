# Viral Cat website — start here

A standard Next.js 16 (App Router) website. Design, layout, content and the
Cat Street puzzle game are unchanged; only the hosting-specific plumbing has
been removed.

## Run it locally

You need Node.js 20.9 or newer.

```sh
npm install
npm run dev
```

Open http://localhost:3000.

To build and serve the production version:

```sh
npm run build
npm start
```

Other scripts: `npm run lint` and `npm test`.

## What changed from the previous download

Removed, because they tied the project to one specific host:

- Vite + `vinext` build pipeline (`vite.config.ts`, `build/`, `scripts/`, `.openai/`)
- Cloudflare Workers runtime, Wrangler, D1 and R2 bindings (`cloudflare-env.d.ts`)
- Drizzle ORM, its schema and SQL migrations (`db/`, `drizzle/`, `drizzle.config.ts`)
- The `examples/` folder and the pnpm workspace policy files

Already removed in the previous pass: the login system, user accounts, the
Cat Den workspace, and the account-bound rewards.

Unchanged: every page, component, stylesheet, animation and asset — including
the five-stage Cat Street puzzle game at `/play`, with the original mascot,
undo, hints and move bonuses. Puzzle scores are practice only and stay in the
page for the session.

## Where submitted briefs go

The contact brief and the local-growth enquiry both post to `POST /api/briefs`.
Instead of a Cloudflare D1 database, each submission is now written as a JSON
file. The route stays idempotent: resubmitting the same `submissionId` returns
the original reference rather than creating a duplicate.

- Default location: `.data/briefs/` inside the project (git-ignored).
- Set `BRIEF_DATA_DIR` to write somewhere else — see `.env.example`.

This works with `npm start` on any normal Node server, VPS or container. On a
read-only or serverless filesystem (Vercel, Netlify functions, Lambda) the
write will fail and the form will show its error state, so swap the
`findBrief` and `saveBrief` functions in `lib/server.ts` for a real database,
an email send, or a form service. Those two functions are the only storage
code in the project.

## Project layout

- `app/` — pages, route handlers and the global stylesheets
- `components/` — interactive modules; `components/ui/` is the shadcn registry
- `lib/cat-puzzles.ts` — puzzle stages, rules, scoring and hints
- `lib/cat-puzzle-scene.ts` — puzzle visuals and the original mascot
- `lib/server.ts` — brief storage helpers
- `public/assets/` — brand and visual assets
- `tests/` — puzzle, form and movement checks
