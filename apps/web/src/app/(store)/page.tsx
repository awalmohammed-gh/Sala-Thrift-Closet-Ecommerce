import type { Metadata } from "next";
import { Suspense } from "react";
import { Categories, CategoriesSkeleton } from "@/components/home/Categories";
import { FeaturedProducts, NewArrivals, SectionSkeleton } from "@/components/home/FeaturedProducts";
import { MarketHero, MarketHeroSkeleton } from "@/components/home/Hero";
import { HomeSearch } from "@/components/home/HomeSearch";
import { PromoBanners } from "@/components/home/PromoBanners";
import { WhatsAppCta } from "@/components/home/WhatsAppCta";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/config/site";
import { getSettings } from "@/lib/catalog";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

/** Reads settings behind its own Suspense boundary, so the page shell never waits for them. */
async function StoreSchema() {
  const settings = await getSettings();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url;
  const storeName = settings.storeName || siteConfig.name;
  const description = settings.storeDescription || siteConfig.description;

  const socialLinks = Object.values(settings.socialLinks ?? {}).filter(Boolean);

  const localBusinessSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": ["OnlineStore", "LocalBusiness"],
    "@id": `${siteUrl}/#store`,
    name: storeName,
    description,
    url: siteUrl,
    ...(settings.logo ? { logo: settings.logo.url, image: settings.logo.url } : {}),
    telephone: settings.whatsappNumber || settings.supportPhone || undefined,
    currenciesAccepted: "GHS",
    priceRange: "₵₵",
    paymentAccepted: "Cash on Delivery, Mobile Money",
    address: {
      "@type": "PostalAddress",
      streetAddress: settings.address || "Accra, Ghana",
      addressLocality: "Accra",
      addressRegion: "Greater Accra",
      addressCountry: "GH",
    },
    ...(settings.openingHours ? { openingHours: settings.openingHours } : {}),
    ...(socialLinks.length ? { sameAs: socialLinks } : {}),
  };

  const webSiteSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${siteUrl}/#website`,
    name: storeName,
    url: siteUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}/shop?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return <JsonLd data={[localBusinessSchema, webSiteSchema]} />;
}

export default function HomePage() {
  return (
    <>
      <Suspense fallback={null}>
        <StoreSchema />
      </Suspense>

      {/* A market, not a brochure: the banner, the categories, then the products. */}
      <HomeSearch />
      <Suspense fallback={<MarketHeroSkeleton />}>
        <MarketHero />
      </Suspense>
      <Suspense fallback={<CategoriesSkeleton />}>
        <Categories />
      </Suspense>
      <Suspense fallback={<SectionSkeleton />}>
        <NewArrivals />
      </Suspense>
      <Suspense fallback={null}>
        <PromoBanners />
      </Suspense>
      <Suspense fallback={null}>
        <FeaturedProducts />
      </Suspense>
      <Suspense fallback={null}>
        <WhatsAppCta />
      </Suspense>
    </>
  );
}
