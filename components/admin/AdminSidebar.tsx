"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { IconType } from "react-icons";
import { FiArrowUpRight, FiBell, FiBox, FiChevronLeft, FiChevronRight, FiGrid, FiHome, FiImage, FiLayers, FiLogOut, FiPlus, FiPlusSquare, FiSettings, FiShoppingCart } from "react-icons/fi";
import type { ImageAsset } from "@salasty-thrift-closet/shared";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/utils";
import { useAdminSession } from "./AdminSession";

export interface AdminNavItem {
  label: string;
  /** One plain-language line under the label, so each page explains itself. */
  hint: string;
  href: string;
  icon: IconType;
  exact?: boolean;
}

export const ADMIN_NAV: AdminNavItem[] = [
  { label: "Dashboard", hint: "Sales at a glance", href: "/admin", icon: FiHome, exact: true },
  { label: "Orders", hint: "WhatsApp orders from customers", href: "/admin/orders", icon: FiShoppingCart },
  { label: "Products", hint: "Edit, hide or delete items", href: "/admin/products", icon: FiBox, exact: true },
  { label: "Add product", hint: "Put a new item on sale", href: "/admin/products/new", icon: FiPlusSquare, exact: true },
  { label: "Categories", hint: "Group items, e.g. Jeans", href: "/admin/categories", icon: FiGrid },
  { label: "Stock", hint: "Low and sold-out items", href: "/admin/inventory", icon: FiLayers },
  { label: "Banners", hint: "Slides on the home page", href: "/admin/banners", icon: FiImage },
  { label: "Notifications", hint: "Send alerts to shoppers", href: "/admin/notifications", icon: FiBell },
  { label: "Settings", hint: "Store name, WhatsApp, logo", href: "/admin/settings", icon: FiSettings },
];

export function isNavActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href || (href === "/admin/products" && /^\/admin\/products\/[^/]+\/edit$/.test(pathname));
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** "Add product" is the big button at the top, so it is not repeated in the list. */
const NAV_SECTIONS = [
  { label: "Daily", routes: ["/admin", "/admin/orders"] },
  { label: "Products", routes: ["/admin/products", "/admin/categories", "/admin/inventory"] },
  { label: "Store", routes: ["/admin/banners", "/admin/notifications", "/admin/settings"] },
];

/** Things waiting for the admin, shown as badges. Unknown until the dashboard loads. */
export interface AdminNavCounts {
  newOrders: number;
  stockAlerts: number;
}

interface AdminSidebarProps {
  onNavigate?: () => void;
  storeName?: string;
  logo?: ImageAsset | null;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  counts?: AdminNavCounts | null;
}

function badgeFor(href: string, counts: AdminNavCounts | null | undefined): { text: string; label: string; tone: "brand" | "danger" } | null {
  if (!counts) return null;
  if (href === "/admin/orders" && counts.newOrders > 0) return { text: `${counts.newOrders > 99 ? "99+" : counts.newOrders} new`, label: `${counts.newOrders} new orders`, tone: "brand" };
  if (href === "/admin/inventory" && counts.stockAlerts > 0) return { text: counts.stockAlerts > 99 ? "99+" : String(counts.stockAlerts), label: `${counts.stockAlerts} items low or sold out`, tone: "danger" };
  return null;
}

