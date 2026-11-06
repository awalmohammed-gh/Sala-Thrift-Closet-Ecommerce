"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { useAnimate } from "motion/react-mini";
import { DURATION, EASE_OUT, MAX_STAGGERED, REVEAL_OFFSET } from "./tokens";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/**
 * Lifts its items in whenever `changeKey` changes, such as new results after a filter. The first
 * render is left alone, so server-rendered content never waits for JavaScript.
 */
export function RiseOnChange({ changeKey, items = ":scope > ul > li", className, children }: { changeKey: string; items?: string; className?: string; children: ReactNode }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reduceMotion = usePrefersReducedMotion();
  const shown = useRef(changeKey);

  useEffect(() => {
    if (shown.current === changeKey) return;
    shown.current = changeKey;
    const targets = Array.from(scope.current?.querySelectorAll<HTMLElement>(items) ?? []).slice(0, MAX_STAGGERED);
    if (reduceMotion || !targets.length) return;
    const clear = () => targets.forEach((el) => {
      el.style.removeProperty("opacity");
      el.style.removeProperty("translate");
    });
    try {
      animate(targets, { opacity: [0, 1], translate: [`0 ${REVEAL_OFFSET}px`, "0 0"] }, { duration: DURATION.reveal, ease: EASE_OUT, delay: (i: number) => i * 0.035 }).then(clear, clear);
    } catch {
      clear();
    }
  }, [changeKey, items, reduceMotion, scope, animate]);

  return <div ref={scope} className={className}>{children}</div>;
}
