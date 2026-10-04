import React from "react";
import { getChannelStats, getAllChannelListings, getStoreProducts } from "@/lib/store-actions";
import { getKillSwitchLogs } from "@/lib/kill-switch";
import ChannelsHubClient from "@/components/dashboard/ChannelsHubClient";

export const dynamic = "force-dynamic";

export default async function CanaliMarketplacePage() {
  const [statsRes, listings, killSwitchLogs, products] = await Promise.all([
    getChannelStats(),
    getAllChannelListings(),
    getKillSwitchLogs(),
    getStoreProducts(),
  ]);

  return (
    <ChannelsHubClient
      initialStats={statsRes.stats as any}
      initialListings={listings as any}
      initialKillSwitchLogs={killSwitchLogs}
      products={products as any}
    />
  );
}
