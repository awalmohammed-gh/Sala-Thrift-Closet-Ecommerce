import { FaWhatsapp } from "react-icons/fa";
import { FiArrowRight } from "react-icons/fi";
import { RevealOnScroll } from "@/components/animations/RevealOnScroll";
import { ButtonLink } from "@/components/ui/Button";
import { getSettings } from "@/lib/catalog";
import { supportChatUrl } from "@/lib/whatsapp";

/** One short line for shoppers who did not find their item in the grid. */
export async function WhatsAppCta() {
  const settings = await getSettings();
  const chatUrl = supportChatUrl(settings, `Hello ${settings.storeName}, I'm looking for a product. Can you help?`);

  return (
    <section className="container-page py-6 sm:py-8" aria-labelledby="whatsapp-cta-heading">
      <RevealOnScroll className="flex flex-col gap-4 rounded-2xl border border-success/15 bg-success-50 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-whatsapp text-white"><FaWhatsapp className="size-6" aria-hidden="true" /></span>
          <div>
            <h2 id="whatsapp-cta-heading" className="font-semibold text-ink">Can&apos;t find what you want?</h2>
            <p className="text-sm text-muted">Message us. A real person will help you find it.</p>
          </div>
        </div>
        {chatUrl ? (
          <ButtonLink href={chatUrl} external variant="whatsapp" className="rounded-full! sm:px-6!" leftIcon={<FaWhatsapp className="size-5" aria-hidden="true" />}>
            Chat on WhatsApp
          </ButtonLink>
        ) : (
          <ButtonLink href="/contact" variant="secondary" className="rounded-full!" rightIcon={<FiArrowRight className="size-4" aria-hidden="true" />}>
            Contact us
          </ButtonLink>
        )}
      </RevealOnScroll>
    </section>
  );
}
