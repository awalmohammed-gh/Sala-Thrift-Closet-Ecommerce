"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAnimate } from "motion/react-mini";
import { EASE_OUT } from "./tokens";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const DURATION = 0.28;

/** Opens and closes its content smoothly. Closed content leaves the page, so its fields can't be tabbed to. */
export function Collapse({ open, children }: { open: boolean; children: ReactNode }) {
  const [scope, animate] = useAnimate<HTMLDivElement>();
  const reduceMotion = usePrefersReducedMotion();
  const [mounted, setMounted] = useState(open);
  const wasOpen = useRef(open);
  if (open && !mounted) setMounted(true);

  useEffect(() => {
    if (wasOpen.current === open) return;
    wasOpen.current = open;
    const element = scope.current;
    if (!element || reduceMotion) {
      if (!open) setTimeout(() => setMounted(false));
      return;
    }
    const clear = () => {
      element.style.removeProperty("height");
      element.style.removeProperty("overflow");
      element.style.removeProperty("opacity");
    };
    const height = `${element.scrollHeight}px`;
    element.style.setProperty("overflow", "hidden");
    const run = animate(element, { height: open ? ["0px", height] : [height, "0px"], opacity: open ? [0, 1] : [1, 0] }, { duration: DURATION, ease: EASE_OUT });
    const finish = () => {
      clear();
      if (!wasOpen.current) setMounted(false);
    };
    run.then(finish, finish);
  }, [open, reduceMotion, scope, animate]);

  return mounted ? <div ref={scope}>{children}</div> : null;
}
