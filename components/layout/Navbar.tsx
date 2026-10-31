"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useId } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { FiArrowRight, FiArrowUpRight, FiPackage, FiSearch, FiShoppingBag } from "react-icons/fi";
import type { ImageAsset } from "@salasty-thrift-closet/shared";
import { Logo } from "@/components/brand/Logo";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { InstallPwaButton } from "@/components/ui/InstallPwaButton";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";
import { whatsappChatUrl } from "@/lib/whatsapp";

interface NavbarProps {
  storeName: string;
  logo: ImageAsset | null;
  whatsappNumber: string;
  supportMessage?: string;
  notificationsEnabled?: boolean;
}

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "New arrivals", href: "/shop?sort=newest" },
  { label: "About us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/** A native GET form keeps search usable before JavaScript loads. On /shop it shows the current search. */
export function SearchForm({ className, query = "" }: { className?: string; query?: string }) {
  const id = useId();
  return (
    <form role="search" action="/shop" method="get" className={cn("flex min-w-0 items-center gap-2 rounded-full border border-blue-100 bg-slate-50/70 p-1.5 transition-colors focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50", className)}>
      <label htmlFor={id} className="sr-only">Search clothing</label>
      <FiSearch className="ml-3 size-4 shrink-0 text-slate-400" aria-hidden="true" />
      <input key={query} id={id} name="q" type="search" maxLength={100} defaultValue={query} placeholder="Search jeans, tops, jackets..." className="h-8 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-slate-400 sm:h-9 md:text-sm" />
      <button type="submit" aria-label="Search clothing" className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white transition-colors hover:bg-blue-700 sm:w-auto sm:gap-2 sm:px-5"><span className="hidden text-xs font-semibold sm:inline">Search</span><FiArrowRight className="size-4" aria-hidden="true" /></button>
    </form>
  );
}

export function Navbar({ storeName, logo, whatsappNumber, supportMessage, notificationsEnabled = false }: NavbarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { itemCount, hydrated } = useCart();
  const chatUrl = whatsappChatUrl(whatsappNumber, supportMessage || `Hello ${storeName}, I have a question about a product.`);
  const newest = pathname === "/shop" && searchParams.get("sort") === "newest";

  return (
    <header className="sticky top-0 z-40 border-b border-blue-100/80 bg-white/95 shadow-[0_8px_30px_-24px_rgba(30,64,175,0.3)] backdrop-blur-xl">
      <div className="container-page grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-5 gap-y-3 py-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:gap-8">
        <Link href="/" aria-label={`${storeName} home`} className="inline-flex shrink-0 items-center gap-3 rounded-xl focus-visible:outline-offset-4">
          <Logo storeName={storeName} logo={logo} />
          <span className="hidden border-l border-blue-100 pl-4 lg:block"><span className="block font-display text-lg font-bold tracking-[0.12em] text-slate-900">SALASTY</span><span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.25em] text-slate-500">Thrift Closet</span></span>
        </Link>
        <SearchForm query={pathname === "/shop" ? searchParams.get("q") ?? "" : ""} className="col-span-2 row-start-2 md:col-span-1 md:col-start-2 md:row-start-1 md:mx-auto md:w-full md:max-w-xl" />
        <div className="col-start-2 row-start-1 ml-auto flex shrink-0 items-center gap-1 sm:gap-2 md:col-start-3">
          <InstallPwaButton variant="navbar" className="rounded-full!" />
          {notificationsEnabled && <NotificationBell storeName={storeName} />}
          <Link href="/my-orders" aria-label="My orders" title="My orders" className="hidden size-11 items-center justify-center rounded-full text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700 md:inline-flex"><FiPackage className="size-5" aria-hidden="true" /></Link>
          <span aria-hidden="true" className="mx-1 hidden h-7 w-px bg-blue-100 sm:block" />
          <Link href="/cart" aria-label={hydrated ? `Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}` : "Cart"} className="relative inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-blue-100 bg-blue-50/60 px-3.5 text-sm font-semibold text-blue-700 transition-colors hover:border-blue-200 hover:bg-blue-100/70">
            <FiShoppingBag className="size-5" aria-hidden="true" /><span className="hidden sm:inline">My bag</span>
            {hydrated && itemCount > 0 && <span className="flex min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">{itemCount > 99 ? "99+" : itemCount}</span>}
          </Link>
        </div>
      </div>
      <div className="border-t border-slate-100 bg-linear-to-r from-blue-50/60 via-white to-blue-50/40">
        <div className="container-page flex items-center justify-between gap-6">
          <nav aria-label="Main navigation" className="min-w-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ul className="flex w-max items-center gap-1 sm:gap-3">
              {NAV_LINKS.map((item) => {
                const active = item.href.includes("?") ? newest : item.href === "/shop" ? pathname === "/shop" && !newest : item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                return <li key={item.href}><Link href={item.href} aria-current={active ? "page" : undefined} className={cn("relative inline-flex min-h-12 items-center whitespace-nowrap px-3 text-xs font-medium transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full sm:px-4 sm:text-sm", active ? "text-blue-700 after:bg-blue-600" : "text-slate-500 after:bg-transparent hover:text-blue-700 hover:after:bg-blue-200")}>
                  {item.label}{item.label === "New arrivals" && <FiArrowUpRight className="ml-1.5 size-3.5 text-blue-500" aria-hidden="true" />}
                </Link></li>;
              })}
            </ul>
          </nav>
          {chatUrl && <a href={chatUrl} target="_blank" rel="noopener noreferrer" className="hidden min-h-12 shrink-0 items-center gap-2 text-xs font-medium text-blue-700 lg:inline-flex"><FaWhatsapp className="size-4" aria-hidden="true" />Let&apos;s talk style<span className="sr-only"> on WhatsApp, opens in a new tab</span></a>}
        </div>
      </div>
    </header>
  );
}
