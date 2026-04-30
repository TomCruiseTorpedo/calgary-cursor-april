import { getAggregateFeedItems } from "@/lib/funnel/aggregate-feed";
import { runFunnel } from "@/lib/funnel/pipeline";
import { FunnelApp } from "@/components/FunnelApp";

/** RSS / aggregate feed can hit the network */
export const dynamic = "force-dynamic";

const TOP_PICKS = 7;

export default async function Home() {
  const rssIngest = process.env.ENABLE_RSS_INGEST === "true";
  const [feed, initialItems] = await Promise.all([
    getAggregateFeedItems(),
    runFunnel({
      persona: "fullstack",
      query: "",
      limit: TOP_PICKS,
    }),
  ]);

  return (
    <FunnelApp
      initialItems={initialItems}
      rssIngest={rssIngest}
      initialFeedItems={feed.items}
      feedSource={feed.source}
    />
  );
}
