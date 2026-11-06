import Link from "next/link";
import { cacheLife } from "next/cache";
import { FaWhatsapp } from "react-icons/fa6";
import { FiArrowUp, FiClock, FiMail, FiMapPin, FiPhone } from "react-icons/fi";
import { formatPhoneDisplay } from "@salasty-thrift-closet/shared";
import { Logo } from "@/components/brand/Logo";
import { getCategories, getSettings } from "@/lib/catalog";
import { supportChatUrl } from "@/lib/whatsapp";
import { STORE_TIME_ZONE } from "@/lib/time";
import { storefrontCategories } from "@/lib/storefrontCategories";
import { SocialLinks } from "./SocialLinks";

async function copyrightYear() {
  "use cache";
  cacheLife("days");
  return new Intl.DateTimeFormat("en-GH", { year: "numeric", timeZone: STORE_TIME_ZONE }).format(new Date());
}

export async function Footer() {
  const [settings, categories, year] = await Promise.all([getSettings(), getCategories(), copyrightYear()]);
  const chatUrl = supportChatUrl(settings);
  const footerCategories = storefrontCategories(categories);

  return (
    <footer className="mt-14 min-w-0 shrink-0 border-t border-white/10 bg-navy text-cream/85">
      <div className="container-page grid grid-cols-2 gap-x-6 gap-y-10 py-12 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,0.8fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1.3fr)]">
        <div className="col-span-2 space-y-4 lg:col-span-1">
          <Logo storeName={settings.storeName} logo={settings.logo} tone="dark" showTagline />
          <p className="max-w-xs text-sm leading-relaxed text-cream/70">
            {settings.storeDescription || "Thrift clothing for your everyday style, ordered easily on WhatsApp."}
          </p>
          <SocialLinks links={settings.socialLinks} className="gap-2" linkClassName="size-9 bg-white/10 text-cream hover:bg-tag hover:text-brand-deep" />
        </div>

        <div>
          <h2 className="mb-4 text-base font-bold text-white">Quick Links</h2>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/" className="hover:text-tag">Home</Link></li>
            <li><Link href="/shop" className="hover:text-tag">Shop</Link></li>
            <li><Link href="/about" className="hover:text-tag">About Us</Link></li>
            <li><Link href="/contact" className="hover:text-tag">Contact</Link></li>
          </ul>
        </div>

        {footerCategories.length > 0 && (
          <div>
            <h2 className="mb-4 text-base font-bold text-white">Categories</h2>
            <ul className="space-y-2.5 text-sm">
              {footerCategories.map((category) => (
                <li key={category.id}>
                  <Link href={`/categories/${category.slug}`} className="hover:text-tag">
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h2 className="mb-4 text-base font-bold text-white">Customer Care</h2>
          <ul className="space-y-2.5 text-sm">
            <li><Link href="/my-orders" className="hover:text-tag">Track order</Link></li>
            <li><Link href="/about#how-it-works" className="hover:text-tag">How ordering works</Link></li>
            <li><Link href="/cart" className="hover:text-tag">Your cart</Link></li>
          </ul>
        </div>

        <div>
          <h2 className="mb-4 text-base font-bold text-white">Contact Us</h2>
          <ul className="space-y-3 text-sm">
            {chatUrl && (
              <li>
                <a href={chatUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2.5 hover:text-tag">
                  <FaWhatsapp className="size-4 shrink-0 text-tag" aria-hidden="true" />
                  WhatsApp {formatPhoneDisplay(settings.whatsappNumber)}
                </a>
              </li>
            )}
            {settings.supportPhone && (
              <li>
                <a href={`tel:${settings.supportPhone.replace(/[^\d+]/g, "")}`} className="inline-flex items-center gap-2.5 hover:text-tag">
                  <FiPhone className="size-4 shrink-0 text-tag" aria-hidden="true" />
                  {settings.supportPhone}
                </a>
              </li>
            )}
            {settings.supportEmail && (
              <li>
                <a href={`mailto:${settings.supportEmail}`} className="inline-flex items-center gap-2.5 break-all hover:text-tag">
                  <FiMail className="size-4 shrink-0 text-tag" aria-hidden="true" />
                  {settings.supportEmail}
                </a>
              </li>
            )}
            {settings.address && (
              <li className="flex gap-2.5">
                <FiMapPin className="mt-0.5 size-4 shrink-0 text-tag" aria-hidden="true" />
                <span>{settings.address}</span>
              </li>
            )}
            {settings.openingHours && (
              <li className="flex gap-2.5">
                <FiClock className="mt-0.5 size-4 shrink-0 text-tag" aria-hidden="true" />
                <span className="whitespace-pre-line">{settings.openingHours}</span>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-2 py-5 text-xs text-cream/60 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {year} {settings.storeName}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <p>Prices are in Ghana Cedis (GHS). Orders are confirmed with you on WhatsApp.</p>
            <a href="#main" aria-label="Back to top" className="flex size-11 items-center justify-center rounded-full bg-tag text-brand-deep transition-colors hover:bg-white"><FiArrowUp className="size-5" aria-hidden="true" /></a>
          </div>
        </div>
      </div>
    </footer>
  );
}
