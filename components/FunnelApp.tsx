"use client";

import { useCallback, useState } from "react";
import { AtmosphereOrbs } from "@/components/AtmosphereOrbs";
import { WaveformStrip } from "@/components/WaveformStrip";
import { explainWhyForYou } from "@/lib/funnel/explain";
import { PERSONA_CONTEXT } from "@/lib/funnel/persona-copy";
import type {
  AggregateFeedItem,
  AggregateFeedSource,
  DevPersona,
  ScoredTool,
} from "@/lib/funnel/types";
import { DEV_PERSONA_GROUPS } from "@/lib/funnel/types";

type EnrichResponse = {
  summary: string;
  guide: string;
  source: "openrouter" | "template";
};

const personaLabel: Record<DevPersona, string> = {
  frontend: "Frontend",
  backend: "Backend",
  mobile: "Mobile",
  devops: "DevOps / SRE",
  cloud: "Cloud",
  security: "Security / AppSec",
  qa_test: "QA & test automation",
  data_ml: "Data & ML engineering",
  product: "Product / PM",
  design_ux: "Design & UX",
  fullstack: "Full-stack (generalist)",
};

const TOP_LIMIT = "7";

/** Viewport-relative panel height on large screens (dashboard density) */
const dashboardPanel =
  "xl:h-[calc(100vh-10.5rem)] xl:max-h-[calc(100vh-10.5rem)] xl:min-h-[min(560px,70vh)]";

function feedSourceLabel(src: AggregateFeedSource, rssIngest: boolean): string {
  if (!rssIngest) return "Curated digest (offline)";
  if (src === "live")
    return "Live: RSS + HN Algolia + GitHub Atom (+ digest filler)";
  if (src === "mixed") return "Partial live stream (RSS / HN / GitHub) + digest";
  return "Curated digest (live sources unavailable)";
}

