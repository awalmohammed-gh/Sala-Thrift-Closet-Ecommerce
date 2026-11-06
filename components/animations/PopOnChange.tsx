"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { useAnimate } from "motion/react-mini";
import { cn } from "@/lib/utils";
import { EASE_OUT } from "./tokens";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

/** A small bounce when a value changes, so a new total or cart count is noticed. */
export function PopOnChange({ value, className, children, ...props }: { value: string | number } & ComponentProps<"span">) {
  const [scope, animate] = useAnimate<HTMLSpanElement>();
  const reduceMotion = usePrefersReducedMotion();
  const shown = useRef(value);

  useEffect(() => {
    if (shown.current === value) return;
    shown.current = value;
    const element = scope.current;
    if (!element || reduceMotion) return;
    const clear = () => element.style.removeProperty("transform");
    try {
      animate(element, { transform: ["scale(1)", "scale(1.18)", "scale(1)"] }, { duration: 0.32, ease: EASE_OUT }).then(clear, clear);
    } catch {
      clear();
    }
  }, [value, reduceMotion, scope, animate]);

  return <span ref={scope} className={cn("inline-block", className)} {...props}>{children}</span>;
}
