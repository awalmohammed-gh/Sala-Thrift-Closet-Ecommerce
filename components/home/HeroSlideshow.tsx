"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useAnimate } from "motion/react-mini";
import { FaWhatsapp } from "react-icons/fa";
import { FiArrowRight } from "react-icons/fi";
import {
  DURATION,
  EASE_OUT,
  REVEAL_OFFSET,
} from "@/components/animations/tokens";
import { usePrefersReducedMotion } from "@/components/animations/usePrefersReducedMotion";
import { cn } from "@/lib/utils";

interface Slide {
  image: string;
  /** The colours at the photo's left and right sides, so a portrait photo can melt into a wide banner. */
  edges: string;
  tag: string;
  lead: string;
  accent: string;
  rest: string;
  /** Says what the photo shows. The first slide says what the store does instead. */
  text: string;
  action: { label: string; href: string };
  /** Which part of a tall photo to keep when the banner crops it. */
  focus?: string;
  /** Makes the image a logo card, named for screen readers. Photos sit beside copy that describes them. */
  logoAlt?: string;
}

const SHOP_NOW = { label: "Shop now", href: "/shop" };

const SLIDES: readonly Slide[] = [
  {
    image: "/images/brand/salasty-logo.webp",
    edges: "#e7d9c5, #f3e8d9",
    logoAlt: "SALASTY Thrift Closet logo",
    tag: "Welcome to SALASTY",
    lead: "Many products.",
    accent: "One",
    rest: " easy store.",
    text: "Shop clothing, perfumes and more, then send your order on WhatsApp.",
    action: { label: "Shop all", href: "/shop" },
  },
  {
    image: "/images/editorial/look-perfume.webp",
    edges: "#221112, #331312",
    tag: "Perfumes",
    lead: "All kinds of",
    accent: "perfumes",
    rest: ".",
    text: "We sell all kinds of perfume, from light and fresh to rich and woody.",
    action: SHOP_NOW,
  },
  {
    image: "/images/editorial/look-abaya.webp",
    edges: "#8c6747, #cab4a3",
    focus: "50% 62%",
    tag: "Modest fashion",
    lead: "Elegant abayas,",
    accent: "made",
    rest: " to flow.",
    text: "A flowing black abaya with cream trim and wide, graceful sleeves.",
    action: SHOP_NOW,
  },
  {
    image: "/images/editorial/look-denim-detail.webp",
    edges: "#555753, #432c0d",
    tag: "Just in",
    lead: "Wide leg denim,",
    accent: "ready",
    rest: " to wear.",
    text: "Dark blue, high-waisted jeans with a wide, easy leg.",
    action: { label: "See new arrivals", href: "/shop?sort=newest" },
  },
  {
    image: "/images/editorial/look-wrap-dress.webp",
    edges: "#79796e, #bcbeb8",
    tag: "Dresses",
    lead: "Wrap dresses,",
    accent: "easy",
    rest: " to wear.",
    text: "A long brown wrap dress with relaxed sleeves and a flowing skirt.",
    action: SHOP_NOW,
  },
];

const INTERVAL_MS = 5000;
const SWIPE_PX = 40;
const DIAGONAL = "[clip-path:polygon(16%_0,100%_0,100%_100%,0_100%)]";
const BUTTON =
  "group inline-flex min-h-11 items-center gap-1.5 whitespace-nowrap rounded-full bg-tag px-3.5 text-[13px] font-bold text-brand-deep shadow-lg transition-colors hover:bg-white sm:gap-2 sm:px-5 sm:text-sm lg:min-h-13 lg:px-6 lg:text-base";

