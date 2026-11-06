"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { FiArrowDown, FiBookOpen, FiCheck, FiChevronLeft, FiChevronRight, FiCompass, FiCopy, FiHeart, FiMoreHorizontal, FiPlusSquare, FiShare, FiX } from "react-icons/fi";
import { useScrollLock } from "@/hooks/useScrollLock";
import { iosInAppName, iosSafariLayout, safariOpenUrl, type InstallPlatform, type IosSafariLayout, type PwaApp } from "@/lib/pwa";
import { cn } from "@/lib/utils";

interface IosInstallGuideProps {
  app: PwaApp;
  title: string;
  icon: string;
  platform: InstallPlatform;
  link: string;
  onClose: () => void;
  /** The shopper says it's on their Home Screen. Safari can't detect that for itself. */
  onDone: () => void;
}

/** What the shopper is looking for, drawn the way it looks on their phone. */
function Spot({ children }: { children: ReactNode }) {
  return <span className="flex size-8 items-center justify-center rounded-lg bg-tag text-brand-deep ring-2 ring-tag/40">{children}</span>;
}

function Dim({ children }: { children: ReactNode }) {
  return <span className="flex size-6 items-center justify-center text-slate-400">{children}</span>;
}

function ToolbarPicture({ layout }: { layout: IosSafariLayout }) {
  if (layout === "phone-compact") {
    return (
      <span className="flex items-center gap-2 rounded-full bg-slate-100 px-2 py-1">
        <Dim><FiChevronLeft /></Dim>
        <span className="h-5 min-w-0 flex-1 rounded-full bg-white" />
        <Spot><FiMoreHorizontal className="size-5" /></Spot>
      </span>
    );
  }
  return (
    <span className="flex items-center justify-between rounded-xl bg-slate-100 px-2 py-1">
      <Dim><FiChevronLeft /></Dim>
      <Dim><FiChevronRight /></Dim>
      <Spot><FiShare className="size-5" /></Spot>
      <Dim><FiBookOpen /></Dim>
      <Dim><FiCopy /></Dim>
    </span>
  );
}

function ShareListPicture() {
  return (
    <span className="block overflow-hidden rounded-xl bg-slate-100 text-xs">
      <span className="flex items-center justify-between px-3 py-1.5 text-slate-400">Add to Favourites<FiHeart className="size-3.5" /></span>
      <span className="flex items-center justify-between bg-tag px-3 py-1.5 font-bold text-brand-deep">Add to Home Screen<FiPlusSquare className="size-4" /></span>
    </span>
  );
}

function ConfirmPicture() {
  return (
    <span className="flex items-center justify-between rounded-xl bg-slate-100 px-3 py-1.5 text-xs">
      <span className="text-slate-400">Cancel</span>
      <span className="font-semibold text-slate-500">Add to Home Screen</span>
      <span className="rounded-md bg-tag px-2 py-0.5 font-bold text-brand-deep">Add</span>
    </span>
  );
}

function Step({ number, title, children }: { number: number; title: ReactNode; children?: ReactNode }) {
  return (
    <li className="rounded-2xl border border-line p-3">
      <p className="flex items-center gap-2 text-sm font-bold text-brand-deep">
        <span aria-hidden="true" className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-xs text-white">{number}</span>
        {title}
      </p>
      {children && <span aria-hidden="true" className="mt-2 block">{children}</span>}
    </li>
  );
}

/**
 * Apple doesn't let a website install itself, so this shows exactly where to tap. It sits at the
 * top of the screen and points down at Safari's own toolbar, which is the shopper's next tap.
 */
