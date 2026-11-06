"use client";

import { useEffect } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const MOUSE = "(hover: hover) and (pointer: fine)";

/**
 * Eases mouse-wheel scrolling on desktop. Phones already scroll smoothly on their own, so they
 * never download it, and neither do visitors who prefer reduced motion. Menus, dialogs and
 * scrollable lists keep their own scrolling, and nothing moves while a dialog has locked the page.
 */
export function SmoothScroll() {
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (reduceMotion || !window.matchMedia(MOUSE).matches) return;
    let stopped = false;
    let destroy: (() => void) | undefined;
    void import("lenis").then(({ default: Lenis }) => {
      if (stopped) return;
      const lenis = new Lenis({
        autoRaf: true,
        lerp: 0.12,
        anchors: true,
        allowNestedScroll: true,
        prevent: (node) => !!node.closest("dialog, [role='dialog']") || document.documentElement.style.overflow === "hidden",
      });
      destroy = () => lenis.destroy();
    }).catch(() => undefined);
    return () => {
      stopped = true;
      destroy?.();
    };
  }, [reduceMotion]);

  return null;
}
