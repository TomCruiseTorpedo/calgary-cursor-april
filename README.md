# AI tools funnel

**Buildathon idea:** cut through AI-tool hype for developers—**ranked picks** with **inspectable scores**, **evidence-style signals** (including free RSS mentions), and **step-by-step adoption guidance**, filtered by **persona** (frontend, backend, DevOps, cloud, full-stack). Optional **OpenRouter** rewrites the guide from *your pipeline’s JSON only* (no web browsing in the prompt).

## What you get

- **Funnel scores** on a 0–100 scale with subscores: recency, adoption, convergence, maintainer health, persona **fit**
- **Mock catalog** of real-ish tools + **curated RSS** merge ([`lib/funnel/config/feeds.json`](lib/funnel/config/feeds.json) + [`keywords.json`](lib/funnel/config/keywords.json))
- **API:** `GET /api/funnel?persona=&q=&limit=` · `POST /api/enrich` (OpenRouter polish for one tool)
- **UI:** ElevenLabs-inspired editorial styling — see [`DESIGN.md`](DESIGN.md) and [getdesign.md ElevenLabs](https://getdesign.md/elevenlabs/design-md)

## Stack

- **Next.js** (App Router) · **TypeScript** · **Tailwind CSS v4**
- **rss-parser** for $0 HTTP ingest · OpenRouter-compatible chat API for copy refinement

## Quick start

```bash
npm install
cp .env.example .env.local
```

**Demo with OpenRouter:** edit **`.env.local`** (already gitignored) and set `OPENROUTER_API_KEY` to your key from [openrouter.ai/keys](https://openrouter.ai/keys). Restart `npm run dev`, pick a tool, then **Refine copy (OpenRouter)**.

```bash
# Optional: ENABLE_RSS_INGEST=true to merge live RSS (slower first load)
npm run dev
```

Open **http://localhost:3000** (use another port if 3000 is busy).

```bash
npm run build   # production check
npm run lint    # ESLint
```

## Environment

| Variable | Purpose |
|----------|---------|
| `OPENROUTER_API_KEY` | Server-only; enables OpenRouter for refined summary/guide text. |
| `OPENROUTER_MODEL` | Model slug (defaults to `tencent/hy3-preview:free`). |
| `OPENROUTER_APP_URL` | Optional `HTTP-Referer` for OpenRouter. |
| `USE_MOCK_DATA` | Default `true`; reserved for non-mock catalogs later. |
| `ENABLE_RSS_INGEST` | **`false` by default** — set `true` to merge live RSS feeds (can slow or flake first load). |
| `RSS_FEED_TIMEOUT_MS` | Per-feed timeout when RSS on (default 8000). |
| `RSS_CACHE_TTL_MS` | Cache for merged RSS+mock results (default 10 min). |
| `RSS_MAX_AGE_DAYS` | Drop older RSS items (default 14). |
| `RSS_MAX_EVIDENCE_PER_TOOL` | Cap RSS evidence rows per tool (default 12). |

Copy **`.env.example` → `.env.local`** for local secrets; never commit `.env.local`.

## Project layout

| Path | Role |
|------|------|
| [`app/page.tsx`](app/page.tsx) | Server-loads initial funnel; client UI in [`components/FunnelApp.tsx`](components/FunnelApp.tsx) |
| [`lib/funnel/pipeline.ts`](lib/funnel/pipeline.ts) | Dedupe, filter, score, sort |
| [`lib/funnel/scoring.ts`](lib/funnel/scoring.ts) | Weighted rubric + persona keywords |
| [`lib/funnel/providers/`](lib/funnel/providers/) | Mock data + RSS augmentation |
| [`lib/funnel/llm/openrouter.ts`](lib/funnel/llm/openrouter.ts) | Structured OpenRouter calls + template fallback |

## Ingest notes ($0)

- **RSS/Atom** only (no headless browser bill). LinkedIn etc. are out of scope for automated ingest; extend with manual URLs later if needed.
- Tune feeds and keyword phrases in **`lib/funnel/config/`**.

## License

See [`LICENSE`](LICENSE) in the repo.
