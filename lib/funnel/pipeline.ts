import type { ScoredTool, ToolCandidate } from "./types";
import {
  buildTemplateGuide,
  buildTemplateSummary,
  parsePersona,
  scoreCandidate,
} from "./scoring";
import { getCandidates } from "./providers";

const DEFAULT_LIMIT = 10;

function dedupeById(candidates: ToolCandidate[]): ToolCandidate[] {
  const map = new Map<string, ToolCandidate>();
  for (const c of candidates) {
    if (!map.has(c.id)) map.set(c.id, c);
  }
  return [...map.values()];
}

function matchesQuery(c: ToolCandidate, q: string): boolean {
  if (!q.trim()) return true;
  const s = q.toLowerCase();
  return (
    c.name.toLowerCase().includes(s) ||
    c.tagline.toLowerCase().includes(s) ||
    c.tags.some((t) => t.toLowerCase().includes(s))
  );
}

export interface RunFunnelOptions {
  persona: string;
  query?: string;
  limit?: number;
}

export async function runFunnel(
  options: RunFunnelOptions,
): Promise<ScoredTool[]> {
  const persona = parsePersona(options.persona);
  const q = options.query ?? "";
  const limit = Math.min(50, Math.max(1, options.limit ?? DEFAULT_LIMIT));

  const raw = await getCandidates();
  const unique = dedupeById(raw);
  const filtered = unique.filter((c) => matchesQuery(c, q));

  const scored: ScoredTool[] = filtered.map((candidate) => {
    const score = scoreCandidate(candidate, persona);
    return {
      candidate,
      score,
      templateSummary: buildTemplateSummary(candidate, score.subscores),
      templateGuide: buildTemplateGuide(candidate),
    };
  });

  scored.sort((a, b) => b.score.total - a.score.total);
  return scored.slice(0, limit);
}

export async function getScoredById(
  id: string,
  personaRaw: string,
): Promise<ScoredTool | null> {
  const persona = parsePersona(personaRaw);
  const all = await getCandidates();
  const c = all.find((x) => x.id === id);
  if (!c) return null;
  const score = scoreCandidate(c, persona);
  return {
    candidate: c,
    score,
    templateSummary: buildTemplateSummary(c, score.subscores),
    templateGuide: buildTemplateGuide(c),
  };
}
