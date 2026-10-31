"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { FiPhone, FiX } from "react-icons/fi";
import type { ImageAsset } from "@salasty-thrift-closet/shared";
import { Logo } from "@/components/brand/Logo";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";
import { InstallPwaButton } from "@/components/ui/InstallPwaButton";
import { useScrollLock } from "@/hooks/useScrollLock";

interface MobileNavbarProps {
  open: boolean;
  onClose: () => void;
  storeName: string;
  logo: ImageAsset | null;
  pathname: string;
  chatUrl: string | null;
  supportPhone: string;
}

/** Viewport-bound top menu. Native dialog focus handling keeps the background inert. */
export function MobileNavbar({ open, onClose, storeName, logo, pathname, chatUrl, supportPhone }: MobileNavbarProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useScrollLock(open);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const tablet = window.matchMedia("(min-width: 768px) and (max-width: 1023px)");
    const closeOutsideTablet = () => { if (!tablet.matches) onClose(); };
    closeOutsideTablet();
    tablet.addEventListener("change", closeOutsideTablet);
    return () => tablet.removeEventListener("change", closeOutsideTablet);
  }, [open, onClose]);

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center justify-between rounded-xl px-4 py-3 text-base font-medium transition-colors",
      active ? "bg-brand-50 text-brand" : "text-ink hover:bg-cream",
    );

  return (
    <dialog
      ref={dialogRef}
      aria-label="Menu"
      id="mobile-menu"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === dialogRef.current) onClose(); }}
      className="mobile-menu fixed inset-x-0 top-0 bottom-auto z-50 m-0 h-fit max-h-dvh w-full max-w-none border-0 bg-transparent p-0"
    >
      <div className="flex max-h-dvh min-w-0 flex-col rounded-b-2xl bg-white shadow-pop">
        <div className="flex shrink-0 items-center justify-between border-b border-line px-4 py-3">
          <Logo storeName={storeName} logo={logo} />
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="inline-flex size-10 items-center justify-center rounded-xl text-ink hover:bg-brand-50"
            aria-label="Close menu"
          >
            <FiX className="size-6" />
          </button>
        </div>

        <nav aria-label="Mobile" className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-3 py-4">
          <ul className="space-y-1">
            {siteConfig.mainNav.slice(0, 2).map((item) => {
              const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link href={item.href} onClick={onClose} className={linkClass(active)} aria-current={active ? "page" : undefined}>
                    {item.label}
                  </Link>
                </li>
              );
            })}
            {siteConfig.mainNav.slice(2).map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <li key={item.href}>
                  <Link href={item.href} onClick={onClose} className={linkClass(active)} aria-current={active ? "page" : undefined}>
                    {item.label}
                  </Link>
                </li>
              );
            })}
            <li>
              <Link href="/cart" onClick={onClose} className={linkClass(pathname === "/cart")}>
                Cart
              </Link>
            </li>
          </ul>
        </nav>

        <div className="shrink-0 space-y-2 border-t border-line p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <InstallPwaButton variant="mobile" onInstalled={onClose} />
          {chatUrl && (
            <a
              href={chatUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-12 items-center justify-center gap-2 rounded-xl bg-whatsapp font-semibold text-white"
            >
              <FaWhatsapp className="size-5" aria-hidden="true" /> Chat on WhatsApp
            </a>
          )}
          {supportPhone && (
            <a href={`tel:${supportPhone.replace(/[^\d+]/g, "")}`} className="flex h-11 items-center justify-center gap-2 rounded-xl border border-line text-sm font-medium text-ink">
              <FiPhone className="size-4" aria-hidden="true" /> {supportPhone}
            </a>
          )}
        </div>
      </div>
    </dialog>
  );
}
