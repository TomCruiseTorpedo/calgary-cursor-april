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

const cardShadow = "shadow-[0_4px_16px_rgba(0,0,0,0.04)]";

const TOP_LIMIT = "7";

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
    <div className="relative flex min-h-0 flex-1 flex-col bg-canvas">
      <AtmosphereOrbs />
      <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-1 flex-col gap-10 px-4 py-10 md:px-8 md:py-16">
        <header className="space-y-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            Signal river · ranked funnel · optional OpenRouter refinement
          </p>
          <div className="space-y-3">
            <WaveformStrip />
            <h1 className="font-display text-3xl font-light leading-[1.1] tracking-[-0.04em] text-ink sm:text-4xl md:text-[2.75rem]">
              Cut AI-tool noise for your dev workflow
            </h1>
          </div>
          <p className="max-w-2xl text-[15px] leading-relaxed tracking-[0.01em] text-body">
            We merge an <strong className="font-medium text-body-strong">aggregate feed</strong> of
            public sources (RSS, HN Algolia, GitHub Atom when enabled; otherwise a curated digest) and run a
            transparent <strong className="font-medium text-body-strong">sifter</strong> on a
            catalog: role fit, recency, adoption, cross-source “buzz,” and maintainer health.
            Pick your profile, run the funnel, then open a tool for evidence + adoption steps.
          </p>
        </header>

        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <label className="flex flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            Your dev profile
            <select
              className="h-11 min-w-[min(100%,14rem)] max-w-full rounded-md border border-hairline-strong bg-surface-card px-4 text-[15px] font-medium text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
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
          <label className="min-w-[12rem] flex flex-1 flex-col gap-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
            Filter catalog
            <input
              className="h-11 rounded-md border border-hairline-strong bg-surface-card px-4 text-[15px] text-ink placeholder:text-muted-soft focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              placeholder="Name, tagline, or tag…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void loadFunnel()}
            />
          </label>
          <button
            type="button"
            className="h-10 rounded-full bg-primary px-5 text-[15px] font-medium text-on-primary transition-colors hover:bg-primary-active disabled:opacity-60"
            disabled={loading}
            onClick={() => void loadFunnel()}
          >
            {loading ? "Running funnel…" : "Run funnel"}
          </button>
        </div>

        {error ? (
          <p className="rounded-xl border border-semantic-error/25 bg-surface-card px-4 py-3 text-sm text-semantic-error">
            {error}
          </p>
        ) : null}

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
          <div className="flex min-w-0 flex-col gap-8">
            <section
              className={`rounded-xl border border-hairline bg-surface-card p-6 ${cardShadow}`}
            >
              <h2 className="font-display text-xl font-light tracking-[-0.02em] text-ink">
                How we interpret your profile: {personaLabel[persona]}
              </h2>
              <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.1em] text-muted">
                {ctx.headline}
              </p>
              <p className="mt-3 text-[15px] leading-relaxed text-body">{ctx.lens}</p>
            </section>

            <section className="rounded-xl border border-hairline bg-surface-card p-6 shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-xl font-light tracking-[-0.02em] text-ink">
                  Signal river
                </h2>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-muted">
                    {feedSourceLabel(feedMeta.source, rssIngest)}
                  </span>
                  <button
                    type="button"
                    onClick={() => void refreshFeed()}
                    disabled={feedRefreshing}
                    className="h-8 rounded-full border border-hairline-strong px-3 text-[12px] font-medium text-ink hover:bg-surface-strong disabled:opacity-50"
                  >
                    {feedRefreshing ? "Refreshing…" : "Refresh"}
                  </button>
                </div>
              </div>
              <p className="mt-2 text-[14px] leading-relaxed text-muted">
                Headlines from configured RSS when <code className="text-[13px]">ENABLE_RSS_INGEST=true</code>; otherwise a static digest so the UI always shows where narratives come from.
              </p>
              <ul className="mt-4 max-h-72 space-y-3 overflow-y-auto border-t border-hairline-soft pt-4">
                {feedItems.map((it) => (
                  <li key={it.id}>
                    <a
                      href={it.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[15px] font-medium leading-snug text-body-strong underline decoration-hairline-strong underline-offset-2 hover:text-ink"
                    >
                      {it.title}
                    </a>
                    <p className="mt-0.5 text-[12px] text-muted">
                      {it.sourceLabel}
                      {it.publishedAt
                        ? ` · ${new Date(it.publishedAt).toLocaleDateString()}`
                        : ""}
                    </p>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <h2 className="font-display text-xl font-light tracking-[-0.02em] text-ink">
                Top picks for {personaLabel[persona]} (max {TOP_LIMIT})
              </h2>
              <p className="mt-1 text-[14px] text-muted">
                Ranked for your selected profile. “Why this” is generated from the same subscores you see—no black box.
              </p>
              <ul className="mt-4 flex flex-col gap-3">
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
                        className={`w-full rounded-xl border bg-surface-card p-5 text-left transition-all ${cardShadow} ${
                          active
                            ? "border-primary ring-2 ring-primary/10"
                            : "border-hairline hover:border-hairline-strong"
                        }`}
                      >
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="font-display text-xl font-light tracking-[-0.02em] text-ink">
                            {row.candidate.name}
                          </span>
                          <span className="text-[15px] font-medium tabular-nums text-body-strong">
                            {row.score.total}
                          </span>
                        </div>
                        <p className="mt-2 text-[15px] leading-relaxed text-body">
                          {row.candidate.tagline}
                        </p>
                        <p className="mt-3 text-[14px] leading-relaxed text-body">
                          {why}
                        </p>
                        <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">
                          Score breakdown
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
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
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>

          <aside className="min-h-[200px] lg:sticky lg:top-8 lg:self-start">
            {!selected ? (
              <div className="rounded-xl border border-dashed border-hairline-strong bg-canvas-soft p-6 text-[15px] leading-relaxed text-muted">
                Select a tool from <strong className="font-medium text-body-strong">Top picks</strong>{" "}
                to see merged evidence, links, and an adoption path. Use{" "}
                <strong className="font-medium text-body-strong">Refine copy</strong> if{" "}
                <code className="text-[13px]">OPENROUTER_API_KEY</code> is set.
              </div>
            ) : (
              <div className="space-y-6">
                <div
                  className={`rounded-xl border border-hairline bg-surface-card p-6 ${cardShadow}`}
                >
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Selection
                  </p>
                  <h3 className="mt-2 font-display text-2xl font-light tracking-[-0.02em] text-ink">
                    {selected.candidate.name}
                  </h3>
                  <a
                    href={selected.candidate.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-block break-all text-[15px] text-body underline decoration-hairline-strong underline-offset-[3px] transition-colors hover:text-ink"
                  >
                    {selected.candidate.url}
                  </a>
                  {selected.candidate.repoUrl ? (
                    <p className="mt-2">
                      <a
                        href={selected.candidate.repoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[15px] text-body underline decoration-hairline-strong underline-offset-[3px] hover:text-ink"
                      >
                        Repository
                      </a>
                    </p>
                  ) : null}
                </div>

                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Evidence (mock + optional RSS)
                  </h3>
                  <ul className="mt-3 space-y-2 text-[15px] leading-relaxed text-body">
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

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                      Summary & guide
                    </h3>
                    <button
                      type="button"
                      disabled={enrichLoading}
                      onClick={() => void refineWithAi()}
                      className="h-9 rounded-full border border-hairline-strong bg-transparent px-4 text-[13px] font-medium text-ink transition-colors hover:bg-surface-strong disabled:opacity-50"
                    >
                      {enrichLoading ? "Refining…" : "Refine copy (OpenRouter)"}
                    </button>
                  </div>
                  <p className="mt-3 text-[15px] leading-relaxed text-body">
                    {enrich?.summary ?? selected.templateSummary}
                  </p>
                  {enrich ? (
                    <p className="mt-2 text-[13px] text-muted">
                      Source:{" "}
                      {enrich.source === "openrouter"
                        ? "OpenRouter"
                        : "Template"}
                    </p>
                  ) : null}
                </div>

                <div>
                  <h3 className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">
                    Adoption guide
                  </h3>
                  <pre className="mt-3 whitespace-pre-wrap rounded-xl border border-hairline bg-canvas-soft p-4 text-[14px] leading-relaxed text-body">
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
    <span className="inline-flex items-center gap-1 rounded-full bg-surface-strong px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-ink">
      {label}{" "}
      <span className="font-semibold tabular-nums">{value}</span>
    </span>
  );
}
