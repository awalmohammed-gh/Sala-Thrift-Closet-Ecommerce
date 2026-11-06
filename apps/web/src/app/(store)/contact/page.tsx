import type { Metadata } from "next";
import { Suspense } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { FiArrowRight, FiClock, FiMail, FiMapPin, FiPhone, FiPlus } from "react-icons/fi";
import { formatPhoneDisplay } from "@salasty-thrift-closet/shared";
import { getMetadataSettings, getSettings } from "@/lib/catalog";
import { supportChatUrl } from "@/lib/whatsapp";
import { RevealOnScroll } from "@/components/animations/RevealOnScroll";
import { ContactForm } from "@/components/contact/ContactForm";
import { PageHero } from "@/components/layout/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export async function generateMetadata(): Promise<Metadata> {
  const { storeName } = await getMetadataSettings();
  return {
    title: "Contact us",
    description: `Get in touch with ${storeName} on WhatsApp, phone or email.`,
    alternates: { canonical: "/contact" },
  };
}

const QUESTIONS = [
  { question: "How do I place an order?", answer: "Add what you love to your cart, fill in your details, and WhatsApp opens with your order written out. It reaches us when you tap send." },
  { question: "Do I need an account?", answer: "No. You can browse and order without signing up. Your cart and order history stay private to your browser." },
  { question: "Can I pick up my order?", answer: "Yes. Choose pickup or delivery to your doorstep at checkout. Pickup is free, and any delivery fee is shown before you send your order." },
  { question: "How do I pay?", answer: "Nothing is paid on this website. We confirm availability first, then agree how you'd like to pay on WhatsApp." },
];

async function ContactDetails() {
  const settings = await getSettings();
  const chatUrl = supportChatUrl(settings);
  const items = [
    chatUrl && { icon: FaWhatsapp, label: "WhatsApp", value: formatPhoneDisplay(settings.whatsappNumber), href: chatUrl, external: true, primary: true },
    settings.supportPhone && { icon: FiPhone, label: "Phone", value: settings.supportPhone, href: `tel:${settings.supportPhone.replace(/[^\d+]/g, "")}` },
    settings.supportEmail && { icon: FiMail, label: "Email", value: settings.supportEmail, href: `mailto:${settings.supportEmail}` },
    settings.address && { icon: FiMapPin, label: "Location", value: settings.address },
    settings.openingHours && { icon: FiClock, label: "Business hours", value: settings.openingHours },
  ].filter(Boolean) as { icon: typeof FiPhone; label: string; value: string; href?: string; external?: boolean; primary?: boolean }[];

  return (
    <>
      <ul className="stagger-in relative -mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fit,minmax(14rem,1fr))]">
        {items.length === 0 && <li className="rounded-2xl border border-line bg-white p-5 text-sm text-muted shadow-card">Contact details will be published here shortly.</li>}
        {items.map(({ icon: Icon, label, value, href, external, primary }) => {
          const body = (
            <>
              <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl", primary ? "bg-white/20 text-white" : "bg-brand-50 text-brand")}>
                <Icon className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className={cn("block text-xs font-semibold", primary ? "text-white/85" : "text-muted")}>{label}</span>
                <span className={cn("block whitespace-pre-line break-words font-bold", primary ? "text-white" : "text-brand-deep")}>{value}</span>
              </span>
              {primary && <span className="ml-auto inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-white">Chat now<FiArrowRight className="size-4" aria-hidden="true" /></span>}
            </>
          );
          const card = cn("flex h-full items-center gap-3 rounded-2xl p-4 shadow-card transition-colors", primary ? "bg-whatsapp hover:bg-[#0e7a40]" : "border border-line bg-white", href && !primary && "hover:border-brand/40");
          return <li key={label}>{href ? <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} className={card}>{body}</a> : <div className={card}>{body}</div>}</li>;
        })}
      </ul>

      <RevealOnScroll className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        {settings.whatsappNumber ? (
          <ContactForm whatsappNumber={settings.whatsappNumber} storeName={settings.storeName} />
        ) : (
          <div className="rounded-3xl border border-dashed border-line bg-white p-6 text-sm text-muted">Our WhatsApp line is being set up. Please use the phone or email details for now.</div>
        )}
        <section aria-labelledby="questions-heading">
          <h2 id="questions-heading" className="text-2xl font-bold tracking-[-0.03em] text-brand-deep">Quick answers</h2>
          <ul className="mt-3 space-y-2">
            {QUESTIONS.map(({ question, answer }) => (
              <li key={question}>
                <details className="group rounded-2xl bg-brand-50 px-4">
                  <summary className="flex min-h-13 cursor-pointer list-none items-center justify-between gap-3 text-sm font-bold text-brand-deep [&::-webkit-details-marker]:hidden">
                    {question}
                    <FiPlus className="size-4 shrink-0 transition-transform duration-200 group-open:rotate-45" aria-hidden="true" />
                  </summary>
                  <p className="pb-4 text-sm leading-relaxed text-muted">{answer}</p>
                </details>
              </li>
            ))}
          </ul>
        </section>
      </RevealOnScroll>
    </>
  );
}

export default function ContactPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url;
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "Contact us", item: `${siteUrl}/contact` },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <PageHero eyebrow="Contact" title="We're here to help" className="pb-8">
        <p className="mt-2 max-w-[70%] text-sm text-blue-50 sm:max-w-xl sm:text-lg">Questions about a product, delivery or your order? Reach us the way that suits you.</p>
      </PageHero>
      <div className="container-page">
        <Suspense fallback={<div className="skeleton relative -mt-8 h-80 rounded-2xl" />}>
          <ContactDetails />
        </Suspense>
      </div>
    </>
  );
}
