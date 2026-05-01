import type { DevPersona, FunnelScore, FunnelSubscores, ToolCandidate } from "./types";
import { DEV_PERSONAS } from "./types";

const VALID_PERSONA = new Set<string>(DEV_PERSONAS);

/** Weighted rubric (sums to 1) — transparent on purpose */
const W = {
  recency: 0.2,
  adoption: 0.25,
  convergence: 0.2,
  maintainer: 0.15,
  fit: 0.2,
} as const;

const PERSONA_KEYWORDS: Record<Exclude<DevPersona, "fullstack">, string[]> = {
  frontend: [
    "react",
    "vue",
    "svelte",
    "css",
    "ui",
    "tsx",
    "typescript",
    "browser",
    "tailwind",
    "next",
    "wasm",
    "component",
  ],
  backend: [
    "api",
    "database",
    "postgres",
    "rust",
    "go",
    "node",
    "python",
    "graphql",
    "server",
    "sql",
    "redis",
    "dotnet",
  ],
  mobile: [
    "ios",
    "android",
    "swift",
    "kotlin",
    "react-native",
    "flutter",
    "mobile",
    "expo",
    "dart",
  ],
  devops: [
    "docker",
    "kubernetes",
    "ci",
    "cd",
    "terraform",
    "ansible",
    "pipeline",
    "deploy",
    "helm",
    "gitops",
  ],
  cloud: [
    "aws",
    "gcp",
    "azure",
    "lambda",
    "serverless",
    "s3",
    "cloudflare",
    "k8s",
    "eks",
  ],
  security: [
    "security",
    "auth",
    "oauth",
    "vault",
    "secrets",
    "appsec",
    "owasp",
    "encryption",
    "compliance",
    "sso",
  ],
  qa_test: [
    "test",
    "qa",
    "e2e",
    "playwright",
    "cypress",
    "jest",
    "pytest",
    "selenium",
    "quality",
    "coverage",
  ],
  data_ml: [
    "python",
    "pytorch",
    "tensorflow",
    "ml",
    "data",
    "notebook",
    "pandas",
    "gpu",
    "training",
    "inference",
    "cuda",
  ],
  product: [
    "roadmap",
    "analytics",
    "docs",
    "collaboration",
    "feedback",
    "workflow",
    "productivity",
    "planning",
    "spec",
    "stakeholder",
  ],
  design_ux: [
    "figma",
    "design",
    "ux",
    "prototype",
    "accessibility",
    "research",
    "ui",
    "css",
    "component",
    "tailwind",
  ],
};

const ALL_KEYWORDS = new Set<string>(
  Object.values(PERSONA_KEYWORDS).flatMap((k) => k),
);

function normalizePersona(p: string): DevPersona {
  const lower = p.toLowerCase().trim().replace(/-/g, "_");
  if (lower === "data-ml" || lower === "dataml") return "data_ml";
  if (lower === "qa" || lower === "quality") return "qa_test";
  if (lower === "pm" || lower === "product_manager") return "product";
  if (lower === "ux" || lower === "design") return "design_ux";
  if (VALID_PERSONA.has(lower)) return lower as DevPersona;
  return "fullstack";
}

export function parsePersona(raw: string | null | undefined): DevPersona {
  if (!raw) return "fullstack";
  return normalizePersona(raw);
}

/** 0–100: fresher activity scores higher */
function scoreRecency(lastActivityDays: number): number {
  const clamped = Math.min(Math.max(lastActivityDays, 0), 730);
  return Math.round(100 - (clamped / 730) * 100);
}

/** 0–100: log-scaled stars + forks */
function scoreAdoption(stars: number, forks: number): number {
  const raw = Math.log1p(stars) * 18 + Math.log1p(forks) * 10;
  return Math.min(100, Math.round(raw));
}

/** 0–100: convergence from mentions × evidence weights */
function scoreConvergence(
  mentionCount: number,
  evidenceWeightSum: number,
): number {
  const mentionPart = Math.min(60, mentionCount * 12);
  const evidencePart = Math.min(40, evidenceWeightSum * 40);
  return Math.min(100, Math.round(mentionPart + evidencePart));
}

function scoreFit(tags: string[], persona: DevPersona): number {
  const lowered = tags.map((t) => t.toLowerCase());

  if (persona === "fullstack") {
    let hits = 0;
    for (const t of lowered) {
      if (ALL_KEYWORDS.has(t)) hits += 1;
    }
    return Math.min(100, 45 + hits * 11);
  }

  const keywords = PERSONA_KEYWORDS[persona];
  let matches = 0;
  for (const t of lowered) {
    if (keywords.includes(t)) matches += 1;
  }
  const fuzzy = lowered.some((t) =>
    keywords.some((k) => t.includes(k) || k.includes(t)),
  );
  if (matches >= 2) return Math.min(100, 55 + matches * 15);
  if (matches === 1) return 72;
  if (fuzzy) return 52;
  return 28;
}

export function scoreCandidate(
  c: ToolCandidate,
  persona: DevPersona,
): FunnelScore {
  const evidenceWeightSum = c.evidence.reduce((s, e) => s + e.weight, 0);

  const subscores: FunnelSubscores = {
    recency: scoreRecency(c.lastActivityDays),
    adoption: scoreAdoption(c.stars, c.forks),
    convergence: scoreConvergence(c.mentionCount, evidenceWeightSum),
    maintainer: Math.round(c.maintainerHealth * 100),
    fit: scoreFit(c.tags, persona),
  };

  const total = Math.round(
    subscores.recency * W.recency +
      subscores.adoption * W.adoption +
      subscores.convergence * W.convergence +
      subscores.maintainer * W.maintainer +
      subscores.fit * W.fit,
  );

  return { total, subscores };
}

export function buildTemplateSummary(
  c: ToolCandidate,
  sub: FunnelSubscores,
): string {
  return `${c.name} — ${c.tagline} Lens fit ${sub.fit}/100; adoption ${sub.adoption}/100; signals converge at ${sub.convergence}/100.`;
}

export function buildTemplateGuide(c: ToolCandidate): string {
  const primary = c.repoUrl ?? c.url;
  return [
    `1. **Verify** — Open ${primary} and confirm last release/commit matches your risk tolerance.`,
    `2. **Minimum repro** — Follow the official quickstart (single path, no extras).`,
    `3. **Integrate** — Wire one workflow behind a feature flag or branch.`,
    `4. **Watch** — Track breaking changes, quotas, and licensing for your team.`,
  ].join("\n");
}