function SlideAction({
  slide,
  chatUrl,
}: {
  slide: Slide;
  chatUrl: string | null;
}) {
  const arrow: ReactNode = (
    <FiArrowRight
      className="hidden size-4 transition-transform duration-200 ease-out-soft group-hover:translate-x-1 sm:block"
      aria-hidden="true"
    />
  );
  if (slide === SLIDES[0] && chatUrl)
    return (
      <a
        href={chatUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={BUTTON}
      >
        <FaWhatsapp className="size-5" aria-hidden="true" />
        Shop on WhatsApp{arrow}
        <span className="sr-only"> (opens in a new tab)</span>
      </a>
    );
  return (
    <Link href={slide.action.href} className={BUTTON}>
      {slide.action.label}
      {arrow}
    </Link>
  );
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
    const slide = scope.current?.querySelector<HTMLElement>(
      `[data-slide="${index}"]`,
    );
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
      animate(
        copy,
        { opacity: [0, 1], translate: [`0 ${REVEAL_OFFSET}px`, "0 0"] },
        {
          duration: DURATION.reveal,
          ease: EASE_OUT,
          delay: (i: number) => 0.12 + i * 0.08,
        },
      ).then(clear, clear);
      if (photo)
        animate(
          photo,
          { transform: ["scale(1.06)", "scale(1)"] },
          { duration: 1.1, ease: EASE_OUT },
        );
    } catch {
      clear();
    }
  }, [index, reduceMotion, scope, animate]);

  useEffect(() => {
    if (held || reduceMotion) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible")
        setIndex((current) => (current + 1) % SLIDES.length);
    }, INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [held, reduceMotion, index]);

  const go = (step: number) =>
    setIndex((current) => (current + step + SLIDES.length) % SLIDES.length);

  return (
    <section
      ref={scope}
      aria-roledescription="carousel"
      aria-label="Featured looks"
      className="relative h-full overflow-hidden bg-navy text-white"
      onMouseEnter={() => setHeld(true)}
      onMouseLeave={() => setHeld(false)}
      onFocus={() => setHeld(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setHeld(false);
      }}
      onTouchStart={(event) => {
        touchStart.current = event.touches[0]?.clientX ?? null;
        setHeld(true);
      }}
      onTouchEnd={(event) => {
        const start = touchStart.current;
        const end = event.changedTouches[0]?.clientX;
        touchStart.current = null;
        setHeld(false);
        if (
          start !== null &&
          end !== undefined &&
          Math.abs(end - start) > SWIPE_PX
        )
          go(end < start ? 1 : -1);
      }}
    >
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-y-0 right-0 w-[58%] bg-brand lg:w-[64%]",
          DIAGONAL,
        )}
      />

      {SLIDES.map((slide, i) => {
        const active = i === index;
        const Heading = i === 0 ? "h1" : "h2";
        return (
          <div
            key={slide.image}
            data-slide={i}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${SLIDES.length}`}
            aria-hidden={!active}
            inert={!active}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-out-soft",
              active ? "opacity-100" : "opacity-0",
            )}
          >
            <div
              className={cn(
                "absolute inset-y-0 right-0 w-[52%] overflow-hidden lg:w-[60%]",
                DIAGONAL,
              )}
              style={{
                background: `linear-gradient(to right, ${slide.edges})`,
              }}
            >
              <div
                data-photo
                className={
                  slide.logoAlt
                    ? "absolute left-[54%] top-1/2 size-32 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-3xl shadow-xl min-[375px]:size-36 sm:size-48 lg:size-72"
                    : "absolute inset-y-0 left-1/2 aspect-3/4 -translate-x-1/2 mask-[linear-gradient(to_right,transparent,black_18%,black_82%,transparent)]"
                }
              >
                <Image
                  src={slide.image}
                  alt={slide.logoAlt ?? ""}
                  fill
                  sizes="(min-width: 1024px) 340px, (min-width: 640px) 260px, 200px"
                  priority={i === 0}
                  className="object-cover"
                  style={slide.focus ? { objectPosition: slide.focus } : undefined}
                />
              </div>
            </div>
            <div className="container-page relative flex h-full items-center pb-6">
              <div
                className={cn(
                  "flex max-w-[56%] flex-col items-start lg:max-w-xl",
                  i === 0 && "animate-hero-rise",
                )}
              >
                <p
                  data-rise
                  className="rounded-full bg-tag px-2.5 py-1 text-[10px] font-bold text-brand-deep sm:text-xs lg:px-3.5 lg:text-sm"
                >
                  {slide.tag}
                </p>
                <Heading
                  data-rise
                  className="mt-2 font-display text-[clamp(1.25rem,6.6vw,2.5rem)] font-bold leading-[1.05] tracking-[-0.035em] lg:mt-3 lg:text-[3.25rem] xl:text-[4rem]"
                >
                  <span className="block">{slide.lead}</span>
                  <span className="block">
                    <span className="text-tag">{slide.accent}</span>
                    {slide.rest}
                  </span>
                </Heading>
                <p
                  data-rise
                  className="mt-1.5 max-w-[88%] text-xs leading-snug text-blue-50 sm:text-sm lg:mt-3 lg:max-w-[24rem] lg:text-lg xl:max-w-[27rem]"
                >
                  {slide.text}
                </p>
                <div data-rise className="mt-2.5 lg:mt-6">
                  <SlideAction slide={slide} chatUrl={chatUrl} />
                </div>
              </div>
            </div>
          </div>
        );
      })}

      <div className="container-page pointer-events-none absolute inset-x-0 bottom-1.5 lg:bottom-4">
        <div className="pointer-events-auto -ml-1 inline-flex">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.image}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show slide ${i + 1}: ${slide.lead}`}
              aria-current={i === index ? "true" : undefined}
              className="flex size-6 items-center justify-center"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "block size-2.5 rounded-full bg-white transition-opacity duration-500",
                  i === index ? "opacity-100" : "opacity-40",
                )}
              />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
