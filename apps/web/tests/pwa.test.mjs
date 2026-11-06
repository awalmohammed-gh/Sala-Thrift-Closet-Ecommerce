import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { readFile } from "node:fs/promises";
import sharp from "sharp";
import { installPlatform, iosInAppName, iosSafariLayout, isAdminPath, isIosDevice, isIosSafari, isStandalone, safariOpenUrl } from "../src/lib/pwa.ts";

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, "navigator");

afterEach(() => {
  for (const [key, descriptor] of [["window", originalWindow], ["navigator", originalNavigator]]) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else delete globalThis[key];
  }
});

function browser({ userAgent = "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1", platform = "iPhone", maxTouchPoints = 5, standalone = false, displayMode = false } = {}) {
  const navigator = { userAgent, platform, maxTouchPoints, standalone };
  Object.defineProperty(globalThis, "navigator", { configurable: true, value: navigator });
  Object.defineProperty(globalThis, "window", { configurable: true, value: { navigator, matchMedia: () => ({ matches: displayMode }) } });
}

test("iPhone Safari gets installation guidance before installation", () => {
  browser();
  assert.equal(isIosDevice(), true);
  assert.equal(isIosSafari(), true);
  assert.equal(isStandalone(), false);
});

test("iPadOS desktop user agent is recognized without treating desktop Macs as iPads", () => {
  const userAgent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 Version/18.0 Safari/605.1.15";
  browser({ userAgent, platform: "MacIntel" });
  assert.equal(isIosSafari(), true);
  browser({ userAgent, platform: "MacIntel", maxTouchPoints: 0 });
  assert.equal(isIosDevice(), false);
  assert.equal(isIosSafari(), false);
});

test("both standalone signals suppress iOS installation invitations", () => {
  browser({ standalone: true });
  assert.equal(isStandalone(), true);
  assert.equal(isIosSafari(), false);
  browser({ displayMode: true });
  assert.equal(isStandalone(), true);
  assert.equal(isIosSafari(), false);
});

test("other iOS browsers are not incorrectly given automatic Safari instructions", () => {
  browser({ userAgent: "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 CriOS/130.0 Mobile/15E148 Safari/604.1" });
  assert.equal(isIosDevice(), true);
  assert.equal(isIosSafari(), false);
});

test("in-app browsers are told apart, because they can't add to the Home Screen", () => {
  const webkit = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148";
  for (const [token, name] of [["Instagram 340.0", "Instagram"], ["[FBAN/FBIOS;FBAV/480.0]", "Facebook"], ["musical_ly_37.0", "TikTok"], ["WhatsApp/2.24", "WhatsApp"]]) {
    browser({ userAgent: `${webkit} ${token}` });
    assert.equal(iosInAppName(), name);
    assert.equal(installPlatform(), "ios-in-app");
  }
  browser({ userAgent: webkit });
  assert.equal(iosInAppName(), "another app");
  assert.equal(installPlatform(), "ios-in-app");
});

test("real iPhone browsers are not mistaken for in-app browsers", () => {
  browser();
  assert.equal(iosInAppName(), null);
  assert.equal(installPlatform(), "ios-safari");
  browser({ userAgent: "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 CriOS/130.0 Mobile/15E148 Safari/604.1" });
  assert.equal(installPlatform(), "ios-browser");
  browser({ userAgent: "Mozilla/5.0 (Linux; Android 14) Instagram 340.0 Chrome/130.0 Mobile Safari/537.36", platform: "Linux" });
  assert.equal(iosInAppName(), null, "Android can install from its own prompts");
});

test("the guide matches where each Safari keeps its Share button", () => {
  browser();
  assert.equal(iosSafariLayout(), "phone-classic");
  browser({ userAgent: "Mozilla/5.0 (iPhone) AppleWebKit/605.1.15 Version/26.1 Mobile/15E148 Safari/604.1" });
  assert.equal(iosSafariLayout(), "phone-compact");
  browser({ userAgent: "Mozilla/5.0 (iPad) AppleWebKit/605.1.15 Version/26.1 Mobile/15E148 Safari/604.1", platform: "iPad" });
  assert.equal(iosSafariLayout(), "tablet");
});

test("Safari links keep the page and only change the scheme", () => {
  assert.equal(safariOpenUrl("https://store.example/"), "x-safari-https://store.example/");
  assert.equal(safariOpenUrl("http://localhost:3000/admin"), "x-safari-http://localhost:3000/admin");
});

test("the admin boundary includes login and dashboard routes, but not similar names", () => {
  for (const path of ["/admin", "/admin/login", "/admin/orders"]) assert.equal(isAdminPath(path), true);
  for (const path of ["/", "/administrator", "/administer", "/order-preview/token"]) assert.equal(isAdminPath(path), false);
});

test("both Apple icons are real opaque 180px PNGs with distinct artwork", async () => {
  const store = await readFile(new URL("../public/icons/store-apple-icon-180.png", import.meta.url));
  const admin = await readFile(new URL("../public/icons/admin-apple-icon-180.png", import.meta.url));
  for (const buffer of [store, admin]) {
    const metadata = await sharp(buffer).metadata();
    assert.equal(metadata.format, "png");
    assert.equal(metadata.width, 180);
    assert.equal(metadata.height, 180);
    assert.equal(metadata.hasAlpha, false);
  }
  assert.notDeepEqual(store, admin);
});

test("store and admin retain distinct standalone launch identities and correct scopes", async () => {
  const store = JSON.parse(await readFile(new URL("../public/manifest.json", import.meta.url)));
  const admin = JSON.parse(await readFile(new URL("../public/admin-manifest.json", import.meta.url)));
  assert.equal(store.start_url, "/");
  assert.equal(store.scope, "/");
  assert.equal(admin.start_url, "/admin");
  assert.equal(admin.scope, "/admin");
  assert.notEqual(store.id, admin.id);
  for (const manifest of [store, admin]) assert.equal(manifest.display, "standalone");
});
