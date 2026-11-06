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

/** Apps whose built-in browser can't add to the Home Screen. Their pages say who they are in the user agent. */
const IN_APP_BROWSERS: [RegExp, string][] = [
  [/Instagram/i, "Instagram"],
  [/FBAN|FBAV|FB_IAB|FBIOS/i, "Facebook"],
  [/musical_ly|TikTok|BytedanceWebview/i, "TikTok"],
  [/Snapchat/i, "Snapchat"],
  [/WhatsApp/i, "WhatsApp"],
  [/Twitter/i, "X"],
  [/LinkedInApp/i, "LinkedIn"],
  [/\bLine\//, "LINE"],
];

/** The app whose built-in browser this is. "another app" when it can only be told from a missing Safari token. */
export function iosInAppName(): string | null {
  if (typeof navigator === "undefined" || !isIosDevice()) return null;
  const known = IN_APP_BROWSERS.find(([pattern]) => pattern.test(navigator.userAgent));
  if (known) return known[1];
  return /Safari/i.test(navigator.userAgent) ? null : "another app";
}

export type IosSafariLayout = "phone-classic" | "phone-compact" | "tablet";

/** Where Safari keeps its Share button. From Safari 26 the phone toolbar tucks it behind a ••• menu. */
export function iosSafariLayout(): IosSafariLayout {
  if (typeof navigator === "undefined") return "phone-classic";
  if (!/iPhone|iPod/i.test(navigator.userAgent)) return "tablet";
  const version = Number(/Version\/(\d+)/.exec(navigator.userAgent)?.[1] ?? 0);
  return version >= 26 ? "phone-compact" : "phone-classic";
}

/** A link that asks iOS to open the page in Safari. Not every app allows it, so always offer Copy link too. */
export function safariOpenUrl(url: string): string {
  return url.replace(/^(https?):\/\//, "x-safari-$1://");
}

export function isAndroidDevice(): boolean {
  return typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent);
}

/** Which "add to Home Screen" steps match this device and browser. */
export type InstallPlatform = "ios-safari" | "ios-browser" | "ios-in-app" | "android" | "android-samsung" | "desktop";

export function installPlatform(): InstallPlatform {
  if (typeof navigator === "undefined") return "desktop";
  if (isIosDevice()) return iosInAppName() ? "ios-in-app" : isIosSafari() ? "ios-safari" : "ios-browser";
  if (isAndroidDevice()) return /SamsungBrowser/i.test(navigator.userAgent) ? "android-samsung" : "android";
  return "desktop";
}

export const PWA_APPS = {
  store: { title: "SALASTY THRIFT CLOSET", manifest: "/manifest.json", icon: "/icons/store-apple-icon-180.png", statusBar: "default" },
  admin: { title: "SALASTY Admin", manifest: "/admin-manifest.json", icon: "/icons/admin-apple-icon-180.png", statusBar: "black-translucent" },
} as const;
