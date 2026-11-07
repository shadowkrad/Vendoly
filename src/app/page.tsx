import { getTenantConfig } from "@/lib/taaaac-core";
import { getStoreProducts } from "@/lib/store-actions";
import { caricaVetrinaUnificata } from "@/lib/anagrafica-attivita";
import Storefront from "@/components/Storefront";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const tenantConfig = await getTenantConfig();
  const products = await getStoreProducts();
  const { showcase: showcaseConfig } = await caricaVetrinaUnificata();

  return (
    <Storefront
      initialProducts={products}
      tenantConfig={tenantConfig}
      initialShowcaseConfig={showcaseConfig}
    />
  );
}
