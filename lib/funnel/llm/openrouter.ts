import type { EvidenceSignal, FunnelSubscores, ToolCandidate } from "../types";
import { parsePersona } from "../scoring";

const OPENROUTER_BASE = "https://openrouter.ai/api/v1";

type ChatMessage = { role: "system" | "user"; content: string };

interface OpenRouterResponse {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
}

function getApiKey(): string | undefined {
  return process.env.OPENROUTER_API_KEY;
}

function getModel(): string {
  return (
    process.env.OPENROUTER_MODEL?.trim() ||
    "tencent/hy3-preview:free"
  );
}

async function completeJson(messages: ChatMessage[]): Promise<string> {
  const key = getApiKey();
  if (!key) throw new Error("OPENROUTER_API_KEY is not set");

  const appUrl = process.env.OPENROUTER_APP_URL || "http://localhost:3000";
  const title = "AI Dev Tools Funnel";

  const res = await fetch(`${OPENROUTER_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": appUrl,
      "X-Title": title,
    },
    body: JSON.stringify({
      model: getModel(),
      temperature: 0.3,
      max_tokens: 900,
      messages,
    }),
  });

  const data = (await res.json()) as OpenRouterResponse;
  if (!res.ok) {
    const msg = data.error?.message ?? res.statusText;
    throw new Error(`OpenRouter error: ${msg}`);
  }

  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("OpenRouter returned empty content");
  return text.trim();
}

const SYSTEM =
  "You are a careful engineering assistant. Only use the JSON facts provided. " +
  "Do not claim you browsed the web. If data is missing, say so. " +
  "Reply with valid JSON only, no markdown fence.";

export interface EnrichPayload {
  persona: string;
  candidate: ToolCandidate;
  subscores: FunnelSubscores;
  evidence: EvidenceSignal[];
  templateSummary: string;
  templateGuide: string;
}

export interface EnrichResult {
  summary: string;
  guide: string;
  source: "openrouter" | "template";
}

/**
 * Use OpenRouter to tighten summary + guide from structured pipeline output only.
 * Falls back to templates if the key is missing or the request fails.
 */
export async function enrichToolContent(
  payload: EnrichPayload,
): Promise<EnrichResult> {
  const persona = parsePersona(payload.persona);
  if (!getApiKey()) {
    return {
      summary: payload.templateSummary,
      guide: payload.templateGuide,
      source: "template",
    };
  }

  const factPack = {
    persona,
    tool: {
      id: payload.candidate.id,
      name: payload.candidate.name,
      tagline: payload.candidate.tagline,
      url: payload.candidate.url,
      repoUrl: payload.candidate.repoUrl ?? null,
      tags: payload.candidate.tags,
      lastActivityDays: payload.candidate.lastActivityDays,
      stars: payload.candidate.stars,
      forks: payload.candidate.forks,
      mentionCount: payload.candidate.mentionCount,
      maintainerHealth: payload.candidate.maintainerHealth,
    },
    subscores: payload.subscores,
    evidence: payload.evidence.map((e) => ({
      kind: e.kind,
      label: e.label,
      source: e.source,
      weight: e.weight,
    })),
  };

  const user = [
    "Given these facts, produce a JSON object with keys:",
    'summary: string (2-4 sentences, why this tool might be worth trying for this persona)',
    'guide: string (numbered markdown steps: verify, minimal hello-world, integrate, pitfalls)',
    "",
    "Facts:",
    JSON.stringify(factPack),
  ].join("\n");

  try {
    const raw = await completeJson([
      { role: "system", content: SYSTEM },
      { role: "user", content: user },
    ]);

    const parsed = parseLooseJson(raw);
    const summary =
      typeof parsed.summary === "string" && parsed.summary.trim().length > 0
        ? parsed.summary.trim()
        : payload.templateSummary;
    const guide =
      typeof parsed.guide === "string" && parsed.guide.trim().length > 0
        ? parsed.guide.trim()
        : payload.templateGuide;
    return { summary, guide, source: "openrouter" };
  } catch {
    return {
      summary: payload.templateSummary,
      guide: payload.templateGuide,
      source: "template",
    };
  }
}

/** Accept JSON optionally wrapped in fences or with leading chatter */
function parseLooseJson(text: string): Record<string, unknown> {
  let t = text.trim();
  if (t.startsWith("```")) {
    const withoutOpen = t.replace(/^```(?:json)?\s*/i, "");
    const lastFence = withoutOpen.lastIndexOf("```");
    t =
      lastFence >= 0
        ? withoutOpen.slice(0, lastFence).trim()
        : withoutOpen.trim();
  }
  try {
    return JSON.parse(t) as Record<string, unknown>;
  } catch {
    const start = t.indexOf("{");
    const end = t.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(t.slice(start, end + 1)) as Record<string, unknown>;
    }
    throw new Error("No JSON object found");
  }
}
