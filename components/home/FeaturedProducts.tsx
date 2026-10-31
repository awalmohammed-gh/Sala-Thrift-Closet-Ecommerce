import { FiArrowRight, FiPackage } from "react-icons/fi";
import { StaggerContainer } from "@/components/animations/StaggerContainer";
import { ProductGrid, ProductGridSkeleton } from "@/components/products/ProductGrid";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getProducts, getSettings, type ProductQuery } from "@/lib/catalog";
import { SectionHeading } from "./SectionHeading";

interface ProductSectionProps {
  id: string;
  eyebrow: string;
  title: string;
  description?: string;
  href: string;
  query: ProductQuery;
  /** Hide the section entirely when nothing matches (e.g. no featured items yet). */
  hideWhenEmpty?: boolean;
  tone?: "plain" | "tinted";
  /** Images to load eagerly (the grid is above the fold). */
  priorityCount?: number;
  /** Adds a full-width "see more" button under the grid. */
  moreLabel?: string;
}

async function ProductSection({ id, eyebrow, title, description, href, query, hideWhenEmpty = false, tone = "plain", priorityCount, moreLabel }: ProductSectionProps) {
  const result = await getProducts(query);
  if (result && result.items.length === 0 && hideWhenEmpty) return null;

  return (
    <section className={tone === "tinted" ? "border-y border-blue-100/60 bg-blue-50/50 py-8 sm:py-12" : "py-8 sm:py-12"} aria-labelledby={id}>
      <div className="container-page">
        <SectionHeading id={id} eyebrow={eyebrow} title={title} description={description} href={result?.items.length ? href : undefined} />
        {result === null ? (
          <p className="rounded-2xl border border-line bg-white p-6 text-sm text-muted">Products couldn&apos;t be loaded right now. Please refresh in a moment.</p>
        ) : (
          <StaggerContainer items=":scope > ul > li">
            <ProductGrid
              products={result.items}
              priorityCount={priorityCount}
              className="gap-y-4 sm:gap-y-5 xl:grid-cols-4"
              empty={
                <EmptyState
                  icon={<FiPackage />}
                  title="New stock is on the way"
                  description="We're adding products to the store. In the meantime, message us on WhatsApp and we'll help you find what you need."
                />
              }
            />
          </StaggerContainer>
        )}
        {moreLabel && !!result?.items.length && (
          <div className="mt-6 flex justify-center sm:mt-8">
            <ButtonLink href={href} size="lg" className="w-full rounded-full! sm:w-auto sm:px-10!" rightIcon={<FiArrowRight className="size-4" aria-hidden="true" />}>{moreLabel}</ButtonLink>
          </div>
        )}
      </div>
    </section>
  );
}

/** Hidden when switched off in Admin → Settings → Storefront. */
export async function FeaturedProducts() {
  const { storefront } = await getSettings();
  if (!storefront.showFeaturedProducts) return null;
  return (
    <ProductSection
      id="featured-heading"
      eyebrow="Closet favourites"
      title="Top picks"
      href="/shop"
      query={{ featured: true, limit: 8 }}
      hideWhenEmpty
      tone="tinted"
    />
  );
}

/** Hidden when switched off in Admin → Settings → Storefront. */
export async function NewArrivals() {
  const { storefront } = await getSettings();
  if (!storefront.showNewArrivals) return null;
  return <ProductSection id="new-heading" eyebrow="Just in" title="Fresh in the closet" href="/shop?sort=newest" query={{ sort: "newest", limit: 12 }} priorityCount={4} moreLabel="See all items" />;
}

export function SectionSkeleton() {
  return (
    <div className="container-page py-7 sm:py-10" aria-hidden="true">
      <div className="skeleton mb-8 h-8 w-56" />
      <ProductGridSkeleton count={4} />
    </div>
  );
}
