<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Learned User Preferences

- Document setup and secrets as local-first: put keys and overrides in `.env.local` (gitignored); avoid treating cloud deploy as the primary story unless asked.
- Use OpenRouter for optional LLM refinement when a key is present; prefer free-tier or routed models for demos and keep template fallbacks when inference is off.
- When using OpenRouter locally, set `OPENROUTER_APP_URL` to the same origin as your running dev server (scheme, host, and port) so provider headers match the URL you demo in the browser.
- Prefer trust-inducing funnel UI: calm white–beige inner content surfaces (`inner-well`), restrained chroma in page chrome (avoid rainbow/RGB column aesthetics); tinted outer shells are fine if readable areas stay neutral.

## Learned Workspace Facts

- Next.js app: an “AI tools funnel” — persona-weighted scoring over candidates, mock catalog; **live signal river** is **opt-in** (`ENABLE_RSS_INGEST=true`): merges RSS (`feeds.json`), **Hacker News** via Algolia (`lib/funnel/providers/hn-algolia.ts`), and **GitHub Atom** releases + user activity (`lib/funnel/providers/github-atom.ts`, watch list `lib/funnel/config/github-watch.json`). Funnel *tool evidence* from RSS still uses `feeds.json` + `keywords.json` only. Structured-only OpenRouter enrichment (`lib/funnel/llm/openrouter.ts`).
- Aggregate headline panel is served by `GET /api/aggregate` (`lib/funnel/aggregate-feed.ts`); persona lens copy and per-row “why” explanations live in `lib/funnel/persona-copy.ts` and `lib/funnel/explain.ts`.
- Default OpenRouter model when `OPENROUTER_MODEL` is unset: `tencent/hy3-preview:free` (see `lib/funnel/llm/openrouter.ts`).
- UI builds on root `DESIGN.md` (ElevenLabs via getdesign); the live funnel shell uses trust-neutral tokens—stone/slate `AtmosphereOrbs`, `inner-well` plus trust/shell utility classes for panels and controls—and sturdier type (Inter + Cormorant Garamond weights 400–700 in `app/layout.tsx`, body weight 500 in `globals.css`, semibold/medium emphasis in `FunnelApp.tsx`).
