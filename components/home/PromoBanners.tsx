import Image from "next/image";
import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { RevealOnScroll } from "@/components/animations/RevealOnScroll";
import { getProducts } from "@/lib/catalog";
import { bestDeal } from "@/lib/productDisplay";

const ARROW = <FiArrowRight className="size-4 transition-transform duration-200 ease-out-soft group-hover:translate-x-1" aria-hidden="true" />;
const PHOTO_SIZES = "(min-width: 768px) 25vw, 45vw";

/** Two promo cards. The navy card names a saving only while a discount set in the admin is live. */
export async function PromoBanners() {
  const sale = await getProducts({ onSale: true, availability: "in-stock", limit: 48 });
  const deal = bestDeal(sale?.items);

  return (
    <section className="container-page pt-8 sm:pt-10" aria-label="Promotions">
      <RevealOnScroll className="grid gap-3 md:grid-cols-2">
        <Link href={deal ? "/shop?sort=price-asc" : "/shop?sort=newest"} className="group relative flex h-40 overflow-hidden rounded-2xl bg-navy text-white sm:h-48">
          <span className="absolute inset-y-0 left-0 w-[42%] overflow-hidden [clip-path:polygon(0_0,100%_0,82%_100%,0_100%)]">
            <Image src="/images/editorial/promo-street.webp" alt="" fill sizes={PHOTO_SIZES} className="object-cover object-[50%_18%] transition-[scale] duration-700 ease-out-soft group-hover:scale-105" />
          </span>
          <span className="relative ml-[42%] flex min-w-0 flex-1 flex-col items-start justify-center px-3 sm:px-5">
            <span className="text-xs font-bold text-tag sm:text-sm">{deal ? "While stock lasts" : "Just in"}</span>
            <span className="mt-0.5 font-display text-xl font-bold leading-tight tracking-[-0.03em] sm:text-3xl">{deal ? `Save up to ${deal}%` : "Fresh in the closet"}</span>
            <span className="mt-0.5 text-sm text-blue-50">{deal ? "On selected items" : "New pieces every week"}</span>
            <span className="mt-2.5 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-tag px-4 text-sm font-bold text-brand-deep sm:mt-3">Shop Now{ARROW}</span>
          </span>
        </Link>

        <Link href="/shop" className="group relative flex h-40 overflow-hidden rounded-2xl bg-tag text-brand-deep sm:h-48">
          <span className="relative flex w-[60%] min-w-0 flex-col items-start justify-center pl-4 sm:pl-7">
            <span className="font-display text-xl font-bold leading-tight tracking-[-0.03em] sm:text-3xl">Shop Smart,<br />Live Better</span>
            <span className="mt-1 text-sm">Quality. Style. Affordability.</span>
            <span className="mt-2.5 inline-flex min-h-9 items-center gap-1.5 rounded-full bg-brand-deep px-4 text-sm font-bold text-white sm:mt-3">Explore Shop{ARROW}</span>
          </span>
          <span className="absolute inset-y-0 right-0 w-[40%] [mask-image:linear-gradient(to_right,transparent,black_35%)]">
            <Image src="/images/editorial/promo-shopper.webp" alt="" fill sizes={PHOTO_SIZES} className="object-cover object-[50%_12%] mix-blend-multiply transition-[scale] duration-700 ease-out-soft group-hover:scale-105" />
          </span>
        </Link>
      </RevealOnScroll>
    </section>
  );
}
