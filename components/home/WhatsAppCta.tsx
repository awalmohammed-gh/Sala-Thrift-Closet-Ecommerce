import { FaWhatsapp } from "react-icons/fa";
import { FiArrowRight } from "react-icons/fi";
import { ButtonLink } from "@/components/ui/Button";
import { getSettings } from "@/lib/catalog";
import { supportChatUrl } from "@/lib/whatsapp";

/** Full-width band that runs straight into the footer, for shoppers who did not find their item. */
export async function WhatsAppCta() {
  const settings = await getSettings();
  const chatUrl = supportChatUrl(settings, `Hello ${settings.storeName}, I'm looking for a product. Can you help?`);

  return (
    <section className="-mb-14 mt-10 bg-navy text-white sm:mt-12" aria-labelledby="whatsapp-cta-heading">
      <div className="container-page flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <FaWhatsapp className="size-10 shrink-0" aria-hidden="true" />
          <div>
            <h2 id="whatsapp-cta-heading" className="text-lg font-bold sm:text-xl">Can&apos;t find what you want?</h2>
            <p className="text-sm text-blue-50">Message us. A real person will help you find it.</p>
          </div>
        </div>
        {chatUrl ? (
          <ButtonLink href={chatUrl} external variant="hero" className="rounded-full! font-bold sm:px-7!" leftIcon={<FaWhatsapp className="size-5" aria-hidden="true" />}>
            Chat on WhatsApp
          </ButtonLink>
        ) : (
          <ButtonLink href="/contact" variant="hero" className="rounded-full! font-bold" rightIcon={<FiArrowRight className="size-4" aria-hidden="true" />}>
            Contact us
          </ButtonLink>
        )}
      </div>
    </section>
  );
}
