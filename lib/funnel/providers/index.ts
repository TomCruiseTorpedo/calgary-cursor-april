import type { ToolCandidate } from "../types";
import { augmentCandidatesFromRss } from "./rss";
import { getMockCandidates } from "./mock";

/**
 * Mock catalog plus optional RSS convergence signals ($0 HTTP + rss-parser).
 * RSS is opt-in only (`ENABLE_RSS_INGEST=true`) so demos stay fast and predictable.
 */
export async function getCandidates(): Promise<ToolCandidate[]> {
  let base: ToolCandidate[] = getMockCandidates();

  if (process.env.USE_MOCK_DATA === "false") {
    // Reserved for swapping in GitHub/RSS-only catalogs later.
    base = getMockCandidates();
  }

  if (process.env.ENABLE_RSS_INGEST === "true") {
    return augmentCandidatesFromRss(base);
  }

  return base;
}
