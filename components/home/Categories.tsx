import Link from "next/link";
import { ProductImage } from "@/components/products/ProductImage";
import { ScrollRail } from "@/components/products/ScrollRail";
import { getCategories, getProducts } from "@/lib/catalog";
import { categoryPhoto, marketAisles } from "@/lib/productDisplay";
import { SectionHeading } from "./SectionHeading";

const TINTS = ["bg-brand-100", "bg-brand-50", "bg-[#fde8dc]", "bg-brand-100", "bg-brand-50", "bg-tag-soft"];
/** Six tiles fill a desktop row; more than that scroll, so a new category always has a place. */
const TILE = "w-36 shrink-0 snap-start sm:w-44 lg:w-[calc((100%-5*0.75rem)/6)]";
const PHOTO_SIZES = "(min-width: 1024px) 190px, 176px";
const TILES_PER_ROW = 6;

/**
 * Shop by Category. Every tile is a real category from the admin, shown once it has a product.
 * Its photo is the one uploaded in the admin, else the house photo for that kind of category,
 * else its newest product's photo.
 */
export async function Categories() {
  const [categories, products] = await Promise.all([getCategories(), getProducts({ limit: 48 })]);
  const aisles = marketAisles(categories);
  if (!aisles.length) return null;

  const photoFor = new Map<string, string>();
  for (const product of products?.items ?? []) {
    const url = product.images[0]?.url;
    if (url && product.category && !photoFor.has(product.category.id)) photoFor.set(product.category.id, url);
  }

  return (
    <section className="container-page pt-5 sm:pt-8" aria-labelledby="categories-heading">
      <SectionHeading id="categories-heading" title="Shop by Category" href="/shop" linkLabel="View all categories" />
      <ScrollRail label="categories" className="stagger-in">
        {aisles.map((aisle, index) => (
          <li key={aisle.id} className={TILE}>
            <Link href={`/categories/${aisle.slug}`} className={`group block h-full overflow-hidden rounded-2xl p-2 text-center transition-[filter] hover:brightness-95 ${TINTS[index % TINTS.length]}`}>
              <span className="relative block aspect-square overflow-hidden rounded-xl bg-white/60">
                <ProductImage src={aisle.image?.url ?? categoryPhoto(aisle.name) ?? photoFor.get(aisle.id)} alt="" sizes={PHOTO_SIZES} priority={index < TILES_PER_ROW} className="transition-[scale] duration-500 ease-out-soft group-hover:scale-105" />
              </span>
              <span className="mt-2 line-clamp-2 pb-0.5 text-sm font-bold leading-tight text-brand-deep">{aisle.name}</span>
            </Link>
          </li>
        ))}
      </ScrollRail>
    </section>
  );
}

export function CategoriesSkeleton() {
  return (
    <div className="container-page pt-5 sm:pt-8" aria-hidden="true">
      <div className="skeleton mb-4 h-7 w-48" />
      <div className="flex gap-3 overflow-hidden">{Array.from({ length: 6 }, (_, i) => <div key={i} className={`skeleton aspect-[1/1.15] rounded-2xl ${TILE}`} />)}</div>
    </div>
  );
}
