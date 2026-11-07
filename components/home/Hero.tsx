import { getBanners, getProducts, getSettings } from "@/lib/catalog";
import { bestDeal } from "@/lib/productDisplay";
import { supportChatUrl } from "@/lib/whatsapp";
import { HeroCarousel } from "./HeroCarousel";
import { HeroSlideshow } from "./HeroSlideshow";

const FRAME = "relative h-72 overflow-hidden rounded-b-3xl sm:h-80 lg:h-[27rem]";

/** Full-width banner: the store's own banners when it has any, otherwise the house slides. */
export async function MarketHero() {
  const [banners, settings, sale] = await Promise.all([getBanners(), getSettings(), getProducts({ onSale: true, availability: "in-stock", limit: 48 })]);
  // Never a fixed number: this badge only exists while a discount set in the admin is live.
  const deal = bestDeal(sale?.items);

  return (
    <section className={FRAME} aria-label="Featured">
      {banners.length ? <HeroCarousel banners={banners} /> : <HeroSlideshow chatUrl={supportChatUrl(settings, `Hello ${settings.storeName}, I'd like to shop with you.`)} />}
      {deal > 0 && (
        <p className="pointer-events-none absolute right-2 top-2 z-20 flex size-16 flex-col items-center justify-center rounded-full bg-navy text-center font-display font-bold leading-none text-white shadow-lg ring-4 ring-white/15 lg:right-8 lg:top-6 lg:size-28">
          <span className="text-[9px] lg:text-sm">UP TO</span>
          <span className="text-lg text-tag lg:my-0.5 lg:text-4xl">{deal}%</span>
          <span className="text-[9px] lg:text-sm">OFF</span>
        </p>
      )}
    </section>
  );
}

export function MarketHeroSkeleton() {
  return <div className={`${FRAME} skeleton rounded-t-none!`} aria-hidden="true" />;
}
