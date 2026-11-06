import { discountPercent, resolvePrice, type CategoryDTO, type ProductDTO, type ProductVariantDTO } from "@salasty-thrift-closet/shared";

const activeVariants = (product: ProductDTO) => product.variants.filter((variant) => variant.isActive);

/**
 * The discount a shopper really gets, or null. Discounts only ever come from prices set in the
 * admin, and a compare-at price on the product means nothing when variant prices override it,
 * so this reads the prices the cart will charge.
 */
export function dealPercent(product: ProductDTO): number | null {
  const variants = activeVariants(product);
  if (!variants.length) return discountPercent(product.price, product.compareAtPrice);
  const best = Math.max(0, ...variants.map((variant) => {
    const { price, compareAtPrice } = resolvePrice(product, variant);
    return discountPercent(price, compareAtPrice) ?? 0;
  }));
  return best || null;
}

/** The largest real discount among these products, or 0 when nothing is discounted. */
export const bestDeal = (products: readonly ProductDTO[] | undefined) => Math.max(0, ...(products ?? []).filter((product) => product.inStock).map((product) => dealPercent(product) ?? 0));

/** The struck-through price for a card: only when every option sells at the same discounted price. */
export function cardCompareAtPrice(product: ProductDTO): number | null {
  const variants = activeVariants(product);
  if (!variants.length) return product.compareAtPrice;
  const [first, ...rest] = variants.map((variant) => resolvePrice(product, variant));
  return first && rest.every((other) => other.price === first.price && other.compareAtPrice === first.compareAtPrice) ? first.compareAtPrice : null;
}

/** With a single option there is nothing to choose, so a card can add it straight to the cart. */
export function onlyVariant(product: ProductDTO): ProductVariantDTO | null {
  const variants = activeVariants(product);
  return product.variants.length === 1 && variants.length === 1 ? variants[0]! : null;
}

const CATEGORY_PHOTOS = [
  { match: /\bjeans?\b|\bdenim\b/i, url: "/images/categories/jeans.webp" },
  { match: /\bdress(es)?\b|\bgowns?\b|\babayas?\b|\bbubus?\b|\bkaftans?\b/i, url: "/images/categories/dress.webp" },
  { match: /\bperfumes?\b|\bfragrances?\b|\bcolognes?\b|\bsplash(es)?\b/i, url: "/images/categories/perfume.webp" },
  { match: /\bt-?shirts?\b|\btees?\b|\btops?\b|\bshirts?\b/i, url: "/images/categories/t-shirt.webp" },
];

/** The house photo for a category, by its name. It only dresses a real category and never adds one. */
export const categoryPhoto = (name: string) => CATEGORY_PHOTOS.find(({ match }) => match.test(name))?.url ?? null;

/**
 * The store's real categories with something to buy, fullest first. Nothing is hard-coded: a
 * category appears here as soon as a product is added to it, and leaves when it has none.
 */
export function marketAisles(categories: readonly CategoryDTO[] | null | undefined): CategoryDTO[] {
  return (categories ?? [])
    .filter((category) => category.isActive && (category.productCount ?? 0) > 0)
    .sort((a, b) => (b.productCount ?? 0) - (a.productCount ?? 0) || a.displayOrder - b.displayOrder || a.name.localeCompare(b.name, "en"));
}
