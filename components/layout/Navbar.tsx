"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useId, useRef, useState, type Ref } from "react";
import { FiPackage, FiSearch, FiShoppingCart, FiX } from "react-icons/fi";
import type { ImageAsset } from "@salasty-thrift-closet/shared";
import { PopOnChange } from "@/components/animations/PopOnChange";
import { Logo } from "@/components/brand/Logo";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { InstallPwaButton } from "@/components/ui/InstallPwaButton";
import { useCart } from "@/hooks/useCart";
import { cn } from "@/lib/utils";

interface NavbarProps {
  storeName: string;
  logo: ImageAsset | null;
  notificationsEnabled?: boolean;
}

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About Us", href: "/about" },
  { label: "Contact", href: "/contact" },
];

interface SearchFormProps {
  className?: string;
  query?: string;
  id?: string;
  inputRef?: Ref<HTMLInputElement>;
  onEscape?: () => void;
}

/** A native GET form keeps search usable before JavaScript loads. On /shop it shows the current search. */
export function SearchForm({ className, query = "", id: formId, inputRef, onEscape }: SearchFormProps) {
  const id = useId();
  return (
    <form id={formId} role="search" action="/shop" method="get" onKeyDown={(event) => { if (event.key === "Escape") onEscape?.(); }} className={cn("flex min-w-0 items-center gap-2 rounded-full border border-blue-100 bg-slate-50/70 p-1 transition-colors focus-within:border-blue-400 focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-50", className)}>
      <label htmlFor={id} className="sr-only">Search the store</label>
      <FiSearch className="ml-3 size-4 shrink-0 text-slate-400" aria-hidden="true" />
      <input ref={inputRef} key={query} id={id} name="q" type="search" maxLength={100} defaultValue={query} placeholder="Search for products..." className="h-8 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-slate-400 md:text-sm" />
      <button type="submit" aria-label="Search" className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-deep text-white transition-colors hover:bg-brand"><FiSearch className="size-4" aria-hidden="true" /></button>
    </form>
  );
}

export function Navbar({ storeName, logo, notificationsEnabled = false }: NavbarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { itemCount, hydrated } = useCart();

  // Below desktop width, search hides behind an icon and opens as a bar under the header.
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchPath, setSearchPath] = useState(pathname);
  if (searchPath !== pathname) {
    setSearchPath(pathname);
    setSearchOpen(false);
  }
  const searchInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (searchOpen) searchInput.current?.focus();
  }, [searchOpen]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white">
      <div className="container-page grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-5 gap-y-2 py-2 md:grid-cols-[auto_minmax(0,1fr)_auto] lg:grid-cols-[auto_auto_minmax(0,1fr)_auto] lg:gap-x-6">
        <Link href="/" aria-label={`${storeName} home`} className="inline-flex shrink-0 items-center gap-3 rounded-xl focus-visible:outline-offset-4">
          <Logo storeName={storeName} logo={logo} compact />
          <span className="hidden border-l border-blue-100 pl-4 xl:block"><span className="block font-display text-lg font-bold tracking-[0.12em] text-slate-900">SALASTY</span><span className="mt-1 block text-[9px] font-medium uppercase tracking-[0.25em] text-slate-500">Thrift Closet</span></span>
        </Link>
        {/* Phones use the bottom navigation bar instead of these links. */}
        <nav aria-label="Main navigation" className="hidden md:col-start-2 md:row-start-1 md:block">
          <ul className="flex w-max items-center">
            {NAV_LINKS.map(({ label, href }) => {
              const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
              return <li key={href}><Link href={href} aria-current={active ? "page" : undefined} className={cn("relative inline-flex min-h-11 items-center whitespace-nowrap px-3 text-sm font-medium transition-colors after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full", active ? "font-semibold text-brand after:bg-brand" : "text-ink after:bg-transparent hover:text-brand hover:after:bg-blue-200")}>{label}</Link></li>;
            })}
          </ul>
        </nav>
        <SearchForm
          id="site-search"
          inputRef={searchInput}
          onEscape={() => setSearchOpen(false)}
          query={pathname === "/shop" ? searchParams.get("q") ?? "" : ""}
          className={cn("col-span-2 row-start-2 animate-fade-in md:col-span-3 lg:col-span-1 lg:col-start-3 lg:row-start-1 lg:ml-auto lg:flex lg:w-full lg:max-w-xs lg:animate-none", searchOpen ? "flex" : "hidden")}
        />
        <div className="col-start-2 row-start-1 ml-auto flex shrink-0 items-center gap-1 sm:gap-2 md:col-start-3 lg:col-start-4">
          <InstallPwaButton variant="navbar" className="rounded-full!" />
          {notificationsEnabled && <NotificationBell storeName={storeName} />}
          <button
            type="button"
            onClick={() => setSearchOpen((open) => !open)}
            aria-expanded={searchOpen}
            aria-controls="site-search"
            aria-label={searchOpen ? "Close search" : "Search"}
            className={cn("inline-flex size-11 items-center justify-center rounded-full transition-colors lg:hidden", searchOpen ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700")}
          >
            {searchOpen ? <FiX className="size-5" aria-hidden="true" /> : <FiSearch className="size-5" aria-hidden="true" />}
          </button>
          <Link href="/my-orders" aria-label="My Orders" className="hidden min-h-11 items-center gap-2 rounded-full px-3 text-sm font-medium text-ink transition-colors hover:text-brand md:inline-flex"><FiPackage className="size-5" aria-hidden="true" /><span className="hidden xl:inline">My Orders</span></Link>
          <Link href="/cart" aria-label={hydrated ? `Cart, ${itemCount} item${itemCount === 1 ? "" : "s"}` : "Cart"} className="relative inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-3 text-sm font-medium text-ink transition-colors hover:text-brand">
            <FiShoppingCart className="size-5" aria-hidden="true" /><span className="hidden sm:inline">Cart</span>
            {hydrated && itemCount > 0 && <PopOnChange value={itemCount} className="absolute right-0 top-0 min-w-5 rounded-full bg-danger px-1 py-0.5 text-center text-[10px] font-bold leading-none text-white">{itemCount > 99 ? "99+" : itemCount}</PopOnChange>}
          </Link>
        </div>
      </div>
    </header>
  );
}
