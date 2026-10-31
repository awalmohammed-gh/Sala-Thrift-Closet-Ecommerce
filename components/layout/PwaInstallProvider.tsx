"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore, type ReactNode } from "react";
import { FiCheck, FiCopy, FiDownload, FiGlobe, FiLink, FiMenu, FiMoreVertical, FiPlusSquare, FiShare } from "react-icons/fi";
import { Modal } from "@/components/ui/Modal";
import { installPlatform, isAdminPath, isStandalone, PWA_APPS, type InstallPlatform, type PwaApp } from "@/lib/pwa";

interface InstallEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface InstallContextValue {
  standalone: boolean;
  platform: InstallPlatform;
  /** True once this device has installed the app, even when the site is later opened in the browser. */
  isInstalled: (app: PwaApp) => boolean;
  /** Showing `app` inside the other installed app's window, where it cannot be installed. */
  inOtherApp: (app: PwaApp) => boolean;
  guideOpen: boolean;
  /** The browser's own install dialog is ready (Chrome, Edge, Samsung Internet). */
  canPrompt: (app: PwaApp) => boolean;
  /** Installing is possible here: by the native dialog, or by following the guide on any phone. */
  canOffer: (app: PwaApp) => boolean;
  install: (app: PwaApp) => Promise<boolean>;
}

const InstallContext = createContext<InstallContextValue | null>(null);
const emptySubscribe = () => () => {};
const serverSnapshot = () => false;
const serverPlatform = (): InstallPlatform => "desktop";

/*
 * Installed apps are remembered per device ("store", "admin"), so the download button stays
 * hidden when the site is opened in the browser after installing. Chrome only offers its
 * install prompt for apps that are not installed, so that prompt clears the memory again.
 * Memory keeps the state for this visit when storage is blocked.
 */
const INSTALLED_KEY = "salasty:installed-apps";
const installedListeners = new Set<() => void>();
let installedInMemory: string | null = null;

function readInstalled(): string {
  if (installedInMemory !== null) return installedInMemory;
  try { return localStorage.getItem(INSTALLED_KEY) ?? ""; } catch { return ""; }
}

function rememberInstalled(app: PwaApp, installed: boolean) {
  const apps = new Set(readInstalled().split(",").filter(Boolean));
  if (apps.has(app) === installed) return;
  if (installed) apps.add(app);
  else apps.delete(app);
  installedInMemory = [...apps].sort().join(",");
  try { localStorage.setItem(INSTALLED_KEY, installedInMemory); } catch { /* Remember for this visit only. */ }
  installedListeners.forEach((notify) => notify());
}

function subscribeInstalled(notify: () => void) {
  installedListeners.add(notify);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== INSTALLED_KEY) return;
    installedInMemory = null;
    notify();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    installedListeners.delete(notify);
    window.removeEventListener("storage", onStorage);
  };
}

const currentApp = (): PwaApp => isAdminPath(window.location.pathname) ? "admin" : "store";

/*
 * The installed app this window was launched as. A Home Screen window opens on its own app,
 * so the first page of the session decides. Moving between store and admin later stays in
 * the same window, and must not count as the other app being installed.
 */
const RUNNING_KEY = "salasty:running-app";

function readRunningApp(): PwaApp | "" {
  if (!isStandalone()) return "";
  try {
    const saved = sessionStorage.getItem(RUNNING_KEY);
    if (saved === "store" || saved === "admin") return saved;
    const app = currentApp();
    sessionStorage.setItem(RUNNING_KEY, app);
    return app;
  } catch {
    return currentApp();
  }
}

function subscribeDisplayMode(notify: () => void) {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", notify);
  window.addEventListener("pageshow", notify);
  return () => {
    media.removeEventListener("change", notify);
    window.removeEventListener("pageshow", notify);
  };
}

interface GuideStep { badge: ReactNode; title: ReactNode; text: ReactNode }

const pill = (label: string) => <span className="rounded-lg bg-brand px-2 py-1 text-xs font-bold text-white">{label}</span>;

