import { FaWhatsapp } from "react-icons/fa";
import { FiTruck } from "react-icons/fi";
import { getSettings } from "@/lib/catalog";
import { PushPrompt } from "@/components/notifications/PushPrompt";
import { Navbar } from "./Navbar";
import { SocialLinks } from "./SocialLinks";

/** Load branding and contact settings for the storefront header. */
export async function SiteHeader() {
  const settings = await getSettings();
  return (
    <>
      <div className={settings.announcement ? "bg-navy text-white" : "hidden bg-navy text-white sm:block"}>
        <div className="container-page flex min-h-9 items-center justify-between gap-4 py-1.5 text-xs font-medium">
          {settings.announcement
            ? <p className="min-w-0 sm:text-[13px]">{settings.announcement}</p>
            : (
              <ul className="flex items-center gap-6">
                <li className="inline-flex items-center gap-2"><FiTruck className="size-4 text-tag" aria-hidden="true" />Delivery or pickup</li>
                <li className="inline-flex items-center gap-2"><FaWhatsapp className="size-4 text-tag" aria-hidden="true" />Order on WhatsApp</li>
              </ul>
            )}
          <SocialLinks links={settings.socialLinks} className="hidden shrink-0 gap-1 sm:flex" linkClassName="size-6 hover:text-tag" />
        </div>
      </div>
      <Navbar
        storeName={settings.storeName}
        logo={settings.logo}
        notificationsEnabled={settings.notifications.enabled}
      />
      {settings.notifications.enabled && <PushPrompt storeName={settings.storeName} />}
    </>
  );
}

export function SiteHeaderSkeleton() {
  return (
    <div className="sticky top-0 z-40 border-b border-line bg-white" aria-hidden="true">
      <div className="container-page flex flex-wrap items-center gap-5 py-2 md:flex-nowrap md:gap-8">
        <div className="skeleton size-11 shrink-0 sm:size-12" />
        <div className="skeleton hidden h-6 w-80 md:block" />
        <div className="skeleton ml-auto hidden h-11 w-80 rounded-full lg:block" />
        <div className="skeleton ml-auto size-11 shrink-0 lg:ml-0" />
      </div>
    </div>
  );
}
