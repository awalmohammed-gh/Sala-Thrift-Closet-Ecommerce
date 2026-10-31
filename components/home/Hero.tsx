import Image from "next/image";
import type { CSSProperties } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { FiArrowRight, FiCheck } from "react-icons/fi";
import { RevealOnScroll } from "@/components/animations/RevealOnScroll";
import { ButtonLink } from "@/components/ui/Button";
import { getBanners } from "@/lib/catalog";
import { HeroCarousel } from "./HeroCarousel";
import { HeroSlideshow } from "./HeroSlideshow";

const PROMISES = ["Order on WhatsApp", "Delivery or pickup", "No account needed"];

/** Entrance delay for the banner's staggered CSS animations (plays before JavaScript loads). */
const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

/** A short market banner: the products below it are the real landing page. */
export function Hero() {
  return (
    <section className="container-page pt-4 sm:pt-6" aria-labelledby="hero-heading">
      {/* Phones get a full-bleed photo slideshow; larger screens the two-photo banner. */}
      <HeroSlideshow className="animate-hero-rise md:hidden" />
      <div className="group/hero relative hidden animate-hero-rise overflow-hidden rounded-3xl md:block bg-linear-to-br from-blue-700 via-blue-600 to-sky-500 text-white shadow-[0_20px_50px_-28px_rgba(30,64,175,0.6)]">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 size-72 animate-hero-pulse rounded-full border border-white/20" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 -left-16 size-56 animate-hero-pulse rounded-full bg-white/10 blur-2xl" style={delay(1500)} />
        <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 p-5 sm:gap-8 sm:p-8 lg:px-12">
          <div className="min-w-0">
            <p className="mb-3 inline-flex animate-hero-word items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] sm:text-xs" style={delay(120)}>
              <FaWhatsapp className="size-3.5" aria-hidden="true" />Thrift market
            </p>
            <h1 id="hero-heading" className="font-display text-[clamp(1.6rem,4.6vw,3.25rem)] font-bold leading-[1.02] tracking-[-0.045em]">
              <span className="block animate-hero-word" style={delay(200)}>Good finds.</span>
              <span className="block animate-hero-word" style={delay(300)}>Great prices.</span>
            </h1>
            <p className="mt-2 hidden max-w-sm animate-hero-word text-sm leading-6 text-blue-50 sm:block" style={delay(400)}>Pick what you love, add it to your cart and send your order on WhatsApp.</p>
            <div className="animate-hero-word" style={delay(480)}>
              <ButtonLink href="/shop" size="sm" variant="secondary" className="group mt-4 rounded-full! border-white! px-4! text-blue-700! sm:mt-5" rightIcon={<FiArrowRight className="size-4 transition-transform duration-200 ease-out-soft group-hover:translate-x-1" aria-hidden="true" />}>
                Shop all
              </ButtonLink>
            </div>
          </div>
          <div aria-hidden="true" className="relative h-40 w-30 sm:h-56 sm:w-60 lg:h-64 lg:w-72">
            <div className="absolute left-0 top-0 h-[86%] w-[72%] animate-hero-float">
              <div className="relative size-full -rotate-3 animate-hero-photo overflow-hidden rounded-2xl border-[3px] border-white bg-slate-100 shadow-lg transition-[rotate,scale] duration-500 ease-out-soft group-hover/hero:rotate-0 group-hover/hero:scale-[1.03] sm:border-4" style={delay(250)}>
                <Image src="/images/editorial/look-denim-main.webp" alt="" fill sizes="(min-width: 1024px) 210px, (min-width: 640px) 175px, 90px" className="animate-hero-zoom object-cover object-[50%_40%]" />
              </div>
            </div>
            <div className="absolute bottom-0 right-0 h-[64%] w-[52%] animate-hero-float" style={{ animationDelay: "-2.5s" }}>
              <div className="relative size-full rotate-6 animate-hero-photo overflow-hidden rounded-2xl border-[3px] border-white bg-blue-50 shadow-lg transition-[rotate,scale] duration-500 ease-out-soft group-hover/hero:rotate-2 group-hover/hero:scale-105 sm:border-4" style={delay(450)}>
                <Image src="/images/editorial/look-denim-detail.webp" alt="" fill sizes="(min-width: 1024px) 150px, (min-width: 640px) 125px, 64px" className="animate-hero-zoom object-cover object-top" style={{ animationDelay: "-7s" }} />
              </div>
            </div>
          </div>
        </div>
        <ul className="relative flex flex-wrap gap-x-4 gap-y-1 border-t border-white/15 px-5 py-2.5 text-[11px] font-medium text-blue-50 sm:px-8 sm:text-xs lg:px-12">
          {PROMISES.map((text, index) => <li key={text} className="inline-flex animate-hero-word items-center gap-1.5" style={delay(560 + index * 80)}><FiCheck className="size-3.5" aria-hidden="true" />{text}</li>)}
        </ul>
      </div>
    </section>
  );
}

/** Banners managed in Admin → Banners. Hidden when there are none. */
export async function Banners() {
  const banners = await getBanners();
  if (!banners.length) return null;
  return <section className="container-page pb-2" aria-label="Latest from the closet"><RevealOnScroll className="overflow-hidden rounded-3xl"><HeroCarousel banners={banners} /></RevealOnScroll></section>;
}
