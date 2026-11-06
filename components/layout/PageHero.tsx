import Image from "next/image";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeroProps {
  eyebrow: string;
  title: string;
  /** Local photo shown on the right. Without one, a blue sweep carries the design. */
  image?: string;
  imagePosition?: string;
  children?: ReactNode;
  className?: string;
}

/** The navy banner that opens the cart, about and contact pages. */
export function PageHero({ eyebrow, title, image, imagePosition = "center", children, className }: PageHeroProps) {
  return (
    <section className={cn("relative overflow-hidden bg-navy text-white", className)}>
      {image ? (
        <div className="absolute inset-y-0 right-0 w-1/2 mask-[linear-gradient(to_right,transparent,black_45%)] sm:w-[62%] lg:w-[56%]">
          <Image src={image} alt="" fill sizes="(min-width: 1024px) 56vw, (min-width: 640px) 62vw, 50vw" loading="eager" fetchPriority="high" className="object-cover" style={{ objectPosition: imagePosition }} />
        </div>
      ) : (
        <div aria-hidden="true" className="absolute inset-y-0 right-0 w-[46%] bg-brand [clip-path:polygon(38%_0,100%_0,100%_100%,0_100%)]" />
      )}
      <div className="container-page relative flex min-h-48 animate-hero-rise flex-col items-start justify-center py-8 sm:min-h-56 lg:min-h-64">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-tag sm:text-sm">{eyebrow}</p>
        <h1 className="mt-1.5 max-w-[78%] font-display text-[clamp(1.85rem,7vw,2.75rem)] font-bold leading-[1.05] tracking-[-0.035em] sm:max-w-2xl lg:text-[3.5rem]">{title}</h1>
        {children}
      </div>
    </section>
  );
}
