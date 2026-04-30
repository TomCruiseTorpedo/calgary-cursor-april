import type { AggregateFeedItem } from "./types";

/**
 * Curated “digest” items when live RSS is off — demonstrates the aggregate panel
 * without network. Titles are representative, not live fetches.
 */
export function getMockAggregateFeed(): AggregateFeedItem[] {
  const mk = (
    id: string,
    title: string,
    url: string,
    sourceLabel: string,
    publishedAt?: string,
  ): AggregateFeedItem => ({ id, title, url, sourceLabel, publishedAt });

  return [
    mk(
      "m1",
      "Vercel AI SDK 4: streaming and tool-calling patterns for React",
      "https://vercel.com/blog",
      "Curated digest",
    ),
    mk(
      "m2",
      "OpenAI API: structured outputs and new model routing notes",
      "https://openai.com/blog",
      "Curated digest",
    ),
    mk(
      "m3",
      "Hugging Face: smaller models, evals, and the Hub in 2026",
      "https://huggingface.co/blog",
      "Curated digest",
    ),
    mk(
      "m4",
      "Google AI: Gemma updates and on-device vs cloud tradeoffs",
      "https://blog.google/technology/ai/",
      "Curated digest",
    ),
    mk(
      "m5",
      "GitHub: supply chain, Copilot, and org security for gen-AI code",
      "https://github.blog",
      "Curated digest",
    ),
    mk(
      "m6",
      "Why teams standardize on LiteLLM for multi-provider routing",
      "https://github.com/BerriAI/litellm",
      "Curated digest",
    ),
    mk(
      "m7",
      "Agent patterns: when to use durable workflows (Temporal) vs scripts",
      "https://temporal.io/blog",
      "Curated digest",
    ),
    mk(
      "m8",
      "Local LLMs: Ollama, quant quality, and laptop-only dev loops",
      "https://ollama.com/blog",
      "Curated digest",
    ),
  ];
}
