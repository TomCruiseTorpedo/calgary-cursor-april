import type { DevPersona } from "./types";

/** Plain-language context so the funnel feels tied to a profile, not a random list */
export const PERSONA_CONTEXT: Record<
  DevPersona,
  { headline: string; lens: string }
> = {
  frontend: {
    headline: "UI, browsers, and client-side delivery",
    lens: "We boost tools whose tags and evidence line up with shipping interfaces: components, TypeScript/React-style stacks, design systems, and in-IDE assist. A high “fit” score means the catalog tags overlap your frontend keywords—not hype alone.",
  },
  backend: {
    headline: "APIs, data, and services",
    lens: "We favour libraries and platforms you’d wire into servers and jobs: APIs, databases, queues, runtimes. Fit reflects keyword overlap with backend patterns so ranking matches how you actually build.",
  },
  mobile: {
    headline: "Native and cross-platform apps",
    lens: "Prioritizes mobile stacks—iOS, Android, React Native, Flutter, Expo—and tooling that fits ship cadence, store constraints, and on-device ML where relevant.",
  },
  devops: {
    headline: "Shipping, CI/CD, and platforms",
    lens: "Prioritizes CI, containers, IaC, release automation, and operational tooling. Scores reward maintainer health and cross-talk in ops communities (including RSS hits when enabled).",
  },
  cloud: {
    headline: "Managed infra and cloud primitives",
    lens: "Emphasizes hosted runtimes, serverless, object stores, K8s-as-a-service, and vendor SDKs. Fit tracks cloud-shaped tags so picks align with how you deploy.",
  },
  security: {
    headline: "AppSec, identity, and safe shipping",
    lens: "Weights auth flows, secrets handling, policy, supply-chain and AI-specific risks. Useful when you’re vetting agents and APIs for production boundaries.",
  },
  qa_test: {
    headline: "Quality, automation, and confidence",
    lens: "Favours test runners, E2E, contract checks, and AI-assisted QA—anything that raises signal before merge. Fit bumps tools tied to verification workflows.",
  },
  data_ml: {
    headline: "Data, ML, and inference paths",
    lens: "Targets notebooks, training/inference stacks, GPUs, pipelines, and HF-style ecosystems. Rankings prefer tags that match ML engineering over generic “AI product” fluff.",
  },
  product: {
    headline: "Product management and delivery rhythm",
    lens: "Surfaces tools for specs, roadmaps, discovery, analytics handoffs, and PM–eng collaboration—including AI assist for writing and synthesis (not just dev ergonomics).",
  },
  design_ux: {
    headline: "Design, research, and UX craft",
    lens: "Emphasizes prototyping, systems, accessibility, research synthesis, and design–dev handoff. AI tooling here should reduce rework, not only generate pixels.",
  },
  fullstack: {
    headline: "End-to-end product delivery",
    lens: "Balances breadth: anything that touches both client and server workflows gets a bump. Use this when you wear multiple hats; switch to a narrower persona when you want stricter filtering.",
  },
};
