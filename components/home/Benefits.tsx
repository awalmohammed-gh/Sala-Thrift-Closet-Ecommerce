import { FaWhatsapp } from "react-icons/fa";
import { FiLayers, FiMapPin, FiUserCheck } from "react-icons/fi";

const BENEFITS = [
  { icon: FiLayers, title: "Find your kind of style", text: "Clothing with a little more personality." },
  { icon: FiUserCheck, title: "Keep shopping simple", text: "Browse and order without an account." },
  { icon: FaWhatsapp, title: "Say hello on WhatsApp", text: "Confirm your finds with a real person." },
  { icon: FiMapPin, title: "Choose how it gets to you", text: "Arrange delivery or pickup with us." },
];

export function Benefits() {
  return (
    <section className="container-page py-10 sm:py-14" aria-labelledby="benefits-heading">
      <div className="mb-8 text-center"><p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-blue-600">Good finds. Easy shopping.</p><h2 id="benefits-heading" className="text-2xl font-bold tracking-[-0.04em] text-slate-950 sm:text-3xl">A closet with a personal touch.</h2></div>
      <ul className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        {BENEFITS.map(({ icon: Icon, title, text }, index) => <li key={title} className="relative border-t border-blue-100 pt-5"><span className="absolute right-0 top-5 font-display text-xs font-semibold text-blue-200">0{index + 1}</span><span className="mb-4 flex size-11 items-center justify-center rounded-2xl bg-linear-to-br from-blue-50 to-blue-100/60 text-blue-600"><Icon className="size-5" aria-hidden="true" /></span><h3 className="text-sm font-semibold text-slate-900">{title}</h3><p className="mt-2 text-xs leading-6 text-slate-500">{text}</p></li>)}
      </ul>
    </section>
  );
}
