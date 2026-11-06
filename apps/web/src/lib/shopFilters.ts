import { LIMITS, PRODUCT_SORTS, SLUG_PATTERN, type ProductSort } from "@salasty-thrift-closet/shared";

const MAX_CEDIS = LIMITS.maxPriceInPesewas / 100;

export type ShopParams = Record<string, string | string[] | undefined>;

export interface ShopState {
  q: string;
  category: string;
  sort: ProductSort;
  availability: "all" | "in-stock";
  /** Whole cedis; 0 means no limit on that side. */
  min: number;
  max: number;
  view: "grid" | "list";
  page: number;
}

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

function cedis(value: string | string[] | undefined): number {
  const parsed = Number.parseInt(first(value) ?? "", 10);
  return parsed > 0 && parsed <= MAX_CEDIS ? parsed : 0;
}

/** Turns untrusted URL parameters into safe filter values. */
export function parseShopFilters(params: ShopParams): ShopState {
  const category = first(params.category) ?? "";
  const sort = first(params.sort) as ProductSort | undefined;
  const page = Number.parseInt(first(params.page) ?? "1", 10);
  const min = cedis(params.min);
  const max = cedis(params.max);
  return {
    q: (first(params.q) ?? "").trim().slice(0, 100),
    category: SLUG_PATTERN.test(category) ? category : "",
    sort: sort && PRODUCT_SORTS.includes(sort) ? sort : "newest",
    availability: first(params.availability) === "in-stock" ? "in-stock" : "all",
    min,
    max: max && max < min ? 0 : max,
    view: first(params.view) === "list" ? "list" : "grid",
    page: Number.isFinite(page) && page > 0 && page < 10_000 ? page : 1,
  };
}

/** The shop URL for a state. Changing a filter starts again at page 1 unless a page is passed. */
export function shopHref(state: ShopState, changes: Partial<ShopState> = {}): string {
  const next = { ...state, ...changes, page: changes.page ?? 1 };
  const query = new URLSearchParams();
  if (next.q) query.set("q", next.q);
  if (next.category) query.set("category", next.category);
  if (next.sort !== "newest") query.set("sort", next.sort);
  if (next.availability === "in-stock") query.set("availability", "in-stock");
  if (next.min) query.set("min", String(next.min));
  if (next.max) query.set("max", String(next.max));
  if (next.view === "list") query.set("view", "list");
  if (next.page > 1) query.set("page", String(next.page));
  const text = query.toString();
  return text ? `/shop?${text}` : "/shop";
}

export const hasActiveFilters = (state: ShopState) => !!(state.q || state.category || state.min || state.max || state.availability === "in-stock");

/** The top of the price slider: the dearest price, rounded up to a tidy number. */
export const priceCeiling = (pesewas: number | undefined) => (pesewas ? Math.ceil(pesewas / 1000) * 10 : 1000);
