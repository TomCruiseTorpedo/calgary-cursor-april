<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Learned User Preferences

- Document setup and secrets as local-first: put keys and overrides in `.env.local` (gitignored); avoid treating cloud deploy as the primary story unless asked.
- Use OpenRouter for optional LLM refinement when a key is present; prefer free-tier or routed models for demos and keep template fallbacks when inference is off.

## Learned Workspace Facts

- Next.js app: an “AI tools funnel” — persona-weighted scoring over candidates, mock catalog; RSS merge is **opt-in** (`ENABLE_RSS_INGEST=true`, see `lib/funnel/config/`); structured-only OpenRouter enrichment (`lib/funnel/llm/openrouter.ts`).
- Default OpenRouter model when `OPENROUTER_MODEL` is unset: `tencent/hy3-preview:free` (see `lib/funnel/llm/openrouter.ts`).
- UI tokens and layout align with root `DESIGN.md` from the ElevenLabs pack installed via getdesign (`npx getdesign add elevenlabs`).
