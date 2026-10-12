import { getTenantConfig } from "@/lib/taaaac-core";
import { getStoreProducts } from "@/lib/store-actions";
import { parseShowcaseConfig } from "@/lib/showcase-defaults";
import Storefront from "@/components/Storefront";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const tenantConfig = await getTenantConfig();
  const products = await getStoreProducts();
  const showcaseConfig = parseShowcaseConfig(tenantConfig.showcaseConfig);

  return (
    <Storefront
      initialProducts={products}
      tenantConfig={tenantConfig}
      initialShowcaseConfig={showcaseConfig}
    />
  );
}
