import type { Metadata } from "next";
import { Suspense } from "react";
import { WhatsAppCta } from "@/components/home/WhatsAppCta";
import { ProductGridSkeleton } from "@/components/products/ProductGrid";
import { ProductListing } from "@/components/products/ProductListing";
import { getMetadataSettings } from "@/lib/catalog";

export async function generateMetadata({ searchParams }: PageProps<"/shop">): Promise<Metadata> {
  const { q } = await searchParams;
  const { storeName } = await getMetadataSettings();

  const title = q ? `Search results for "${q}"` : "All Products — Shop Online in Ghana";
  const description = q
    ? `Explore search results for "${q}" at ${storeName}. Order on WhatsApp for fast delivery across Ghana.`
    : `Browse thrift tops, shirts, jeans, shorts, hoodies and jackets at ${storeName}. Order easily on WhatsApp with fast delivery in Ghana.`;

  return {
    title,
    description,
    alternates: { canonical: "/shop" },
    openGraph: {
      type: "website",
      locale: "en_GH",
      siteName: storeName,
      title: `${title} | ${storeName}`,
      description,
      url: "/shop",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | ${storeName}`,
      description,
    },
  };
}

export default function ShopPage({ searchParams }: PageProps<"/shop">) {
  return (
    <>
      <div className="container-page pt-5 sm:pt-8">
        <Suspense
          fallback={
            <div className="space-y-4 sm:space-y-5" aria-hidden="true">
              <div className="skeleton h-8 w-40" />
              <div className="flex gap-2 overflow-hidden">
                {Array.from({ length: 5 }, (_, i) => (
                  <div key={i} className="skeleton h-11 w-28 shrink-0 rounded-full" />
                ))}
              </div>
              <div className="skeleton h-10 rounded-full" />
              <ProductGridSkeleton />
            </div>
          }
        >
          <ProductListing searchParams={searchParams} />
        </Suspense>
      </div>
      <div className="pt-4">
        <Suspense fallback={null}>
          <WhatsAppCta />
        </Suspense>
      </div>
    </>
  );
}
