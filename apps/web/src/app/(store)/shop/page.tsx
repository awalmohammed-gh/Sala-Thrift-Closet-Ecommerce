import type { Metadata } from "next";
import { Suspense } from "react";
import { WhatsAppCta } from "@/components/home/WhatsAppCta";
import { ShopListing, ShopListingSkeleton } from "@/components/products/ShopListing";
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
      <Suspense fallback={<ShopListingSkeleton />}>
        <ShopListing searchParams={searchParams} />
      </Suspense>
      <Suspense fallback={null}>
        <WhatsAppCta />
      </Suspense>
    </>
  );
}
