import React from "react";
import { getStoreProducts } from "@/lib/store-actions";
import ProductsCatalogClient from "@/components/dashboard/ProductsCatalogClient";

export const dynamic = "force-dynamic";

export default async function ProdottiPage() {
  const products = await getStoreProducts();

  return <ProductsCatalogClient initialProducts={products} storeName="Vendoly Store" />;
}
