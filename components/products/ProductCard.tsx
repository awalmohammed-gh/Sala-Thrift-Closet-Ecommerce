import Link from "next/link";
import { FiArrowUpRight } from "react-icons/fi";
import { priceRange, resolvePrice, type ProductDTO } from "@salasty-thrift-closet/shared";
import { cardCompareAtPrice, dealPercent, onlyVariant } from "@/lib/productDisplay";
import { cn } from "@/lib/utils";
import { AddToCartButton } from "./AddToCartButton";
import { PriceTag } from "./PriceTag";
import { ProductImage } from "./ProductImage";

const LOW_STOCK = 5;
const SIZES = "(min-width: 1280px) 200px, (min-width: 1024px) 23vw, (min-width: 640px) 31vw, 48vw";
const ACTION = "min-h-10 rounded-lg! bg-brand-deep! text-xs text-white! hover:bg-brand!";

/**
 * Image-first product card. The title link stretches over the whole card, so the card has a clear
 * destination; the purchase action sits above the stretched link. The discount badge only shows
 * for a discount set in the admin.
 */
export function ProductCard({ product, priority = false, list = false }: { product: ProductDTO; priority?: boolean; list?: boolean }) {
  const href = `/products/${product.slug}`;
  const range = priceRange(product);
  const compareAtPrice = cardCompareAtPrice(product);
  const discount = dealPercent(product);
  const soldOut = !product.inStock;
  const lowStock = !soldOut && product.stock <= LOW_STOCK;
  const [image, hoverImage] = product.images;
  const label = product.subCategory || product.category?.name;
  const variant = onlyVariant(product);
  const pricing = resolvePrice(product, variant);
  const mustChoose = product.variants.length > 0 && !variant;

  return (
    <article className={cn("group lift flex h-full min-w-0 rounded-2xl border border-line bg-white p-2 transition-[border-color,translate] hover:border-brand/25", list ? "gap-3" : "flex-col", soldOut && "cursor-not-allowed")}>
      <div className={cn("relative aspect-4/5 overflow-hidden rounded-xl bg-slate-100", list && "w-28 shrink-0 self-start sm:w-36")}>
        <ProductImage
          src={image?.url}
          alt={image?.alt || product.name}
          sizes={SIZES}
          priority={priority}
          className={cn(soldOut ? "opacity-45 grayscale" : "transition-[scale,opacity] duration-700 ease-out-soft group-hover:scale-[1.04]", !soldOut && hoverImage && "group-hover:opacity-0")}
        />
        {hoverImage && !soldOut && (
          <ProductImage src={hoverImage.url} alt="" sizes={SIZES} className="opacity-0 transition-opacity duration-700 ease-out-soft group-hover:opacity-100" />
        )}
        {discount && !soldOut && <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-tag px-2 py-1 text-xs font-bold leading-none text-brand-deep shadow-sm">-{discount}%</span>}
        {soldOut && <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-ink px-2 py-1 text-xs font-semibold leading-none text-white">Out of stock</span>}
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
      <div className={cn("flex flex-1 flex-col gap-0.5 px-1 pt-2", soldOut && "opacity-60")}>
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-ink sm:text-sm">
          {soldOut ? <span>{product.name}</span> : <Link href={href} className="transition-colors duration-200 before:absolute before:inset-0 before:rounded-2xl group-hover:text-brand focus-visible:outline-none focus-visible:before:outline-2 focus-visible:before:outline-offset-2 focus-visible:before:outline-brand">
            {product.name}
          </Link>}
        </h3>
        <p className="flex min-w-0 items-baseline justify-between gap-2 text-xs">
          <span className="truncate text-muted">{label}</span>
          {lowStock && <span className="shrink-0 font-semibold text-danger">{product.stock === 1 ? "Last one" : `Only ${product.stock} left`}</span>}
        </p>
        {list && product.description && <p className="line-clamp-2 text-xs leading-relaxed text-muted">{product.description}</p>}
        <PriceTag size="card" price={range.min} maxPrice={range.max} compareAtPrice={compareAtPrice} className="mt-auto pt-1" />
      </div>
      {!soldOut && (
        <div className={cn("relative z-10 mt-2", list && "sm:w-44 sm:self-end")}>
          {mustChoose ? (
            <Link href={href} aria-label={`Select options for ${product.name}`} className={cn("inline-flex w-full items-center justify-center gap-1.5 px-2 py-2 font-semibold transition-colors", ACTION)}>
              Select Options<FiArrowUpRight className="size-3.5 shrink-0" aria-hidden="true" />
            </Link>
          ) : (
            <AddToCartButton
              size="sm"
              label="Buy Now"
              buyNow
              className={ACTION}
              line={{ productId: product.id, variantId: variant?.id ?? null, slug: product.slug, name: product.name, image: image?.url ?? null, attributes: variant?.attributes ?? [], unitPrice: pricing.price, compareAtPrice: pricing.compareAtPrice, maxQuantity: variant?.stock ?? product.stock }}
            />
          )}
        </div>
      )}
      </div>
    </article>
  );
}
