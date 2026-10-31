import { DEFAULT_NOTIFICATION_SETTINGS, DEFAULT_STOREFRONT_SETTINGS, type StoreSettingsDTO } from "@salasty-thrift-closet/shared";

const stripSlash = (url: string) => url.replace(/\/+$/, "");

export const siteConfig = {
  name: "SALASTY THRIFT CLOSET",
  tagline: "Thrift finds for your everyday style",
  description:
    "Shop thrift clothing, from tops and shirts to jeans, shorts, hoodies and jackets at SALASTY THRIFT CLOSET. Order in minutes on WhatsApp — no account needed.",
  url: stripSlash(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  locale: "en_GH",
  currency: "GHS",
  mainNav: [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    { label: "My orders", href: "/my-orders" },
  ],
} as const;

/** Used when the API cannot be reached, so the layout still renders honestly. */
export const fallbackSettings: StoreSettingsDTO = {
  storeName: siteConfig.name,
  storeDescription: siteConfig.description,
  logo: null,
  favicon: null,
  whatsappNumber: "",
  supportPhone: "",
  supportEmail: "",
  address: "",
  openingHours: "",
  announcement: "",
  socialLinks: { facebook: "", instagram: "", tiktok: "", x: "", youtube: "" },
  whatsappOrderingEnabled: true,
  whatsappGreeting: "",
  whatsappSupportMessage: "",
  notifications: { ...DEFAULT_NOTIFICATION_SETTINGS },
  storefront: { ...DEFAULT_STOREFRONT_SETTINGS },
  updatedAt: null,
};
