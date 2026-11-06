import Image from "next/image";
import { FiArrowRight } from "react-icons/fi";

/** Top of the shop. It holds no discount: savings only show on products, from prices set in the admin. */
export function ShopBanner() {
  return (
    <section className="relative h-52 overflow-hidden bg-linear-to-r from-brand-100 via-brand-50 to-white sm:h-64 lg:h-80" aria-labelledby="shop-heading">
      <div className="absolute inset-y-0 right-0 w-[56%] mask-[linear-gradient(to_right,transparent,black_30%)] lg:w-[58%]">
        <Image src="/images/editorial/shop-rack.webp" alt="" fill sizes="(min-width: 1024px) 58vw, 56vw" loading="eager" fetchPriority="high" className="object-cover object-[60%_50%]" />
      </div>
      <div className="container-page relative flex h-full items-center">
        <div className="flex max-w-[62%] animate-hero-rise flex-col items-start lg:max-w-xl">
          <p className="rounded-full bg-tag px-2.5 py-1 text-[11px] font-bold text-brand-deep lg:px-3.5 lg:text-sm">Shop the Latest</p>
          <h1 id="shop-heading" className="mt-2 font-display text-[clamp(1.45rem,6vw,2.25rem)] font-bold leading-[1.05] tracking-[-0.035em] text-brand-deep lg:mt-3 lg:text-[3.25rem]">Premium Fashion at Great Prices</h1>
          <p className="mt-2 hidden text-base text-ink sm:block">Trendy styles. Unbeatable prices. Shop smarter with Salasty.</p>
          <a href="#products" className="group mt-3 inline-flex min-h-11 items-center gap-2 rounded-full bg-tag px-5 text-sm font-bold text-brand-deep shadow-sm transition-colors hover:bg-brand-deep hover:text-white lg:mt-5 lg:min-h-12 lg:px-6 lg:text-base">
            Start Shopping<FiArrowRight className="size-4 transition-transform duration-200 ease-out-soft group-hover:translate-x-1" aria-hidden="true" />
          </a>
        </div>
      </div>
    </section>
  );
}
