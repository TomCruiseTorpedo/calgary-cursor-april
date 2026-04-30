import type { DevPersona, ScoredTool } from "./types";
import { PERSONA_CONTEXT } from "./persona-copy";

/**
 * Short, human-readable reason this row surfaced for the selected persona.
 * Uses only scores already shown — no black-box claims.
 */
export function explainWhyForYou(persona: DevPersona, row: ScoredTool): string {
  const s = row.score.subscores;
  const parts: string[] = [];

  const lens = PERSONA_CONTEXT[persona].headline;

  if (s.fit >= 72) {
    parts.push(
      `Tags align well with your lens (${lens}) — fit ${s.fit}/100.`,
    );
  } else if (s.fit >= 45) {
    parts.push(
      `Partial overlap with your lens (${s.fit}/100 fit); sanity-check against your real stack.`,
    );
  } else {
    parts.push(
      `Lower lens fit (${s.fit}/100): surfaced because adoption/recency/convergence are strong — confirm it fits your day-to-day role.`,
    );
  }

  const signalBits: string[] = [];
  if (s.convergence >= 70) {
    signalBits.push("multiple evidence mentions");
  }
  if (s.adoption >= 75) {
    signalBits.push("strong adoption proxies (stars/forks where we have them)");
  }
  if (s.recency >= 75) {
    signalBits.push("recent activity in catalog data");
  }
  if (s.maintainer >= 80) {
    signalBits.push("solid maintainer signal in stub data");
  }

  if (signalBits.length > 0) {
    parts.push(`Signals: ${signalBits.join("; ")}.`);
  }

  parts.push(
    `Combined funnel score ${row.score.total}/100 (fit + recency + adoption + convergence + maintainer — see chips below).`,
  );

  return parts.join(" ");
}