/** Three taps per platform, worded the way each browser labels its buttons. */
function guideFor(platform: InstallPlatform, title: string): { steps: GuideStep[]; note?: ReactNode } {
  switch (platform) {
    case "ios-safari":
    case "ios-browser":
      return {
        steps: [
          {
            badge: <FiShare className="size-5" />,
            title: "Tap the Share button",
            text: platform === "ios-safari"
              ? <>The square with an arrow, at the bottom of Safari. Don&apos;t see it? Tap <strong>•••</strong> first.</>
              : <>In Chrome it&apos;s next to the address bar. In other browsers, look in the <strong>•••</strong> menu.</>,
          },
          { badge: <FiPlusSquare className="size-5" />, title: <>Tap &ldquo;Add to Home Screen&rdquo;</>, text: "Scroll down the list if you don't see it." },
          { badge: pill("Add"), title: <>Tap &ldquo;Add&rdquo;</>, text: <>{title} appears on your Home Screen like any other app.</> },
        ],
        note: platform === "ios-browser" ? "Can't find it? Open this page in Safari and try again." : undefined,
      };
    case "android-samsung":
      return {
        steps: [
          { badge: <FiMenu className="size-5" />, title: "Tap the menu", text: "The three lines at the bottom-right of the screen." },
          { badge: <FiPlusSquare className="size-5" />, title: <>Tap &ldquo;Add page to&rdquo; → &ldquo;Home screen&rdquo;</>, text: "Some versions say “Install app” instead." },
          { badge: pill("Add"), title: <>Tap &ldquo;Add&rdquo;</>, text: <>{title} appears on your Home screen.</> },
        ],
      };
    case "android":
      return {
        steps: [
          { badge: <FiMoreVertical className="size-5" />, title: "Tap the menu", text: "The three dots at the top-right of Chrome." },
          { badge: <FiDownload className="size-5" />, title: <>Tap &ldquo;Install app&rdquo;</>, text: "Some phones say “Add to Home screen”." },
          { badge: pill("Install"), title: <>Tap &ldquo;Install&rdquo;</>, text: <>{title} appears on your Home screen and in your app list.</> },
        ],
      };
    default:
      return {
        steps: [
          { badge: <FiDownload className="size-5" />, title: "Click the install icon", text: "At the right end of the address bar in Chrome or Edge." },
          { badge: pill("Install"), title: <>Click &ldquo;Install&rdquo;</>, text: <>{title} opens in its own window.</> },
        ],
        note: <>No icon? Open the browser menu and choose <strong>Install</strong>. In Safari on a Mac, choose <strong>File → Add to Dock</strong>.</>,
      };
  }
}

/** Inside one installed app, the other app has to be installed from the browser. */
function openInBrowserGuide(link: string): { steps: GuideStep[]; note?: ReactNode } {
  return {
    steps: [
      { badge: <FiLink className="size-5" />, title: "Copy the link", text: <span className="break-all">{link}</span> },
      { badge: <FiGlobe className="size-5" />, title: "Open it in your browser", text: "Chrome on Android, or Safari on iPhone." },
      { badge: <FiDownload className="size-5" />, title: "Install from there", text: "Tap the download button on the page and follow the steps." },
    ],
  };
}

