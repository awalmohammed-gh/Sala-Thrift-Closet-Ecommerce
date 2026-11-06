import type { Metadata } from "next";
import { Suspense } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { FiArrowRight } from "react-icons/fi";
import { RevealOnScroll } from "@/components/animations/RevealOnScroll";
import { StaggerContainer } from "@/components/animations/StaggerContainer";
import { Benefits } from "@/components/home/Benefits";
import { PageHero } from "@/components/layout/PageHero";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteConfig } from "@/config/site";
import { getCategories, getMetadataSettings, getSettings } from "@/lib/catalog";
import { marketAisles } from "@/lib/productDisplay";
import { supportChatUrl } from "@/lib/whatsapp";
import Link from "next/link";

export async function generateMetadata(): Promise<Metadata> {
  const { storeName } = await getMetadataSettings();
  return {
    title: "About us",
    description: `${storeName} is a Ghanaian thrift store selling many kinds of products. Learn how ordering on WhatsApp works.`,
    alternates: { canonical: "/about" },
  };
}

const STEPS = [
  { title: "Browse and pick", text: "Find what you love and choose your size and colour where available." },
  { title: "Add your details", text: "Tell us your name, your WhatsApp number, and whether you'd like pickup or delivery." },
  { title: "Send on WhatsApp", text: "WhatsApp opens with your full order written out, including an order reference. Tap send." },
  { title: "We confirm with you", text: "Our team replies to confirm availability, delivery or pickup, and how you'd like to pay." },
];

async function AboutIntro() {
  const settings = await getSettings();
  return (
    <p className="mt-3 max-w-[62%] text-sm leading-relaxed text-blue-50 sm:max-w-md sm:text-lg lg:max-w-xl">
      {settings.storeDescription ||
        `${settings.storeName} brings many kinds of products together in one friendly store.`}
    </p>
  );
}

/** The admin's live categories, so a new kind of product shows up here once it has stock. */
async function AboutRange() {
  const aisles = marketAisles(await getCategories());
  if (!aisles.length) return null;
  return (
    <ul className="mt-5 flex flex-wrap gap-2">
      {aisles.map((aisle) => (
        <li key={aisle.id}>
          <Link href={`/categories/${aisle.slug}`} className="inline-flex min-h-11 items-center rounded-full bg-brand-50 px-4 text-sm font-bold text-brand-deep transition-colors hover:bg-brand-100">{aisle.name}</Link>
        </li>
      ))}
    </ul>
  );
}

async function AboutCta() {
  const settings = await getSettings();
  const chatUrl = supportChatUrl(settings, `Hello ${settings.storeName}!`);
  return (
    <div className="flex flex-wrap gap-3">
      <Link href="/shop" className="group inline-flex min-h-12 items-center gap-2 rounded-full bg-brand-deep px-6 text-sm font-bold text-white transition-colors hover:bg-brand">
        Start shopping<FiArrowRight className="size-4 transition-transform duration-200 ease-out-soft group-hover:translate-x-1" aria-hidden="true" />
      </Link>
      {chatUrl && (
        <a href={chatUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-brand-deep transition-colors hover:bg-brand-50">
          <FaWhatsapp className="size-5 text-whatsapp" aria-hidden="true" />Say hello on WhatsApp
        </a>
      )}
    </div>
  );
}

export default function AboutPage() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || siteConfig.url;
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteUrl },
      { "@type": "ListItem", position: 2, name: "About us", item: `${siteUrl}/about` },
    ],
  };

  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <PageHero eyebrow="About Us" title="Thrift style, with a personal touch." image="/images/editorial/shop-rack.webp" imagePosition="60% 50%">
        <Suspense fallback={<div className="mt-3 h-14 w-full max-w-xl rounded-lg bg-white/10" />}>
          <AboutIntro />
        </Suspense>
      </PageHero>

      <section className="container-page py-10 sm:py-14" aria-labelledby="range-heading">
        <RevealOnScroll>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">What we sell</p>
          <h2 id="range-heading" className="mt-1.5 text-3xl font-bold tracking-[-0.03em] text-brand-deep sm:text-4xl">One store, many kinds of products</h2>
          <p className="mt-2 max-w-2xl text-muted">We don&apos;t sell just one thing. Our website brings many kinds of products together, so you can shop them all in one place and send everything in a single WhatsApp order.</p>
          <Suspense fallback={<div className="skeleton mt-5 h-11 w-full max-w-md rounded-full" />}>
            <AboutRange />
          </Suspense>
        </RevealOnScroll>
      </section>

      <Benefits />

      <section id="how-it-works" className="scroll-mt-24 bg-slate-50 py-10 sm:py-14" aria-labelledby="how-heading">
        <div className="container-page">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">Simple from start to finish</p>
          <h2 id="how-heading" className="mt-1.5 text-3xl font-bold tracking-[-0.03em] text-brand-deep sm:text-4xl">How ordering works</h2>
          <p className="mt-2 max-w-2xl text-muted">No account, no card details and no app downloads. Just the WhatsApp you already use.</p>
          <StaggerContainer items=":scope > ol > li" stagger={0.1}>
          <ol className="relative mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
            <span aria-hidden="true" className="absolute inset-x-[12%] top-5 hidden h-0.5 bg-brand-100 lg:block" />
            {STEPS.map((step, index) => (
              <li key={step.title} className="relative flex gap-4 lg:block">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-tag font-display font-bold text-brand-deep ring-4 ring-slate-50">{index + 1}</span>
                <div className="lg:mt-4">
                  <h3 className="text-lg font-bold text-brand-deep">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-muted">{step.text}</p>
                </div>
              </li>
            ))}
          </ol>
          </StaggerContainer>
        </div>
      </section>

      <section className="container-page pt-10 sm:pt-14">
        <RevealOnScroll className="flex flex-col gap-5 rounded-3xl bg-tag p-6 sm:p-10 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-[-0.03em] text-brand-deep sm:text-3xl">Ready to find something good?</h2>
            <p className="mt-1 text-brand-deep">Fresh pieces land every week.</p>
          </div>
          <Suspense fallback={null}>
            <AboutCta />
          </Suspense>
        </RevealOnScroll>
      </section>
    </>
  );
}
