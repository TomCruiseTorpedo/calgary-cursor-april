import type { DevPersona } from "./types";

/** Plain-language context so the funnel feels tied to a dev profile, not a random list */
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
  devops: {
    headline: "Shipping, CI/CD, and platforms",
    lens: "Prioritizes CI, containers, IaC, release automation, and operational tooling. Scores reward maintainer health and cross-talk in ops communities (including RSS hits when enabled).",
  },
  cloud: {
    headline: "Managed infra and cloud primitives",
    lens: "Emphasizes hosted runtimes, serverless, object stores, K8s-as-a-service, and vendor SDKs. Fit tracks cloud-shaped tags so picks align with how you deploy.",
  },
  fullstack: {
    headline: "End-to-end product delivery",
    lens: "Balances breadth: anything that touches both client and server workflows gets a bump. Use this when you wear multiple hats; switch to a narrower persona when you want stricter filtering.",
  },
};
