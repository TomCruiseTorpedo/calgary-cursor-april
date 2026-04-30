import { enrichToolContent } from "@/lib/funnel/llm/openrouter";
import { getScoredById } from "@/lib/funnel/pipeline";

export async function POST(request: Request) {
  let body: { id?: string; persona?: string };
  try {
    body = (await request.json()) as { id?: string; persona?: string };
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const id = body.id;
  if (!id || typeof id !== "string") {
    return Response.json({ error: "Missing id" }, { status: 400 });
  }

  const persona = body.persona ?? "fullstack";
  const scored = await getScoredById(id, persona);
  if (!scored) {
    return Response.json({ error: "Tool not found" }, { status: 404 });
  }

  const result = await enrichToolContent({
    persona,
    candidate: scored.candidate,
    subscores: scored.score.subscores,
    evidence: scored.candidate.evidence,
    templateSummary: scored.templateSummary,
    templateGuide: scored.templateGuide,
  });

  return Response.json(result);
}
