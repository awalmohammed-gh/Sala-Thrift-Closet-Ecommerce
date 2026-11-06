import type { ReactNode } from "react";
import type { ProductDTO } from "@salasty-thrift-closet/shared";
import { cn } from "@/lib/utils";
import { ProductCard } from "./ProductCard";

/** 2, 3, 4 and 6 columns all divide the 12 and 24 items a page shows, so rows stay full. */
const GRID = "grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3";
const COLUMNS = {
  wide: "lg:grid-cols-4 xl:grid-cols-6",
  /** Short lists that would leave a wide row half empty. */
  four: "lg:grid-cols-4",
  /** Beside the shop's filter column. */
  shop: "xl:grid-cols-4",
};
const LIST = "grid gap-3";

export function ProductGrid({
  products,
  empty,
  priorityCount = 0,
  className,
  columns = "wide",
  list = false,
}: {
  products: ProductDTO[];
  empty?: ReactNode;
  priorityCount?: number;
  className?: string;
  columns?: keyof typeof COLUMNS;
  /** One product per row, with its description. */
  list?: boolean;
}) {
  if (!products.length) return <>{empty ?? null}</>;
  return (
    <ul className={cn(list ? LIST : cn(GRID, COLUMNS[columns]), className)}>
      {products.map((product, index) => (
        <li key={product.id} className="min-w-0">
          <ProductCard product={product} priority={index < priorityCount} list={list} />
        </li>
      ))}
    </ul>
  );
}

export function ProductGridSkeleton({ count = 8, className, columns = "wide" }: { count?: number; className?: string; columns?: keyof typeof COLUMNS }) {
  return (
    <ul className={cn(GRID, COLUMNS[columns], className)} aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <li key={i} className="min-w-0">
          <div className="skeleton aspect-4/5 rounded-2xl" />
          <div className="space-y-2 px-0.5 pt-3">
            <div className="skeleton h-2.5 w-1/3" />
            <div className="skeleton h-4 w-4/5" />
            <div className="skeleton h-5 w-2/5" />
          </div>
        </li>
      ))}
    </ul>
  );
}
