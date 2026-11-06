import { FiPackage } from "react-icons/fi";
import { StaggerContainer } from "@/components/animations/StaggerContainer";
import { ProductGrid, ProductGridSkeleton } from "@/components/products/ProductGrid";
import { EmptyState } from "@/components/ui/EmptyState";
import { getProducts, getSettings, type ProductQuery } from "@/lib/catalog";
import { SectionHeading } from "./SectionHeading";

interface ProductSectionProps {
  id: string;
  title: string;
  href: string;
  linkLabel?: string;
  query: ProductQuery;
  /** Hide the section entirely when nothing matches (e.g. no featured items yet). */
  hideWhenEmpty?: boolean;
  /** Images to load straight away because they are on screen when the page opens. */
  priorityCount?: number;
}

async function ProductSection({ id, title, href, linkLabel, query, hideWhenEmpty = false, priorityCount }: ProductSectionProps) {
  const result = await getProducts(query);
  if (result && result.items.length === 0 && hideWhenEmpty) return null;

  return (
    <section className="container-page pt-8 sm:pt-10" aria-labelledby={id}>
      <SectionHeading id={id} title={title} href={result?.items.length ? href : undefined} linkLabel={linkLabel} />
      {result === null ? (
        <p className="rounded-2xl border border-line bg-white p-6 text-sm text-muted">Products couldn&apos;t be loaded right now. Please refresh in a moment.</p>
      ) : (
        <StaggerContainer items=":scope > ul > li">
          <ProductGrid
            products={result.items}
            priorityCount={priorityCount}
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
    </section>
  );
}

/** Hidden when switched off in Admin → Settings → Storefront. */
export async function NewArrivals() {
  const { storefront } = await getSettings();
  if (!storefront.showNewArrivals) return null;
  return <ProductSection id="new-heading" title="Just In" href="/shop?sort=newest" linkLabel="View all products" query={{ sort: "newest", limit: 12 }} priorityCount={6} />;
}

/** Hidden when switched off in Admin → Settings → Storefront, or when nothing is featured. */
export async function FeaturedProducts() {
  const { storefront } = await getSettings();
  if (!storefront.showFeaturedProducts) return null;
  return <ProductSection id="featured-heading" title="Top picks" href="/shop" query={{ featured: true, limit: 6 }} hideWhenEmpty />;
}

export function SectionSkeleton() {
  return (
    <div className="container-page pt-8 sm:pt-10" aria-hidden="true">
      <div className="skeleton mb-4 h-7 w-40" />
      <ProductGridSkeleton count={6} />
    </div>
  );
}