/** Capture beforeinstallprompt once, before async headers and their buttons mount. */
export function PwaInstallProvider({ children }: { children: ReactNode }) {
  const standalone = useSyncExternalStore(subscribeDisplayMode, isStandalone, serverSnapshot);
  const platform = useSyncExternalStore(emptySubscribe, installPlatform, serverPlatform);
  const installedApps = useSyncExternalStore(subscribeInstalled, readInstalled, () => "");
  const isInstalled = (app: PwaApp) => installedApps.split(",").includes(app);
  const runningApp = useSyncExternalStore(subscribeDisplayMode, readRunningApp, () => "" as const);
  const inOtherApp = (app: PwaApp) => standalone && runningApp !== "" && runningApp !== app;
  const [deferred, setDeferred] = useState<{ app: PwaApp; event: InstallEvent } | null>(null);
  const [guideApp, setGuideApp] = useState<PwaApp | null>(null);
  const [copied, setCopied] = useState(false);

  // Launched from the Home Screen, or Chrome reports the app as installed: remember it.
  useEffect(() => {
    if (standalone) {
      if (runningApp) rememberInstalled(runningApp, true);
      return;
    }
    const app = currentApp();
    const nav = navigator as Navigator & { getInstalledRelatedApps?: () => Promise<unknown[]> };
    if (!nav.getInstalledRelatedApps) return;
    let cancelled = false;
    nav.getInstalledRelatedApps().then((apps) => { if (!cancelled && apps.length) rememberInstalled(app, true); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [standalone, runningApp]);

  useEffect(() => {
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      const app = currentApp();
      rememberInstalled(app, false); // Chrome only offers to install apps that are not installed.
      setDeferred({ app, event: event as InstallEvent });
    };
    const installed = () => {
      rememberInstalled(currentApp(), true);
      setDeferred(null);
      setGuideApp(null);
    };
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", installed);
    return () => {
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", installed);
    };
  }, []);

  async function install(app: PwaApp): Promise<boolean> {
    if (isInstalled(app)) return false;
    // Phones only install from the browser: inside the other app, explain how to get there.
    if (standalone) {
      if (inOtherApp(app)) setGuideApp(app);
      return false;
    }
    if (deferred?.app === app) {
      const event = deferred.event;
      setDeferred(null); // A native install event can be used only once.
      try {
        await event.prompt();
        const accepted = (await event.userChoice).outcome === "accepted";
        if (accepted) rememberInstalled(app, true);
        return accepted;
      } catch {
        setGuideApp(app);
        return false;
      }
    }
    setGuideApp(app);
    return false;
  }

  const canPrompt = (app: PwaApp) => deferred?.app === app;
  const canOffer = (app: PwaApp) => !isInstalled(app) && (standalone ? inOtherApp(app) : canPrompt(app) || platform !== "desktop");
  const config = guideApp ? PWA_APPS[guideApp] : null;
  const fromOtherApp = guideApp !== null && inOtherApp(guideApp);
  const appLink = guideApp ? `${window.location.origin}${guideApp === "admin" ? "/admin" : "/"}` : "";
  const guide = config ? (fromOtherApp ? openInBrowserGuide(appLink) : guideFor(platform, config.title)) : null;
  const closeGuide = () => {
    setGuideApp(null);
    setCopied(false);
  };
  const copyLink = () => {
    void navigator.clipboard?.writeText(appLink).then(() => setCopied(true), () => setCopied(false));
  };

  return (
    <InstallContext.Provider value={{ standalone, platform, isInstalled, inOtherApp, guideOpen: guideApp !== null, canPrompt, canOffer, install }}>
      {children}
      <Modal
        open={guideApp !== null}
        onClose={closeGuide}
        title={guideApp === "admin" ? "Get the Admin app" : "Get the SALASTY app"}
        description={fromOtherApp
          ? `You're in the ${runningApp === "admin" ? "Admin" : "SALASTY"} app. Each app is installed separately from your browser.`
          : `${guide?.steps.length === 2 ? "Two" : "Three"} quick steps. No app store needed.`}
        size="sm"
      >
        {config && guide && (
          <div className="pb-[env(safe-area-inset-bottom)]">
            <div className="mb-5 flex items-center gap-3 rounded-2xl bg-brand-50 p-3">
              {/* Static public PNGs; native img avoids adding an image loader dependency to the guide. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={config.icon} alt="" width={52} height={52} className="rounded-xl border border-line" />
              <div><p className="font-semibold text-ink">{config.title}</p><p className="text-xs text-muted">{guideApp === "admin" ? "Your staff portal, one tap away" : "Your store, one tap away"}</p></div>
            </div>
            <ol className="space-y-3">
              {guide.steps.map((step, index) => (
                <li key={index} className="flex items-center gap-3 rounded-2xl border border-line p-3">
                  <span aria-hidden="true" className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">{index + 1}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink">{step.title}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">{step.text}</p>
                  </div>
                  <span aria-hidden="true" className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-cream-200 text-brand">{step.badge}</span>
                </li>
              ))}
            </ol>
            {guide.note && <p className="mt-4 rounded-xl bg-cream-200 p-3 text-xs leading-relaxed text-ink">{guide.note}</p>}
            {fromOtherApp && (
              <button type="button" onClick={copyLink} className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand/30 bg-brand-50 px-4 text-sm font-semibold text-brand transition-colors hover:bg-brand-100">
                {copied ? <><FiCheck className="size-4" aria-hidden="true" />Link copied</> : <><FiCopy className="size-4" aria-hidden="true" />Copy link</>}
              </button>
            )}
            <p className="mt-4 text-xs leading-relaxed text-muted">
              {guideApp === "admin" ? "Then open it from your Home Screen and sign in with your staff account." : "Then open it from your Home Screen."}
              {(platform === "ios-safari" || platform === "ios-browser") && " Order alerts work from inside the installed app on iOS 16.4 or later."}
            </p>
            <button type="button" onClick={closeGuide} className="mt-5 min-h-11 w-full rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-deep">Got it</button>
          </div>
        )}
      </Modal>
    </InstallContext.Provider>
  );
}

export function usePwaInstall() {
  const context = useContext(InstallContext);
  if (!context) throw new Error("usePwaInstall must be used inside PwaInstallProvider");
  return context;
}
