import Image from "next/image";
import type { ImageAsset } from "@salasty-thrift-closet/shared";
import { cn } from "@/lib/utils";

const DEFAULT_LOGO = "/images/brand/salasty-logo.webp";
/** The admin portal always shows its own artwork, separate from the store's uploaded logo. */
const ADMIN_LOGO = "/images/brand/salasty-admin-logo.webp";

/** The supplied SALASTY artwork, kept intact in compact brand placeholders. */
export function BrandMark({ className, admin = false }: { className?: string; inverted?: boolean; admin?: boolean }) {
  return (
    <span className={cn("relative inline-block shrink-0 overflow-hidden rounded-xl", className)} aria-hidden="true">
      <Image src={admin ? ADMIN_LOGO : DEFAULT_LOGO} alt="" fill sizes="96px" className="object-contain" />
    </span>
  );
}

interface LogoProps {
  storeName?: string;
  logo?: ImageAsset | null;
  tone?: "light" | "dark";
  className?: string;
  showTagline?: boolean;
  admin?: boolean;
}

/** Use the supplied artwork by default; an admin-uploaded logo can override it on the storefront. */
export function Logo({ storeName = "SALASTY THRIFT CLOSET", logo, tone = "light", className, showTagline = false, admin = false }: LogoProps) {
  const uploaded = admin ? null : logo;
  return (
    <span className={cn("inline-flex min-w-0 max-w-full shrink-0 flex-col", className)}>
      <Image
        src={uploaded?.url || (admin ? ADMIN_LOGO : DEFAULT_LOGO)}
        alt={admin ? `${storeName} Admin` : storeName}
        width={uploaded?.width ?? (admin ? 512 : 1254)}
        height={uploaded?.height ?? (admin ? 512 : 1254)}
        sizes="(min-width: 640px) 96px, 72px"
        className="h-16 w-auto max-w-44 rounded-xl object-contain sm:h-20"
        priority
      />
      {showTagline && <span className={cn("mt-2 text-[10px] font-semibold uppercase tracking-[0.12em]", tone === "dark" ? "text-white/70" : "text-muted")}>
        {admin ? "Admin Portal" : "Thrift clothing"}
      </span>}
    </span>
  );
}
