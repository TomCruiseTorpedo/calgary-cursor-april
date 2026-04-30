import { getAggregateFeedItems } from "@/lib/funnel/aggregate-feed";

export async function GET() {
  const { items, source } = await getAggregateFeedItems();
  return Response.json({ items, source });
}
