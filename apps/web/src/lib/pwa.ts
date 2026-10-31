export type PwaApp = "store" | "admin";

export function isAdminPath(pathname: string): boolean {
  return pathname === "/admin" || pathname.startsWith("/admin/");
}

export function isIosDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  return (window.navigator as Navigator & { standalone?: boolean }).standalone === true
    || window.matchMedia("(display-mode: standalone)").matches;
}

/** Safari, including iPadOS's desktop user agent, before Home Screen installation. */
export function isIosSafari(): boolean {
  return typeof window !== "undefined" && isIosDevice() && !isStandalone()
    && /Safari/i.test(navigator.userAgent)
    && !/CriOS|FxiOS|EdgiOS|OPiOS|DuckDuckGo|GSA/i.test(navigator.userAgent);
}

export function isAndroidDevice(): boolean {
  return typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
}

/** Which "add to Home Screen" steps match this device and browser. */
export type InstallPlatform = "ios-safari" | "ios-browser" | "android" | "android-samsung" | "desktop";

export function installPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "desktop";
  if (isIosDevice()) return isIosSafari() ? "ios-safari" : "ios-browser";
  if (isAndroidDevice()) return /SamsungBrowser/i.test(navigator.userAgent) ? "android-samsung" : "android";
  return "desktop";
}

export const PWA_APPS = {
  store: { title: "SALASTY THRIFT CLOSET", manifest: "/manifest.json", icon: "/icons/store-apple-icon-180.png", statusBar: "default" },
  admin: { title: "SALASTY Admin", manifest: "/admin-manifest.json", icon: "/icons/admin-apple-icon-180.png", statusBar: "black-translucent" },
} as const;
