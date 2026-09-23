import React from "react";
import { getChannelStats, getAllChannelListings } from "@/lib/store-actions";
import ChannelsHubClient from "@/components/dashboard/ChannelsHubClient";

export const dynamic = "force-dynamic";

export default async function CanaliMarketplacePage() {
  const statsRes = await getChannelStats();
  const listings = await getAllChannelListings();

  return (
    <ChannelsHubClient
      initialStats={statsRes.stats as any}
      initialListings={listings as any}
    />
  );
}
