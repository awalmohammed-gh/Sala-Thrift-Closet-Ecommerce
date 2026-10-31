import Image from "next/image";
import Link from "next/link";
import { FiGrid } from "react-icons/fi";
import type { CategoryDTO } from "@salasty-thrift-closet/shared";
import { cn } from "@/lib/utils";

interface CategoryChipsProps {
  categories: CategoryDTO[];
  /** Slug of the selected category, "" for all products, or undefined when none is selected (home page). */
  active?: string;
  /** Builds the shop URL for a category (keeping the other filters). */
  hrefFor: (slug: string) => string;
  /** Scroll to the top after navigating. Off for in-place filtering on the shop page. */
  scroll?: boolean;
  /** Slide the chips in one after another (home page entrance). */
  animated?: boolean;
}

/** Entrance delay per chip; later chips are usually off screen, so the stagger stops early. */
const chipDelay = (index: number) => ({ animationDelay: `${350 + Math.min(index, 7) * 60}ms` });

const chip = "inline-flex h-11 shrink-0 snap-start items-center gap-2 rounded-full border pl-1.5 pr-4 text-sm font-medium transition-colors duration-200";
const idle = "border-line bg-white text-ink hover:border-brand/40 hover:bg-brand-50";
const selected = "border-brand bg-brand text-white";

/**
 * Horizontally scrolling category pills; plain links, so they work without JavaScript.
 * The list is `relative` so the sr-only (absolute) count text is clipped with it; otherwise it
 * escapes the scroll area and widens the page on phones.
 */
export function CategoryChips({ categories, active, hrefFor, scroll = false, animated = false }: CategoryChipsProps) {
  const visible = categories.filter((c) => (c.productCount ?? 0) > 0 || c.slug === active);
  if (!visible.length) return null;
  const total = categories.reduce((sum, c) => sum + (c.productCount ?? 0), 0);

  return (
    <nav aria-label="Categories" className="-mx-4 sm:-mx-6 lg:mx-0">
      <ul className="relative flex snap-x gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:px-6 lg:flex-wrap lg:px-0 [&::-webkit-scrollbar]:hidden">
        <li className={cn("shrink-0", animated && "animate-chip-in")} style={animated ? chipDelay(0) : undefined}>
          <Link href={hrefFor("")} scroll={scroll} aria-current={active === "" ? "page" : undefined} className={cn(chip, active === "" ? selected : idle)}>
            <span className={cn("flex size-8 items-center justify-center rounded-full", active === "" ? "bg-white/15" : "bg-brand-50 text-brand")}>
              <FiGrid className="size-4" aria-hidden="true" />
            </span>
            All
            <Count value={total} selected={active === ""} />
          </Link>
        </li>
        {visible.map((category, index) => {
          const isActive = category.slug === active;
          return (
            <li key={category.id} className={cn("shrink-0", animated && "animate-chip-in")} style={animated ? chipDelay(index + 1) : undefined}>
              <Link href={hrefFor(category.slug)} scroll={scroll} aria-current={isActive ? "page" : undefined} className={cn(chip, isActive ? selected : idle)}>
                <span className="relative size-8 shrink-0 overflow-hidden rounded-full bg-cream-200">
                  {category.image && <Image src={category.image.url} alt="" fill sizes="32px" className="object-cover" />}
                </span>
                <span className="whitespace-nowrap">{category.name}</span>
                <Count value={category.productCount ?? 0} selected={isActive} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function Count({ value, selected }: { value: number; selected: boolean }) {
  return (
    <span className={cn("rounded-full px-1.5 text-xs tabular-nums", selected ? "bg-white/15 text-white" : "bg-cream-200 text-muted")}>
      <span className="sr-only">(</span>
      {value}
      <span className="sr-only"> products)</span>
    </span>
  );
}
