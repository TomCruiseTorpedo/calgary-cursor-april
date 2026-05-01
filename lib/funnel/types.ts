/** Stack / role lens for fit scoring and copy */
export type DevPersona =
  | "frontend"
  | "backend"
  | "mobile"
  | "devops"
  | "cloud"
  | "security"
  | "qa_test"
  | "data_ml"
  | "product"
  | "design_ux"
  | "fullstack";

/** Flat list (API + validation); UI groups below */
export const DEV_PERSONAS: DevPersona[] = [
  "frontend",
  "backend",
  "mobile",
  "devops",
  "cloud",
  "security",
  "qa_test",
  "data_ml",
  "product",
  "design_ux",
  "fullstack",
];

/** Optgroup-friendly clusters for the profile picker */
export const DEV_PERSONA_GROUPS: { label: string; personas: DevPersona[] }[] = [
  {
    label: "Engineering",
    personas: [
      "frontend",
      "backend",
      "mobile",
      "devops",
      "cloud",
      "security",
      "qa_test",
      "data_ml",
    ],
  },
  {
    label: "Product & design",
    personas: ["product", "design_ux"],
  },
  {
    label: "Generalist",
    personas: ["fullstack"],
  },
];

export type EvidenceKind =
  | "repo"
  | "article"
  | "social"
  | "package"
  | "press"
  | "news"
  | "community"
  | "vendor_blog";

export interface EvidenceSignal {
  kind: EvidenceKind;
  label: string;
  source: string;
  /** How strong this signal is for convergence (0–1) */
  weight: number;
}

/** Raw ingest row before funnel scoring */
export interface ToolCandidate {
  id: string;
  name: string;
  tagline: string;
  url: string;
  repoUrl?: string;
  tags: string[];
  /** Days since last meaningful activity */
  lastActivityDays: number;
  stars: number;
  forks: number;
  /** Independent mentions (articles, lists, etc.) */
  mentionCount: number;
  /** Maintainer signal 0 = stale, 1 = healthy */
  maintainerHealth: number;
  evidence: EvidenceSignal[];
}

export interface FunnelSubscores {
  recency: number;
  adoption: number;
  convergence: number;
  maintainer: number;
  fit: number;
}

export interface FunnelScore {
  total: number;
  subscores: FunnelSubscores;
}

export interface ScoredTool {
  candidate: ToolCandidate;
  score: FunnelScore;
  templateSummary: string;
  templateGuide: string;
}

/** One row in the aggregate “signal” panel (blogs, news, communities) */
export interface AggregateFeedItem {
  id: string;
  title: string;
  url: string;
  sourceLabel: string;
  /** ISO date string when known */
  publishedAt?: string;
}

export type AggregateFeedSource = "live" | "curated" | "mixed";