export function FunnelApp({
  initialItems,
  rssIngest = false,
  initialFeedItems,
  feedSource,
}: {
  initialItems: ScoredTool[];
  /** When true, tool catalog + headlines can use live RSS */
  rssIngest?: boolean;
  initialFeedItems: AggregateFeedItem[];
  feedSource: AggregateFeedSource;
}) {
  const [persona, setPersona] = useState<DevPersona>("fullstack");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<ScoredTool[]>(initialItems);
  const [feedItems, setFeedItems] =
    useState<AggregateFeedItem[]>(initialFeedItems);
  const [feedMeta, setFeedMeta] = useState<{ source: AggregateFeedSource }>({
    source: feedSource,
  });
  const [feedRefreshing, setFeedRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [enrich, setEnrich] = useState<EnrichResponse | null>(null);
  const [enrichLoading, setEnrichLoading] = useState(false);

  const selected = items.find((i) => i.candidate.id === selectedId) ?? null;

  const refreshFeed = useCallback(async () => {
    setFeedRefreshing(true);
    try {
      const res = await fetch("/api/aggregate");
      if (!res.ok) return;
      const data = (await res.json()) as {
        items: AggregateFeedItem[];
        source: AggregateFeedSource;
      };
      setFeedItems(data.items);
      setFeedMeta({ source: data.source });
    } finally {
      setFeedRefreshing(false);
    }
  }, []);

  const loadFunnel = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        persona,
        q: query,
        limit: TOP_LIMIT,
      });
      const res = await fetch(`/api/funnel?${params}`);
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { items: ScoredTool[] };
      setItems(data.items);
      setSelectedId(null);
      setEnrich(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }, [persona, query]);

  const refineWithAi = useCallback(async () => {
    if (!selectedId) return;
    setEnrichLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedId, persona }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as EnrichResponse;
      setEnrich(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Enrich failed");
    } finally {
      setEnrichLoading(false);
    }
  }, [selectedId, persona]);

  const ctx = PERSONA_CONTEXT[persona];

  return (
    <div className="dashboard-canvas relative flex min-h-0 flex-1 flex-col">
      <AtmosphereOrbs />
      <div className="relative z-10 mx-auto flex w-full max-w-[min(1600px,100%)] flex-1 flex-col gap-6 px-4 py-8 md:gap-8 md:px-8 md:py-12">
        <header className="space-y-3 lg:flex lg:items-end lg:justify-between lg:gap-8">
          <div className="min-w-0 space-y-3">
            <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-muted">
              Signal river · ranked funnel · optional OpenRouter refinement
            </p>
            <div className="space-y-2">
              <WaveformStrip />
              <h1 className="font-display text-[2.34375rem] font-semibold leading-[1.1] tracking-[-0.04em] text-ink sm:text-[2.8125rem] md:text-[3.125rem] xl:text-[3.3125rem]">
                Cut AI-tool noise for your dev workflow
              </h1>
            </div>
          </div>
          <p className="max-w-xl shrink-0 text-[18.75px] leading-relaxed tracking-[0.01em] text-body lg:max-w-[min(440px,42vw)] lg:text-right">
            We merge an <strong className="font-semibold text-body-strong">aggregate feed</strong> of
            public sources (RSS, HN Algolia, GitHub Atom when enabled; otherwise a curated digest) and run a
            transparent <strong className="font-semibold text-body-strong">sifter</strong> on a
            catalog: role fit, recency, adoption, cross-source “buzz,” and maintainer health.
            Pick your profile, run the funnel, then open a tool for evidence + adoption steps.
          </p>
        </header>

        <div className="control-bar-trust flex flex-col gap-3 rounded-xl p-4 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex flex-col gap-1.5 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-muted">
            Your dev profile
            <select
              className="h-11 min-w-[min(100%,14rem)] max-w-full rounded-md border border-stone-200/90 bg-[linear-gradient(180deg,#fefdfb_0%,#faf8f5_100%)] px-4 text-[18.75px] font-medium text-ink shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_4px_14px_-4px_rgba(71,85,105,0.08)] backdrop-blur-[2px] focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/25"
              value={persona}
              onChange={(e) => setPersona(e.target.value as DevPersona)}
            >
              {DEV_PERSONA_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.personas.map((p) => (
                    <option key={p} value={p}>
                      {personaLabel[p]}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </label>
          <label className="min-w-[12rem] flex flex-1 flex-col gap-1.5 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-muted">
            Filter catalog
            <input
              className="h-11 rounded-md border border-stone-200/90 bg-[linear-gradient(180deg,#fefdfb_0%,#faf8f5_100%)] px-4 text-[18.75px] text-ink shadow-[inset_0_1px_2px_rgba(255,255,255,0.95),0_4px_14px_-4px_rgba(71,85,105,0.08)] backdrop-blur-[2px] placeholder:text-muted-soft focus:border-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400/25"
              placeholder="Name, tagline, or tag…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void loadFunnel()}
            />
          </label>
          <button
            type="button"
            className="h-10 rounded-full bg-gradient-to-b from-primary via-[#2f2a26] to-primary-active px-5 text-[18.75px] font-semibold text-on-primary shadow-[0_8px_28px_-6px_rgba(41,37,36,0.42),0_4px_18px_-4px_rgba(71,85,105,0.14)] transition-[filter,box-shadow] hover:brightness-105 active:brightness-95 disabled:opacity-60"
            disabled={loading}
            onClick={() => void loadFunnel()}
          >
            {loading ? "Running funnel…" : "Run funnel"}
          </button>
        </div>

        {error ? (
          <p className="rounded-xl border border-semantic-error/25 bg-surface-card px-4 py-3 text-[1.09375rem] text-semantic-error">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-12 xl:items-start xl:gap-6">
          {/* Column 1 — Signal river */}
          <section
            className={`panel-shell-feed flex min-h-0 flex-col rounded-xl p-5 ${dashboardPanel} lg:max-h-[min(520px,65vh)] lg:overflow-hidden xl:col-span-4 xl:max-h-none`}
          >
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-hairline-soft pb-3">
              <h2 className="font-display text-[1.40625rem] font-medium tracking-[-0.02em] text-ink xl:text-[1.5625rem]">
                Signal river
              </h2>
              <div className="flex items-center gap-2">
                <span className="max-w-[200px] truncate text-[13.75px] text-muted xl:max-w-none">
                  {feedSourceLabel(feedMeta.source, rssIngest)}
                </span>
                <button
                  type="button"
                  onClick={() => void refreshFeed()}
                  disabled={feedRefreshing}
                  className="h-8 shrink-0 rounded-full border border-stone-300/80 bg-gradient-to-b from-white to-stone-100 px-3 text-[15px] font-medium text-ink shadow-[0_4px_12px_-4px_rgba(71,85,105,0.12)] hover:bg-stone-50 disabled:opacity-50"
                >
                  {feedRefreshing ? "Refreshing…" : "Refresh"}
                </button>
              </div>
            </div>
            <p className="mt-3 shrink-0 text-[16.25px] leading-snug text-muted">
              Live when <code className="text-[15px]">ENABLE_RSS_INGEST=true</code>
              ; otherwise static digest.
            </p>
            <ul className="mt-3 min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]">
              {feedItems.map((it) => (
                <li
                  key={it.id}
                  className="inner-well rounded-r-lg border-l-[3px] border-l-stone-500/35 py-2 pl-3 pr-2 transition-colors hover:border-l-stone-600/45"
                >
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[17.5px] font-medium leading-snug text-body-strong underline decoration-hairline-strong underline-offset-2 hover:text-ink"
                  >
                    {it.title}
                  </a>
                  <p className="mt-0.5 text-[13.75px] text-muted">
                    {it.sourceLabel}
                    {it.publishedAt
                      ? ` · ${new Date(it.publishedAt).toLocaleDateString()}`
                      : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>

          {/* Column 2 — Top picks */}
          <section
            className={`panel-shell-picks flex min-h-0 flex-col rounded-xl p-5 ${dashboardPanel} lg:max-h-[min(520px,65vh)] lg:overflow-hidden xl:max-h-none xl:col-span-5`}
          >
            <div className="shrink-0 border-b border-hairline-soft pb-3">
              <h2 className="font-display text-[1.40625rem] font-medium tracking-[-0.02em] text-ink xl:text-[1.5625rem]">
                Top picks · {personaLabel[persona]}
              </h2>
              <p className="mt-1 text-[16.25px] text-muted">
                Max {TOP_LIMIT}. “Why” uses the same subscores as the chips—inspectable, not a black box.
              </p>
            </div>
            <ul className="mt-3 flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain pr-1 [-webkit-overflow-scrolling:touch]">
              {items.map((row) => {
                const active = row.candidate.id === selectedId;
                const why = explainWhyForYou(persona, row);
                return (
                  <li key={row.candidate.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(row.candidate.id);
                        setEnrich(null);
                      }}
                      className={`pick-shell w-full text-left ${active ? "pick-shell-active" : ""}`}
                    >
                      <div className="inner-well rounded-lg p-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-display text-[1.40625rem] font-semibold tracking-[-0.02em] text-ink">
                          {row.candidate.name}
                        </span>
                        <span className="text-[17.5px] font-semibold tabular-nums text-body-strong">
                          {row.score.total}
                        </span>
                      </div>
                      <p className="mt-1.5 text-[17.5px] leading-snug text-body">
                        {row.candidate.tagline}
                      </p>
                      <p className="mt-2 text-[16.25px] leading-relaxed text-body">
                        {why}
                      </p>
                      <p className="mt-2 text-[11.25px] font-semibold uppercase tracking-[0.12em] text-muted">
                        Score breakdown
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <ScoreChip
                          label="Recency"
                          value={row.score.subscores.recency}
                        />
                        <ScoreChip
                          label="Adoption"
                          value={row.score.subscores.adoption}
                        />
                        <ScoreChip
                          label="Convergence"
                          value={row.score.subscores.convergence}
                        />
                        <ScoreChip
                          label="Maintainer"
                          value={row.score.subscores.maintainer}
                        />
                        <ScoreChip label="Fit" value={row.score.subscores.fit} />
                      </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Column 3 — Profile lens + detail */}
          <aside
            className={`flex min-h-0 flex-col gap-4 lg:col-span-2 xl:sticky xl:top-24 xl:col-span-3 xl:self-start ${dashboardPanel} xl:overflow-y-auto`}
          >
            <section className="panel-shell-rail shrink-0 rounded-xl p-4">
              <div className="inner-well rounded-lg p-3">
                <h2 className="font-display text-[1.25rem] font-medium tracking-[-0.02em] text-ink">
                  Profile lens · {personaLabel[persona]}
                </h2>
                <p className="mt-1 text-[12.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                  {ctx.headline}
                </p>
                <p className="mt-2 text-[16.25px] leading-relaxed text-body">{ctx.lens}</p>
              </div>
            </section>

            {!selected ? (
              <div className="placeholder-trust rounded-xl p-4 text-[17.5px] leading-relaxed text-muted">
                Select a tool from <strong className="font-semibold text-body-strong">Top picks</strong>{" "}
                for evidence + adoption steps.{" "}
                <strong className="font-semibold text-body-strong">Refine copy</strong> needs{" "}
                <code className="text-[15px]">OPENROUTER_API_KEY</code>.
              </div>
            ) : (
              <div className="flex min-h-0 flex-col gap-4">
                <div className="rounded-xl border border-stone-300/60 bg-gradient-to-b from-[#ebe8e4] to-[#ddd9d3] p-1 shadow-sm">
                  <div className="inner-well rounded-lg p-4">
                  <p className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Selection
                  </p>
                  <h3 className="mt-1 font-display text-[1.5625rem] font-semibold tracking-[-0.02em] text-ink">
                    {selected.candidate.name}
                  </h3>
                  <a
                    href={selected.candidate.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block break-all text-[17.5px] text-body underline decoration-hairline-strong underline-offset-[3px] transition-colors hover:text-ink"
                  >
                    {selected.candidate.url}
                  </a>
                  {selected.candidate.repoUrl ? (
                    <p className="mt-2">
                      <a
                        href={selected.candidate.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[17.5px] text-body underline decoration-hairline-strong underline-offset-[3px] hover:text-ink"
                      >
                        Repository
                      </a>
                    </p>
                  ) : null}
                  </div>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto rounded-xl border border-stone-300/60 bg-gradient-to-b from-[#ebe8e4] to-[#e0dcd6] p-1 shadow-sm">
                  <div className="inner-well min-h-full rounded-lg p-4">
                  <h3 className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Evidence (mock + optional RSS)
                  </h3>
                  <ul className="mt-2 space-y-2 text-[17.5px] leading-relaxed text-body">
                    {selected.candidate.evidence.map((ev, i) => (
                      <li
                        key={i}
                        className="border-b border-hairline-soft pb-2 last:border-0"
                      >
                        <span className="font-medium text-body-strong">
                          [{ev.kind}]
                        </span>{" "}
                        {ev.label}{" "}
                        <span className="text-muted">— {ev.source}</span>
                      </li>
                    ))}
                  </ul>
                  </div>
                </div>

                <div className="rounded-xl border border-stone-300/60 bg-gradient-to-b from-[#ebe8e4] to-[#ddd9d3] p-1 shadow-sm">
                  <div className="inner-well rounded-lg p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                      Summary & guide
                    </h3>
                    <button
                      type="button"
                      disabled={enrichLoading}
                      onClick={() => void refineWithAi()}
                      className="h-9 rounded-full border border-stone-400/50 bg-gradient-to-b from-white to-stone-100 px-3 text-[15px] font-medium text-ink shadow-[0_4px_14px_-4px_rgba(71,85,105,0.12)] transition-colors hover:bg-stone-50 disabled:opacity-50"
                    >
                      {enrichLoading ? "Refining…" : "Refine copy"}
                    </button>
                  </div>
                  <p className="mt-2 text-[17.5px] leading-relaxed text-body">
                    {enrich?.summary ?? selected.templateSummary}
                  </p>
                  {enrich ? (
                    <p className="mt-2 text-[15px] text-muted">
                      Source:{" "}
                      {enrich.source === "openrouter"
                        ? "OpenRouter"
                        : "Template"}
                    </p>
                  ) : null}
                  </div>
                </div>

                <div>
                  <h3 className="text-[12.5px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Adoption guide
                  </h3>
                  <pre className="inner-well mt-2 whitespace-pre-wrap rounded-lg p-3 text-[16.25px] leading-relaxed text-body">
                    {enrich?.guide ?? selected.templateGuide}
                  </pre>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}

function ScoreChip({ label, value }: { label: string; value: number }) {
  return (
    <span className="chip-trust inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.25px] font-semibold uppercase tracking-[0.1em] text-ink">
      {label}{" "}
      <span className="font-semibold tabular-nums">{value}</span>
    </span>
  );
}
