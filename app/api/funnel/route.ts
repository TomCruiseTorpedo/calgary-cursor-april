import { runFunnel } from "@/lib/funnel/pipeline";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const persona = searchParams.get("persona") ?? "fullstack";
  const q = searchParams.get("q") ?? "";
  const limitRaw = searchParams.get("limit");
  const limit = limitRaw ? Number(limitRaw) : 10;

  const items = await runFunnel({
    persona,
    query: q,
    limit: Number.isFinite(limit) ? limit : 10,
  });

  return Response.json({
    persona,
    query: q,
    limit: Number.isFinite(limit) ? limit : 10,
    items,
  });
}