export function AdminSidebar({ onNavigate, storeName = "SALASTY THRIFT CLOSET", logo, collapsed = false, onToggleCollapse, counts }: AdminSidebarProps) {
  const pathname = usePathname();
  const { admin, logout } = useAdminSession();
  const addingProduct = pathname === "/admin/products/new";

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden bg-brand-deep pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)] text-cream">
      <div className={cn("flex min-h-20 shrink-0 items-center gap-2 px-4", collapsed && "justify-center px-2")}>
        <Link href="/admin" onClick={onNavigate} aria-label={`${storeName} dashboard`} className={cn("flex min-w-0 items-center gap-2.5 rounded-lg focus-visible:outline-white", !onToggleCollapse && "pr-10")}>
          <Logo tone="dark" storeName={storeName} logo={logo} admin className="[&>span]:!h-11 [&>span]:!w-12 [&>img]:!h-11 [&>img]:!max-w-12" />
          {!collapsed && <span className="min-w-0"><span className="block truncate font-display text-sm font-semibold text-white">{storeName}</span><span className="mt-0.5 block text-[11px] text-cream/60">Admin</span></span>}
        </Link>
        {!collapsed && onToggleCollapse && <button type="button" onClick={onToggleCollapse} aria-label="Collapse sidebar" aria-expanded="true" title="Make sidebar smaller" className="ml-auto flex size-8 shrink-0 items-center justify-center rounded-lg text-cream/65 hover:bg-white/10 hover:text-white focus-visible:outline-white"><FiChevronLeft aria-hidden="true" className="size-4" /></button>}
      </div>

      <div className={cn("shrink-0 px-4 pb-4", collapsed && "px-3")}>
        <Link href="/admin/products/new" onClick={onNavigate} aria-label="Add product" title={collapsed ? "Add product" : undefined} aria-current={addingProduct ? "page" : undefined} className={cn("flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand px-3 text-sm font-semibold text-white shadow-[0_8px_20px_-8px_rgba(37,99,235,0.8)] transition-colors hover:bg-brand-700 focus-visible:outline-white", addingProduct && "ring-2 ring-white/70 ring-offset-2 ring-offset-brand-deep", collapsed && "px-0")}>
          <FiPlus aria-hidden="true" className="size-5 shrink-0" />{!collapsed && "Add product"}
        </Link>
      </div>

      <nav aria-label="Admin" className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-3 pb-4 [scrollbar-width:thin]">
        {NAV_SECTIONS.map((section) => <div key={section.label}>
          <p className={cn("mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-cream/45", collapsed && "sr-only")}>{section.label}</p>
          <ul className={cn("space-y-0.5", collapsed && "space-y-2")}>
            {ADMIN_NAV.filter((item) => section.routes.includes(item.href)).map(({ label, hint, href, icon: Icon, exact }) => {
              const active = isNavActive(pathname, href, exact);
              const badge = badgeFor(href, counts);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    title={collapsed ? (badge ? `${label} (${badge.label})` : label) : undefined}
                    aria-label={collapsed ? label : undefined}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex min-h-12 items-center gap-3 rounded-xl px-3 py-2 transition-colors focus-visible:outline-white",
                      active ? "bg-white text-brand-deep shadow-sm" : "text-cream/80 hover:bg-white/8 hover:text-white",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    {active && !collapsed && <span aria-hidden="true" className="absolute inset-y-2.5 left-0 w-1 rounded-r-full bg-brand" />}
                    <span className={cn("relative flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors", active ? "bg-brand-50 text-brand" : "bg-white/5 text-cream/70 group-hover:bg-white/10 group-hover:text-white")}>
                      <Icon className="size-[18px]" aria-hidden="true" />
                      {collapsed && badge && <span aria-hidden="true" className={cn("absolute -right-1 -top-1 size-2.5 rounded-full ring-2 ring-brand-deep", badge.tone === "danger" ? "bg-red-400" : "bg-sky-400")} />}
                    </span>
                    {!collapsed && (
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold">{label}</span>
                        <span className={cn("block truncate text-[11px] leading-4", active ? "text-muted" : "text-cream/50 group-hover:text-cream/70")}>{hint}</span>
                      </span>
                    )}
                    {!collapsed && badge && (
                      <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold tabular-nums", badge.tone === "danger" ? "bg-red-500 text-white" : active ? "bg-brand text-white" : "bg-sky-400 text-brand-deep")}>
                        {badge.text}
                      </span>
                    )}
                    {badge && <span className="sr-only">, {badge.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>)}
      </nav>

      <div className="shrink-0 space-y-2 border-t border-white/10 p-3">
        {collapsed && onToggleCollapse && <button type="button" onClick={onToggleCollapse} aria-label="Expand sidebar" aria-expanded="false" title="Show full sidebar" className="flex min-h-11 w-full items-center justify-center rounded-xl text-cream/70 hover:bg-white/8 hover:text-white focus-visible:outline-white"><FiChevronRight aria-hidden="true" className="size-[18px]" /></button>}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label={collapsed ? "View store (opens in a new tab)" : undefined}
          title={collapsed ? "View store" : undefined}
          className={cn("flex min-h-11 items-center gap-3 rounded-xl border border-white/15 px-3 py-2 text-sm font-medium text-cream/80 hover:border-white/30 hover:bg-white/8 hover:text-white focus-visible:outline-white", collapsed && "justify-center px-0")}
        >
          <FiArrowUpRight className="size-[18px] shrink-0" aria-hidden="true" />{!collapsed && <>View my store<span className="sr-only"> (opens in a new tab)</span></>}
        </a>
        <div className={cn("flex min-w-0 items-center gap-2.5 rounded-xl bg-white/5 p-2", collapsed && "flex-col px-0")}>
          <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-bold text-white">{admin.name.charAt(0).toUpperCase()}</span>
          {!collapsed && <p className="min-w-0 flex-1 truncate text-xs font-semibold text-white" title={admin.name}>{admin.name}</p>}
          <button
            type="button"
            onClick={() => void logout()}
            aria-label="Sign out"
            title="Sign out"
            className={cn("inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-cream/75 hover:bg-white/10 hover:text-white focus-visible:outline-white", collapsed && "size-10 justify-center px-0")}
          >
            <FiLogOut className="size-4" aria-hidden="true" />{!collapsed && "Sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}
