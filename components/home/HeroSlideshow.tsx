"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAnimate } from "motion/react-mini";
import { FaWhatsapp } from "react-icons/fa";
import { FiArrowRight } from "react-icons/fi";
import { DURATION, EASE_OUT, REVEAL_OFFSET } from "@/components/animations/tokens";
import { usePrefersReducedMotion } from "@/components/animations/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

/** `edges` are the colours at each photo's left and right sides, so a portrait photo can melt into a wide banner. */
const SLIDES = [
  { image: "/images/editorial/look-denim-main.webp", edges: "#b6b5ba, #bebdc4", tag: "New stock every week", lead: "Good finds.", accent: "Great", rest: " prices.", text: "Pick what you love and send your order on WhatsApp." },
  { image: "/images/editorial/look-denim-detail.webp", edges: "#555753, #432c0d", tag: "Just in", lead: "Wide leg denim,", accent: "ready", rest: " to wear.", text: "Fresh pieces land on the rail every week." },
  { image: "/images/editorial/look-wrap-dress.webp", edges: "#79796e, #bcbeb8", tag: "No account needed", lead: "Order in minutes,", accent: "right", rest: " on WhatsApp.", text: "Add to cart, tap send, and we confirm with you." },
] as const;

const INTERVAL_MS = 5000;
const SWIPE_PX = 40;
const DIAGONAL = "[clip-path:polygon(16%_0,100%_0,100%_100%,0_100%)]";
const BUTTON = "group inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full bg-tag px-3.5 text-[13px] font-bold text-brand-deep shadow-lg transition-colors hover:bg-white sm:gap-2 sm:px-5 sm:text-sm lg:min-h-13 lg:px-6 lg:text-base";

function SlideAction({ index, chatUrl }: { index: number; chatUrl: string | null }) {
  const arrow: ReactNode = <FiArrowRight className="hidden size-4 transition-transform duration-200 ease-out-soft group-hover:translate-x-1 sm:block" aria-hidden="true" />;
  if (index === 0 && chatUrl) return <a href={chatUrl} target="_blank" rel="noopener noreferrer" className={BUTTON}><FaWhatsapp className="size-5" aria-hidden="true" />Shop on WhatsApp{arrow}<span className="sr-only"> (opens in a new tab)</span></a>;
  if (index === 1) return <Link href="/shop?sort=newest" className={BUTTON}>See new arrivals{arrow}</Link>;
  return <Link href="/shop" className={BUTTON}>Shop all{arrow}</Link>;
}

/**
 * House banner, shown until the store adds its own in Admin → Banners. Slides change on their own
 * and wait while the banner is hovered, touched or focused, and while the tab is hidden; visitors
 * who prefer reduced motion get a still banner they can swipe or tap through.
 */
export function HeroSlideshow({ chatUrl }: { chatUrl: string | null }) {
  const [index, setIndex] = useState(0);
  const [held, setHeld] = useState(false);
  const reduceMotion = usePrefersReducedMotion();
  const touchStart = useRef<number | null>(null);
  const [scope, animate] = useAnimate<HTMLElement>();
  const shownSlide = useRef(0);

  // Each new slide's copy rises in line by line while its photo settles.
  useEffect(() => {
    if (shownSlide.current === index) return;
    shownSlide.current = index;
    const slide = scope.current?.querySelector<HTMLElement>(`[data-slide="${index}"]`);
    if (!slide || reduceMotion) return;
    const copy = Array.from(slide.querySelectorAll<HTMLElement>("[data-rise]"));
    const photo = slide.querySelector<HTMLElement>("[data-photo]");
    const clear = () => {
      copy.forEach((el) => {
        el.style.removeProperty("opacity");
        el.style.removeProperty("translate");
      });
      photo?.style.removeProperty("transform");
    };
    try {
      animate(copy, { opacity: [0, 1], translate: [`0 ${REVEAL_OFFSET}px`, "0 0"] }, { duration: DURATION.reveal, ease: EASE_OUT, delay: (i: number) => 0.12 + i * 0.08 }).then(clear, clear);
      if (photo) animate(photo, { transform: ["scale(1.06)", "scale(1)"] }, { duration: 1.1, ease: EASE_OUT });
    } catch {
      clear();
    }
  }, [index, reduceMotion, scope, animate]);

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
      ref={scope}
      aria-roledescription="carousel"
      aria-label="Featured looks"
      className="relative h-full overflow-hidden bg-navy text-white"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
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
      <div aria-hidden="true" className={cn("absolute inset-y-0 right-0 w-[58%] bg-brand lg:w-[64%]", DIAGONAL)} />

      {SLIDES.map((slide, i) => {
        const active = i === index;
        const Heading = i === 0 ? "h1" : "h2";
        return (
          <div key={slide.image} data-slide={i} role="group" aria-roledescription="slide" aria-label={`${i + 1} of ${SLIDES.length}`} aria-hidden={!active} inert={!active} className={cn("absolute inset-0 transition-opacity duration-700 ease-out-soft", active ? "opacity-100" : "opacity-0")}>
            <div className={cn("absolute inset-y-0 right-0 w-[52%] overflow-hidden lg:w-[60%]", DIAGONAL)} style={{ background: `linear-gradient(to right, ${slide.edges})` }}>
              <div data-photo className="absolute inset-y-0 left-1/2 aspect-3/4 -translate-x-1/2 [mask-image:linear-gradient(to_right,transparent,black_18%,black_82%,transparent)]">
                <Image src={slide.image} alt="" fill sizes="(min-width: 1024px) 340px, (min-width: 640px) 260px, 200px" priority={i === 0} className="object-cover" />
              </div>
            </div>
            <div className="container-page relative flex h-full items-center pb-6">
              <div className={cn("flex max-w-[56%] flex-col items-start lg:max-w-xl", i === 0 && "animate-hero-rise")}>
                <p data-rise className="rounded-full bg-tag px-2.5 py-1 text-[10px] font-bold text-brand-deep sm:text-xs lg:px-3.5 lg:text-sm">{slide.tag}</p>
                <Heading data-rise className="mt-2 font-display text-[clamp(1.5rem,6.6vw,2.5rem)] font-bold leading-[1.05] tracking-[-0.035em] lg:mt-3 lg:text-[4rem]">
                  <span className="block">{slide.lead}</span>
                  <span className="block"><span className="text-tag">{slide.accent}</span>{slide.rest}</span>
                </Heading>
                <p data-rise className="mt-3 hidden text-lg text-blue-50 xl:block">{slide.text}</p>
                <div data-rise className="mt-3 lg:mt-6"><SlideAction index={i} chatUrl={chatUrl} /></div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="container-page pointer-events-none absolute inset-x-0 bottom-1.5 lg:bottom-4">
        <div className="pointer-events-auto -ml-1 inline-flex">
          {SLIDES.map((slide, i) => (
            <button key={slide.image} type="button" onClick={() => setIndex(i)} aria-label={`Show slide ${i + 1}: ${slide.lead}`} aria-current={i === index ? "true" : undefined} className="flex size-6 items-center justify-center">
              <span aria-hidden="true" className={cn("block size-2.5 rounded-full bg-white transition-opacity duration-500", i === index ? "opacity-100" : "opacity-40")} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
