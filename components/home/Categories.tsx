import { CategoryChips } from "@/components/products/CategoryChips";
import { getCategories } from "@/lib/catalog";

/** Market aisles: one swipeable row of categories straight under the banner. */
export async function Categories() {
  const categories = (await getCategories())?.filter((category) => category.isActive) ?? [];
  if (!categories.some((category) => (category.productCount ?? 0) > 0)) return null;
  return (
    <section className="container-page pt-5" aria-label="Shop by category">
      <CategoryChips categories={categories} hrefFor={(slug) => (slug ? `/categories/${slug}` : "/shop")} scroll animated />
    </section>
  );
}

export function CategoriesSkeleton() {
  return <div className="container-page flex gap-2 overflow-hidden pt-5" aria-hidden="true">{Array.from({ length: 5 }, (_, i) => <div key={i} className="skeleton h-11 w-28 shrink-0 rounded-full" />)}</div>;
}
