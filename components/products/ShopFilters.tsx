"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition, type ReactNode } from "react";
import { FiChevronDown, FiChevronUp, FiSliders } from "react-icons/fi";
import { PRODUCT_SORTS, PRODUCT_SORT_LABELS, type ProductSort } from "@salasty-thrift-closet/shared";
import { Spinner } from "@/components/ui/Spinner";
import { hasActiveFilters, shopHref, type ShopState } from "@/lib/shopFilters";
import { cn } from "@/lib/utils";

const STEP = 5;

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details open className="group border-t border-line py-3">
      <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between text-sm font-bold text-brand-deep [&::-webkit-details-marker]:hidden">
        {title}
        <FiChevronUp className="size-4 -rotate-180 transition-transform group-open:rotate-0" aria-hidden="true" />
      </summary>
      <div className="mt-1.5">{children}</div>
    </details>
  );
}

/** Two thumbs on one track. Nothing changes until Filter is pressed, so dragging never reloads the list. */
function PriceRange({ min, max, ceiling, onApply }: { min: number; max: number; ceiling: number; onApply: (min: number, max: number) => void }) {
  const [low, setLow] = useState(Math.min(min, ceiling));
  const [high, setHigh] = useState(max ? Math.min(max, ceiling) : ceiling);
  const percent = (value: number) => (value / ceiling) * 100;
  return (
    <div>
      <div className="price-range relative mt-1 h-6">
        <div aria-hidden="true" className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-line" />
        <div aria-hidden="true" className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand" style={{ left: `${percent(low)}%`, right: `${100 - percent(high)}%` }} />
        <input type="range" aria-label="Lowest price in cedis" min={0} max={ceiling} step={STEP} value={low} onChange={(event) => setLow(Math.min(Number(event.target.value), high - STEP))} />
        <input type="range" aria-label="Highest price in cedis" min={0} max={ceiling} step={STEP} value={high} onChange={(event) => setHigh(Math.max(Number(event.target.value), low + STEP))} />
      </div>
      <p className="mt-1.5 text-sm text-ink">GHS {low} – GHS {high}</p>
      <button type="button" onClick={() => onApply(low, high >= ceiling ? 0 : high)} className="mt-2.5 min-h-10 w-full rounded-lg bg-brand-deep text-sm font-semibold text-white transition-colors hover:bg-brand">Filter</button>
    </div>
  );
}

interface ShopFiltersProps {
  state: ShopState;
  categories: { name: string; slug: string; count: number }[];
  total: number;
  ceiling: number;
}

/** Filter panel. State lives in the URL, so a filtered list can be shared or reloaded. */
export function ShopFilters({ state, categories, total, ceiling }: ShopFiltersProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  // Controls show the shopper's choice at once, while the new results load.
  const [shown, showChoice] = useOptimistic(state, (current, changes: Partial<ShopState>) => ({ ...current, ...changes }));
  const go = (changes: Partial<ShopState>) => startTransition(() => {
    showChoice(changes);
    router.push(shopHref(state, changes), { scroll: false });
  });
  const row = (active: boolean) => cn("flex min-h-9 items-center justify-between gap-2 rounded-lg px-2 text-sm transition-colors", active ? "bg-brand-50 font-semibold text-brand" : "text-ink hover:bg-slate-50");

  return (
    <div>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="shop-filters" className="flex min-h-11 w-full items-center justify-between rounded-xl border border-line bg-white px-4 text-sm font-bold text-brand-deep lg:hidden">
        <span className="inline-flex items-center gap-2"><FiSliders className="size-4" aria-hidden="true" />Filters</span>
        <FiChevronDown className={cn("size-4 transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      <div id="shop-filters" className={cn("mt-2 rounded-2xl border border-line bg-white px-4 pb-1 pt-3 lg:mt-0 lg:block lg:animate-none", open ? "block animate-pop-in" : "hidden")}>
        <div className="flex min-h-9 items-center justify-between pb-2">
          <h2 className="inline-flex items-center gap-2 text-lg font-bold text-brand-deep">
            <FiSliders className="size-5" aria-hidden="true" />Filters
            {pending && <Spinner className="text-brand" label="Updating results" />}
          </h2>
          {hasActiveFilters(state) && <Link href={shopHref({ ...state, q: "", category: "", min: 0, max: 0, availability: "all" })} scroll={false} className="text-xs font-semibold text-brand hover:underline">Clear all</Link>}
        </div>

        <Section title="Categories">
          <ul className="max-h-72 space-y-0.5 overflow-y-auto">
            <li><Link href={shopHref(state, { category: "" })} scroll={false} aria-current={!state.category ? "page" : undefined} className={row(!state.category)}>All products<span className="text-xs text-muted">({total})</span></Link></li>
            {categories.map(({ name, slug, count }) => (
              <li key={slug}><Link href={shopHref(state, { category: slug })} scroll={false} aria-current={state.category === slug ? "page" : undefined} className={row(state.category === slug)}><span className="truncate">{name}</span><span className="shrink-0 text-xs text-muted">({count})</span></Link></li>
            ))}
          </ul>
        </Section>

        <Section title="Price Range">
          <PriceRange key={`${state.min}-${state.max}-${ceiling}`} min={state.min} max={state.max} ceiling={ceiling} onApply={(min, max) => go({ min, max })} />
        </Section>

        <Section title="Sort By">
          <fieldset>
            <legend className="sr-only">Sort products by</legend>
            {PRODUCT_SORTS.map((sort) => (
              <label key={sort} className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm text-ink">
                <input type="radio" name="shop-sort" checked={shown.sort === sort} onChange={() => go({ sort })} className="size-4 accent-brand" />
                {PRODUCT_SORT_LABELS[sort]}
              </label>
            ))}
          </fieldset>
        </Section>

        <Section title="Availability">
          <label className="flex min-h-9 cursor-pointer items-center gap-2.5 text-sm text-ink">
            <input type="checkbox" checked={shown.availability === "in-stock"} onChange={(event) => go({ availability: event.target.checked ? "in-stock" : "all" })} className="size-4 rounded accent-brand" />
            In stock only
          </label>
        </Section>
      </div>
    </div>
  );
}

export function SortSelect({ state }: { state: ShopState }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [sort, showSort] = useOptimistic(state.sort);
  return (
    <div className="relative">
      <label htmlFor="shop-sort-select" className="sr-only">Sort by</label>
      <select
        id="shop-sort-select"
        value={sort}
        onChange={(event) => {
          const next = event.target.value as ProductSort;
          startTransition(() => {
            showSort(next);
            router.push(shopHref(state, { sort: next }), { scroll: false });
          });
        }}
        className="h-10 cursor-pointer appearance-none rounded-full border border-line bg-white pl-4 pr-9 text-sm font-medium text-ink transition-colors hover:border-brand/40"
      >
        {PRODUCT_SORTS.map((option) => <option key={option} value={option}>Sort by: {PRODUCT_SORT_LABELS[option]}</option>)}
      </select>
      <FiChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
    </div>
  );
}
