"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAnimate } from "motion/react-mini";
import { FiAlertTriangle, FiCheck, FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import { LIMITS, formatGHS, type QuoteLine } from "@salasty-thrift-closet/shared";
import { EASE_OUT } from "@/components/animations/tokens";
import { usePrefersReducedMotion } from "@/components/animations/usePrefersReducedMotion";
import { ProductImage } from "@/components/products/ProductImage";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";
import type { CartLine } from "@/types/cart";

export function CartItem({ line, issue }: { line: CartLine; issue?: QuoteLine | null }) {
  const { setQuantity, removeItem, pending } = useCart();
  const max = Math.min(line.maxQuantity, LIMITS.maxLineQuantity);
  const blocked = issue && issue.status !== "ok" && issue.status !== "quantity_adjusted";
  // The line slides away the moment Remove is pressed, while the request runs; the cart
  // state is never held back for the animation. If removal fails the line comes back.
  const [leaving, setLeaving] = useState(false);
  const [scope, animate] = useAnimate<HTMLLIElement>();
  const reduceMotion = usePrefersReducedMotion();
  const remove = () => {
    setLeaving(true);
    removeItem(line.key).catch(() => setLeaving(false));
  };

  useEffect(() => {
    const element = scope.current;
    if (!leaving || !element || reduceMotion) return;
    element.style.setProperty("overflow", "hidden");
    const run = animate(element, { height: [`${element.offsetHeight}px`, "0px"], opacity: [1, 0], transform: ["translateX(0)", "translateX(-24px)"], paddingBlock: ["16px", "0px"] }, { duration: 0.3, ease: EASE_OUT });
    return () => {
      run.stop();
      for (const property of ["height", "opacity", "overflow", "padding-block", "transform"]) element.style.removeProperty(property);
    };
  }, [leaving, reduceMotion, scope, animate]);

  return (
    <li ref={scope} className={cn("py-4", blocked && "opacity-90", leaving && "pointer-events-none")}>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-3 sm:grid-cols-[auto_minmax(0,1fr)_auto_6.5rem_auto] sm:gap-x-4">
        <Link href={`/products/${line.slug}`} className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:size-28">
          <ProductImage src={line.image} alt={line.name} sizes="112px" />
        </Link>

        <div className="min-w-0">
          <Link href={`/products/${line.slug}`} className="line-clamp-2 font-bold text-brand-deep hover:text-brand">{line.name}</Link>
          {line.attributes.length > 0 && <p className="mt-0.5 text-sm text-muted">{line.attributes.map((a) => `${a.name}: ${a.value}`).join("  |  ")}</p>}
          <p className="mt-1 font-display font-bold text-brand">
            {formatGHS(line.unitPrice)}
            {line.compareAtPrice && <span className="ml-1.5 text-sm font-normal text-muted line-through">{formatGHS(line.compareAtPrice)}</span>}
          </p>
          {!issue && <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-success-50 px-2 py-0.5 text-xs font-medium text-success"><FiCheck className="size-3" aria-hidden="true" />In Stock</span>}
        </div>

        <div className="col-span-2 flex items-center justify-between gap-3 sm:contents">
          <div className="flex items-center rounded-xl border border-line bg-white" role="group" aria-label={`Quantity for ${line.name}`}>
            <button type="button" onClick={() => void setQuantity(line.key, Math.min(line.quantity - 1, max)).catch(() => undefined)} disabled={pending || line.quantity <= 1 || !!blocked} className="flex size-10 items-center justify-center text-ink disabled:opacity-35" aria-label="Decrease quantity">
              <FiMinus />
            </button>
            <span className="w-8 text-center text-sm font-bold" aria-live="polite">{line.quantity}</span>
            <button type="button" onClick={() => void setQuantity(line.key, line.quantity + 1).catch(() => undefined)} disabled={pending || line.quantity >= max || !!blocked} className="flex size-10 items-center justify-center text-ink disabled:opacity-35" aria-label="Increase quantity">
              <FiPlus />
            </button>
          </div>
          <p className="ml-auto text-right font-display font-bold text-brand-deep sm:ml-0">{formatGHS(line.unitPrice * line.quantity)}</p>
          <button type="button" onClick={remove} disabled={pending || leaving} aria-label={`Remove ${line.name}`} title="Remove" className="inline-flex size-10 items-center justify-center rounded-lg text-muted transition-colors hover:bg-danger-50 hover:text-danger">
            <FiTrash2 className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      {issue?.message && (
        <p className={cn("mt-2 flex items-start gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium", blocked ? "bg-danger-50 text-danger" : "bg-accent-50 text-accent-700")} role="status">
          <FiAlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden="true" /> {issue.message}
          {blocked && " Remove it to continue."}
        </p>
      )}
      {!issue && line.quantity >= max && max > 1 && <p className="mt-2 text-xs text-muted">Maximum available quantity in cart.</p>}
    </li>
  );
}
