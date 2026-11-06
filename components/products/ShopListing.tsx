import Image from "next/image";
import Link from "next/link";
import { FaCrown } from "react-icons/fa6";
import { FiAlertCircle, FiArrowRight, FiGrid, FiList, FiSearch } from "react-icons/fi";
import { priceRange } from "@salasty-thrift-closet/shared";
import { RevealOnScroll } from "@/components/animations/RevealOnScroll";
import { RiseOnChange } from "@/components/animations/RiseOnChange";
import { ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCategories, getProducts } from "@/lib/catalog";
import { marketAisles } from "@/lib/productDisplay";
import { hasActiveFilters, parseShopFilters, priceCeiling, shopHref, type ShopParams } from "@/lib/shopFilters";
import { cn } from "@/lib/utils";
import { Pagination } from "./Pagination";
import { ProductGrid, ProductGridSkeleton } from "./ProductGrid";
import { ShopBanner } from "./ShopBanner";
import { ShopFilters, SortSelect } from "./ShopFilters";

const PAGE_SIZE = 12;
const LAYOUT = "container-page grid gap-4 pt-4 sm:pt-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-6";

/** Sits under the filters on desktop, where the column would otherwise end early. */
function StylePromo() {
  return (
    <RevealOnScroll className="mt-4 hidden lg:block">
    <Link href="/shop?sort=newest" className="group relative block h-72 overflow-hidden rounded-2xl bg-navy text-white">
      <Image src="/images/editorial/promo-street.webp" alt="" fill sizes="240px" className="object-cover object-[60%_15%] transition-[scale] duration-700 ease-out-soft group-hover:scale-105" />
      <span aria-hidden="true" className="absolute inset-0 bg-linear-to-r from-navy via-navy/75 to-transparent" />
      <span className="relative flex h-full flex-col justify-end p-4">
        <FaCrown className="mb-auto size-6 text-tag" aria-hidden="true" />
        <span className="font-display text-2xl font-bold leading-tight tracking-[-0.03em]">Level Up<br />Your Style</span>
        <span aria-hidden="true" className="my-2 h-0.5 w-16 bg-tag" />
        <span className="text-sm text-blue-50">Shop the best<br />outfits today.</span>
        <span className="mt-3 inline-flex min-h-9 w-fit items-center gap-1.5 rounded-full bg-tag px-4 text-sm font-bold text-brand-deep">Shop Now<FiArrowRight className="size-4" aria-hidden="true" /></span>
      </span>
    </Link>
    </RevealOnScroll>
  );
}

export async function ShopListing({ searchParams }: { searchParams: Promise<ShopParams> }) {
  const state = parseShopFilters(await searchParams);
  const [result, categories, dearest] = await Promise.all([
    getProducts({
      q: state.q || undefined,
      category: state.category || undefined,
      sort: state.sort,
      availability: state.availability,
      minPrice: state.min ? state.min * 100 : undefined,
      maxPrice: state.max ? state.max * 100 : undefined,
      page: state.page,
      limit: PAGE_SIZE,
    }),
    getCategories(),
    getProducts({ sort: "price-desc", limit: 1 }),
  ]);

  const aisles = marketAisles(categories);
  const filtered = hasActiveFilters(state);
  // Shoppers who searched or filtered want their results first, not a banner.
  const showBanner = !filtered && state.page === 1;
  const activeCategory = aisles.find((aisle) => aisle.slug === state.category)?.name;
  const heading = state.q ? `Results for “${state.q}”` : activeCategory ?? "All items";
  const top = dearest?.items[0];
  const firstShown = result?.total ? (result.page - 1) * PAGE_SIZE + 1 : 0;
  const lastShown = result ? Math.min(result.page * PAGE_SIZE, result.total) : 0;
  const viewLink = (active: boolean) => cn("flex size-9 items-center justify-center rounded-lg transition-colors", active ? "bg-brand-deep text-white" : "text-muted hover:text-brand");

  return (
    <>
      {showBanner && <ShopBanner />}
      <div id="products" className={cn(LAYOUT, "scroll-mt-20")}>
        <aside className="min-w-0" aria-label="Filters">
          <ShopFilters
            state={state}
            categories={aisles.map(({ name, slug, productCount }) => ({ name, slug, count: productCount ?? 0 }))}
            total={aisles.reduce((sum, aisle) => sum + (aisle.productCount ?? 0), 0)}
            ceiling={priceCeiling(top && priceRange(top).max)}
          />
          <StylePromo />
        </aside>

        <div className="min-w-0">
          {!showBanner && <h1 className="mb-2 truncate font-display text-2xl font-bold tracking-[-0.03em] text-brand-deep sm:text-3xl">{heading}</h1>}
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p aria-live="polite" className="text-sm text-ink">{result ? (result.total ? `Showing ${firstShown}–${lastShown} of ${result.total} product${result.total === 1 ? "" : "s"}` : "No products") : ""}</p>
            <div className="flex items-center gap-2">
              <div className="hidden items-center gap-0.5 rounded-xl border border-line bg-white p-0.5 sm:flex">
                <Link href={shopHref(state, { view: "grid", page: state.page })} scroll={false} aria-label="Grid view" aria-current={state.view === "grid" ? "true" : undefined} className={viewLink(state.view === "grid")}><FiGrid className="size-4" aria-hidden="true" /></Link>
                <Link href={shopHref(state, { view: "list", page: state.page })} scroll={false} aria-label="List view" aria-current={state.view === "list" ? "true" : undefined} className={viewLink(state.view === "list")}><FiList className="size-4" aria-hidden="true" /></Link>
              </div>
              <SortSelect state={state} />
            </div>
          </div>

          {result === null ? (
            <EmptyState icon={<FiAlertCircle />} title="We couldn't load products" description="The store is having trouble reaching our catalogue. Please refresh the page in a moment." />
          ) : (
            <>
              <RiseOnChange changeKey={shopHref(state, { page: state.page })}>
              <ProductGrid
                products={result.items}
                priorityCount={4}
                columns="shop"
                className="stagger-in"
                list={state.view === "list"}
                empty={
                  <EmptyState
                    icon={<FiSearch />}
                    title={filtered ? "No products match your filters" : "No products yet"}
                    description={filtered ? "Try a wider price range, another category, or include out-of-stock items." : "New stock is being added. Check back soon or message us on WhatsApp."}
                    action={filtered ? <ButtonLink href="/shop" variant="secondary">Clear filters</ButtonLink> : <ButtonLink href="/">Back to home</ButtonLink>}
                  />
                }
              />
              </RiseOnChange>
              <div className="mt-6"><Pagination page={result.page} totalPages={result.totalPages} hrefFor={(page) => shopHref(state, { page })} /></div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

export function ShopListingSkeleton() {
  return (
    <>
      <div className="skeleton h-52 rounded-none sm:h-64 lg:h-80" aria-hidden="true" />
      <div className={LAYOUT} aria-hidden="true">
        <div className="skeleton hidden h-96 rounded-2xl lg:block" />
        <div>
          <div className="skeleton mb-3 h-10 rounded-full" />
          <ProductGridSkeleton count={8} columns="shop" />
        </div>
      </div>
    </>
  );
}
