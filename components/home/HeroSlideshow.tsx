"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FiArrowRight } from "react-icons/fi";
import { usePrefersReducedMotion } from "@/components/animations/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

const SLIDES = [
  {
    image: "/images/editorial/look-denim-main.webp",
    position: "50% 40%",
    eyebrow: "Thrift market",
    title: "Good finds. Great prices.",
    text: "Light-wash baggy jeans and more, picked one by one for you.",
    cta: "Shop all",
    href: "/shop",
  },
  {
    image: "/images/editorial/look-denim-detail.webp",
    position: "50% 30%",
    eyebrow: "Just in",
    title: "Wide-leg denim, ready to wear",
    text: "New pieces every week. Order on WhatsApp in minutes.",
    cta: "See new arrivals",
    href: "/shop?sort=newest",
  },
] as const;

const INTERVAL_MS = 5000;
const SWIPE_PX = 40;
const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

/**
 * Phone hero: full-bleed photo slides with an overlay and centred copy. Slides change on their
 * own; touching or focusing the banner holds the current slide, and it waits while the tab is
 * hidden. Visitors who prefer reduced motion get a still banner they can swipe or tap through.
 */
export function HeroSlideshow({ className }: { className?: string }) {
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const reduceMotion = usePrefersReducedMotion();
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    if (held || reduceMotion) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") setIndex((current) => (current + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [held, reduceMotion, index]);

  const go = (step: number) => setIndex((current) => (current + step + SLIDES.length) % SLIDES.length);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured looks"
      className={cn("relative h-[clamp(360px,58svh,460px)] overflow-hidden rounded-3xl bg-brand-deep text-white shadow-[0_20px_50px_-28px_rgba(30,64,175,0.6)]", className)}
      onFocus={() => setHeld(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false); }}
      onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientX ?? null; setHeld(true); }}
      onTouchEnd={(event) => {
        const start = touchStart.current;
        const end = event.changedTouches[0]?.clientX;
        touchStart.current = null;
        setHeld(false);
        if (start !== null && end !== undefined && Math.abs(end - start) > SWIPE_PX) go(end < start ? 1 : -1);
      }}
    >
      {SLIDES.map((slide, i) => {
        const active = i === index;
        const Heading = i === 0 ? "h1" : "h2";
        return (
          <div
            key={slide.image}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${SLIDES.length}`}
            aria-hidden={!active}
            inert={!active}
            className={cn("absolute inset-0 transition-opacity duration-1000 ease-out-soft", active ? "opacity-100" : "opacity-0")}
          >
            <Image
              src={slide.image}
              alt=""
              fill
              sizes="100vw"
              priority={i === 0}
              className={cn("object-cover", active && "animate-hero-zoom")}
              style={{ objectPosition: slide.position }}
            />
            <div aria-hidden="true" className="absolute inset-0 bg-linear-to-t from-slate-950/85 via-blue-950/55 to-slate-950/30" />
            <div className="absolute inset-0 flex flex-col items-center justify-center px-6 pb-8 text-center">
              <p className={cn("inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] backdrop-blur-sm", active && "animate-hero-word")} style={delay(100)}>{slide.eyebrow}</p>
              <Heading className={cn("mt-3 max-w-xs font-display text-[2rem] font-bold leading-[1.05] tracking-[-0.04em] [text-wrap:balance]", active && "animate-hero-word")} style={delay(200)}>{slide.title}</Heading>
              <p className={cn("mt-3 max-w-[18rem] text-sm leading-6 text-white/85", active && "animate-hero-word")} style={delay(320)}>{slide.text}</p>
              <Link href={slide.href} className={cn("mt-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-blue-700 shadow-lg transition-colors hover:bg-blue-50", active && "animate-hero-word")} style={delay(440)}>
                {slide.cta}<FiArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        );
      })}

      <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
        {SLIDES.map((slide, i) => (
          <button
            key={slide.image}
            type="button"
            onClick={() => setIndex(i)}
            aria-label={`Show slide ${i + 1}: ${slide.title}`}
            aria-current={i === index ? "true" : undefined}
            className="flex h-6 items-center px-1"
          >
            <span aria-hidden="true" className={cn("block h-1.5 rounded-full bg-white transition-[width,opacity] duration-500 ease-out-soft", i === index ? "w-6 opacity-100" : "w-1.5 opacity-50")} />
          </button>
        ))}
      </div>
    </section>
  );
}
