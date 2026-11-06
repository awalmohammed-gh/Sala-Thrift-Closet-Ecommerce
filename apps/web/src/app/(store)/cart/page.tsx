import type { Metadata } from "next";
import { Suspense } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { FiHeadphones, FiShield, FiStar, FiTruck } from "react-icons/fi";
import { StaggerContainer } from "@/components/animations/StaggerContainer";
import { CartView } from "@/components/cart/CartView";
import { PageHero } from "@/components/layout/PageHero";
import { getSettings } from "@/lib/catalog";
import { supportChatUrl, whatsappOrderingNotice } from "@/lib/whatsapp";

export const metadata: Metadata = {
  title: "Your cart",
  robots: { index: false, follow: false },
  alternates: { canonical: "/cart" },
};

const PROMISES = [
  { icon: FiTruck, title: "Pickup or Delivery", text: "Your choice at checkout" },
  { icon: FiShield, title: "No Online Payment", text: "We confirm with you first" },
  { icon: FiHeadphones, title: "Quick Support", text: "via WhatsApp" },
  { icon: FiStar, title: "Trendy Fashion", text: "Picked one by one" },
];

async function CartLoader() {
  const settings = await getSettings();
  const notice = whatsappOrderingNotice(settings);
  const chatUrl = supportChatUrl(settings, `Hello ${settings.storeName}, I need help with my cart.`);
  return (
    <>
      <CartView whatsappEnabled={!notice} whatsappNotice={notice} deliveryFee={settings.deliveryFee} />
      {chatUrl && (
        <a href={chatUrl} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp (opens in a new tab)" className="fixed bottom-24 right-4 z-30 flex size-13 items-center justify-center rounded-full bg-whatsapp text-white shadow-pop transition-colors hover:bg-[#0e7a40] md:bottom-6 md:right-6 md:size-14">
          <FaWhatsapp className="size-7" aria-hidden="true" />
        </a>
      )}
    </>
  );
}

export default function CartPage() {
  return (
    <>
      <PageHero eyebrow="Your Shopping Cart" title="Review Your Items" image="/images/editorial/cart-bags.webp" imagePosition="45% 50%">
        <p className="mt-2 max-w-[58%] text-sm text-blue-50 sm:max-w-none sm:text-lg">Complete your order via WhatsApp in just one click!</p>
        <span aria-hidden="true" className="mt-3 h-1 w-28 rounded-full bg-tag" />
      </PageHero>

      <div className="container-page pt-6 sm:pt-8">
        <Suspense
          fallback={
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]" aria-hidden="true">
              <div className="skeleton h-96 rounded-2xl" />
              <div className="skeleton h-96 rounded-2xl" />
            </div>
          }
        >
          <CartLoader />
        </Suspense>

        <StaggerContainer items=":scope > ul > li">
          <ul className="mt-8 grid grid-cols-2 gap-x-3 gap-y-4 rounded-2xl bg-brand-50 p-4 sm:p-5 lg:grid-cols-4 lg:divide-x lg:divide-brand-100" aria-label="Why shop with us">
            {PROMISES.map(({ icon: Icon, title, text }) => (
              <li key={title} className="flex min-w-0 items-center gap-3 lg:justify-center lg:px-4">
                <Icon className="size-7 shrink-0 text-brand-deep" aria-hidden="true" />
                <span className="min-w-0">
                  <span className="block text-sm font-bold text-brand-deep">{title}</span>
                  <span className="block text-xs text-muted sm:text-sm">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </StaggerContainer>
      </div>
    </>
  );
}
