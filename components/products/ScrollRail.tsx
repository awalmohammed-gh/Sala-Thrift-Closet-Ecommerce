"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { usePrefersReducedMotion } from "@/components/animations/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

/** Pixels of slack, so fractional scroll positions still count as the end of the row. */
const EDGE = 4;

const arrow = "absolute top-1/2 z-20 hidden size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-brand-deep shadow-pop ring-1 ring-black/5 transition-colors hover:bg-brand hover:text-white lg:flex";

/**
 * A swipeable row. Phones swipe edge to edge; on desktop, where a mouse cannot swipe, arrows page
 * through it. It is a plain list of links, so it also works before JavaScript loads.
 */
export function ScrollRail({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  const list = useRef<HTMLUListElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    const element = list.current;
    if (!element) return;
    const measure = () => setEdges({
      start: element.scrollLeft <= EDGE,
      end: element.scrollLeft + element.clientWidth >= element.scrollWidth - EDGE,
    });
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    element.addEventListener("scroll", measure, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener("scroll", measure);
    };
  }, []);

  const page = (direction: 1 | -1) => {
    const element = list.current;
    element?.scrollBy({ left: direction * element.clientWidth * 0.85, behavior: reduceMotion ? "auto" : "smooth" });
  };

  return (
    <div className="relative">
      <ul ref={list} aria-label={label} className={cn("relative -mx-4 flex snap-x gap-3 overflow-x-auto scroll-px-4 px-4 [scrollbar-width:none] sm:-mx-6 sm:scroll-px-6 sm:px-6 lg:mx-0 lg:scroll-px-0 lg:px-0 [&::-webkit-scrollbar]:hidden", className)}>
        {children}
      </ul>
      {!edges.start && <button type="button" onClick={() => page(-1)} aria-label={`Scroll ${label} back`} className={cn(arrow, "-left-3")}><FiChevronLeft className="size-5" aria-hidden="true" /></button>}
      {!edges.end && <button type="button" onClick={() => page(1)} aria-label={`Scroll ${label} forward`} className={cn(arrow, "-right-3")}><FiChevronRight className="size-5" aria-hidden="true" /></button>}
    </div>
  );
}
