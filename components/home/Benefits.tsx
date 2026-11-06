import { FaWhatsapp } from "react-icons/fa";
import { StaggerContainer } from "@/components/animations/StaggerContainer";
import { FiLayers, FiMapPin, FiUserCheck } from "react-icons/fi";

const BENEFITS = [
  { icon: FiLayers, title: "Find your kind of style", text: "Clothing with a little more personality, picked one by one." },
  { icon: FiUserCheck, title: "Keep shopping simple", text: "Browse and order without an account." },
  { icon: FaWhatsapp, title: "Say hello on WhatsApp", text: "Confirm your finds with a real person." },
  { icon: FiMapPin, title: "Choose how it gets to you", text: "Pick up from us or have it delivered to your doorstep." },
];

export function Benefits() {
  return (
    <section className="container-page py-10 sm:py-14" aria-labelledby="benefits-heading">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-brand">Good finds. Easy shopping.</p>
      <h2 id="benefits-heading" className="mt-1.5 max-w-xl text-3xl font-bold tracking-[-0.03em] text-brand-deep sm:text-4xl">A closet with a personal touch.</h2>
      <StaggerContainer items=":scope > ul > li">
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {BENEFITS.map(({ icon: Icon, title, text }, index) => (
          <li key={title} className={index === 0 ? "rounded-3xl bg-navy p-6 text-white" : "rounded-3xl bg-brand-50 p-6"}>
            <span className={index === 0 ? "flex size-12 items-center justify-center rounded-2xl bg-tag text-brand-deep" : "flex size-12 items-center justify-center rounded-2xl bg-white text-brand shadow-sm"}>
              <Icon className="size-6" aria-hidden="true" />
            </span>
            <h3 className={index === 0 ? "mt-8 text-lg font-bold text-white" : "mt-8 text-lg font-bold text-brand-deep"}>{title}</h3>
            <p className={index === 0 ? "mt-1.5 text-sm leading-relaxed text-blue-50" : "mt-1.5 text-sm leading-relaxed text-muted"}>{text}</p>
          </li>
        ))}
      </ul>
      </StaggerContainer>
    </section>
  );
}