export function IosInstallGuide({ app, title, icon, platform, link, onClose, onDone }: IosInstallGuideProps) {
  const [copied, setCopied] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);
  useScrollLock(true);

  useEffect(() => {
    closeButton.current?.focus();
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  const inApp = platform === "ios-in-app";
  const safari = platform === "ios-safari";
  const layout = iosSafariLayout();
  const appName = app === "admin" ? "SALASTY Admin" : "SALASTY";
  const whereIsShare = layout === "tablet" ? "It's at the top right of Safari." : layout === "phone-compact" ? "Tap ••• at the bottom right, then Share." : "It's in the middle of the bar at the bottom.";

  const copy = () => {
    void navigator.clipboard?.writeText(link).then(() => setCopied(true), () => setCopied(false));
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="ios-install-title" className="fixed inset-0 z-[80] flex flex-col bg-navy/90 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
      <div className="mx-auto max-h-[calc(100dvh-6.5rem)] w-full max-w-md animate-pop-in overflow-y-auto overscroll-contain rounded-3xl bg-white p-4 shadow-pop">
        <div className="flex items-center gap-3">
          {/* Static public PNG; the guide opens in the browser and needs no image loader. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={icon} alt="" width={48} height={48} className="rounded-xl border border-line" />
          <div className="min-w-0 flex-1">
            <h2 id="ios-install-title" className="font-display text-lg font-bold leading-tight text-brand-deep">{inApp ? "Open in Safari first" : `Add ${appName} to your Home Screen`}</h2>
            <p className="text-xs text-muted">{inApp ? "iPhone only lets you add apps from Safari." : "Free. No App Store or password needed."}</p>
          </div>
          <button ref={closeButton} type="button" onClick={onClose} aria-label="Close" className="flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-xl text-muted hover:bg-cream"><FiX className="size-5" aria-hidden="true" /></button>
        </div>

        {inApp ? (
          <>
            <p className="mt-3 text-sm leading-relaxed text-ink">You opened this link inside {iosInAppName() ?? "another app"}, which can&apos;t add apps to your Home Screen.</p>
            <a href={safariOpenUrl(link)} className="mt-3 inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-white"><FiCompass className="size-5" aria-hidden="true" />Open in Safari</a>
            <button type="button" onClick={copy} className="mt-2 inline-flex min-h-12 w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-brand/30 bg-brand-50 px-4 text-sm font-bold text-brand">
              {copied ? <><FiCheck className="size-4" aria-hidden="true" />Link copied</> : <><FiCopy className="size-4" aria-hidden="true" />Copy link</>}
            </button>
            <p className="mt-3 rounded-xl bg-cream-200 p-3 text-xs leading-relaxed text-ink">Nothing happened? Tap <strong>Copy link</strong>, open <strong>Safari</strong>, paste it into the address bar, and this guide will take you from there. Some apps also have <strong>•••</strong> → <strong>Open in browser</strong>.</p>
          </>
        ) : (
          <>
            <ol className="mt-3 space-y-2">
              <Step number={1} title={safari ? (layout === "phone-compact" ? "Tap ••• then Share" : "Tap the Share button") : "Tap the Share button"}>
                {safari && <ToolbarPicture layout={layout} />}
              </Step>
              <Step number={2} title={<>Tap &ldquo;Add to Home Screen&rdquo;</>}><ShareListPicture /></Step>
              <Step number={3} title={<>Tap &ldquo;Add&rdquo;</>}><ConfirmPicture /></Step>
            </ol>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              {safari ? whereIsShare : "It's next to the address bar, or in the ••• menu."} Can&apos;t see &ldquo;Add to Home Screen&rdquo;? Scroll down the list, or tap <strong>More</strong>.
            </p>
            {!safari && <a href={safariOpenUrl(link)} className="mt-2 inline-flex min-h-11 w-full touch-manipulation items-center justify-center gap-2 rounded-xl border border-brand/30 bg-brand-50 px-4 text-sm font-bold text-brand"><FiCompass className="size-4" aria-hidden="true" />Use Safari instead</a>}
            <button type="button" onClick={onDone} className="mt-2 min-h-11 w-full touch-manipulation rounded-xl text-sm font-bold text-brand">I&apos;ve added it</button>
            <p className="sr-only">Apple does not let websites install themselves, so these steps are done in {title}&apos;s browser.</p>
          </>
        )}
      </div>

      {safari && layout !== "tablet" && (
        <p aria-hidden="true" className={cn("pointer-events-none absolute bottom-[max(0.5rem,env(safe-area-inset-bottom))] flex flex-col items-center gap-1 text-sm font-bold text-white", layout === "phone-compact" ? "right-3" : "inset-x-0")}>
          {layout === "phone-compact" ? "Tap ••• here" : "Tap Share here"}
          <FiArrowDown className="size-9 animate-bounce text-tag" />
        </p>
      )}
    </div>
  );
}
