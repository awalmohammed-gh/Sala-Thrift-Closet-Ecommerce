"use client";

import { useRef, useState, type FormEvent } from "react";
import { FiHome, FiShoppingBag, FiUser } from "react-icons/fi";
import {
  checkoutCustomerSchema,
  flattenIssues,
  formatGHS,
  type CartQuote,
  type FulfillmentMethod,
  type WhatsAppOrderResult,
} from "@salasty-thrift-closet/shared";
import { Collapse } from "@/components/animations/Collapse";
import { Input, Textarea } from "@/components/ui/Input";
import { useCart } from "@/hooks/useCart";
import { ApiClientError } from "@/lib/api";
import { guestApi } from "@/lib/guest-api";
import { initiateOrderHandoff } from "@/lib/order-handoff";
import { cn } from "@/lib/utils";
import { reserveWhatsAppWindow } from "@/lib/whatsapp";
import { saveLastOrder } from "./lastOrderStore";

interface WhatsAppCheckoutProps {
  formId: string;
  method: FulfillmentMethod | null;
  onMethodChange: (method: FulfillmentMethod) => void;
  deliveryFee: number | null;
  expectedTotal: number;
  /** Why the order can't be sent yet, if anything. */
  blocked: boolean;
  onSubmittingChange: (submitting: boolean) => void;
  onCartChanged: (quote: CartQuote, message: string) => void;
}

interface FormState {
  name: string;
  phone: string;
  deliveryLocation: string;
  deliveryAddress: string;
  notes: string;
  whatsappConfirmed: boolean;
}

const EMPTY: FormState = { name: "", phone: "", deliveryLocation: "", deliveryAddress: "", notes: "", whatsappConfirmed: false };

const newKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);

/** The customer's details, on the cart page itself so the fee and total update as they choose. */
export function WhatsAppCheckout({ formId, method, onMethodChange, deliveryFee, expectedTotal, blocked, onSubmittingChange, onCartChanged }: WhatsAppCheckoutProps) {
  const { lines } = useCart();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const root = useRef<HTMLFormElement>(null);
  // One key per checkout attempt: retries after a network error can't create a duplicate order.
  const [idempotencyKey, setIdempotencyKey] = useState(newKey);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  };

  /** The Proceed button can sit far from the fields, so bring the first problem into view. */
  const showFirstError = () => requestAnimationFrame(() => {
    root.current?.querySelector("[aria-invalid='true'], [role='alert']")?.scrollIntoView({ block: "center", behavior: "smooth" });
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (blocked) return;
    setFormError(null);

    const parsed = checkoutCustomerSchema.safeParse({ ...form, fulfillmentMethod: method ?? undefined });
    if (!parsed.success) {
      setErrors(flattenIssues(parsed.error.issues));
      showFirstError();
      return;
    }
    setErrors({});

    // Reserve the tab now, while we're still inside the click: browsers block pop-ups opened after a request.
    const reserved = reserveWhatsAppWindow();
    onSubmittingChange(true);

    try {
      const result = await guestApi.post<WhatsAppOrderResult>("/orders/whatsapp", {
        idempotencyKey,
        customer: parsed.data,
        items: lines.map((l) => ({ productId: l.productId, variantId: l.variantId, quantity: l.quantity })),
        expectedTotal,
      });

      saveLastOrder({
        id: result.order.id,
        orderReference: result.order.orderReference,
        total: result.order.total,
        itemCount: result.order.items.reduce((sum, i) => sum + i.quantity, 0),
        whatsappUrl: result.whatsappUrl,
        message: result.message,
        previewUrl: result.previewUrl,
      });
      // A blocked window leaves the cart intact; the ready panel can retry this same order.
      try {
        await initiateOrderHandoff(result.order.id, result.whatsappUrl, reserved);
      } catch {
        // The prepared order remains in private history. Retrying its handoff is idempotent.
      }
      setForm(EMPTY);
      setIdempotencyKey(newKey());
    } catch (error) {
      reserved?.close();
      if (error instanceof ApiClientError) {
        const quote = (error.details as { quote?: CartQuote } | undefined)?.quote;
        if ((error.code === "CART_CHANGED" || error.code === "PRICE_CHANGED") && quote) {
          setIdempotencyKey(newKey());
          onCartChanged(quote, error.message);
          return;
        }
        if (error.code === "VALIDATION_ERROR") {
          setErrors(Object.fromEntries(Object.entries(error.fieldErrors).map(([k, v]) => [k.replace(/^customer\./, ""), v])));
        }
        if (error.code === "IDEMPOTENCY_CONFLICT") setIdempotencyKey(newKey());
        setFormError(error.message);
      } else {
        setFormError("Something went wrong. Please try again.");
      }
      showFirstError();
    } finally {
      onSubmittingChange(false);
    }
  }

  const feeText = deliveryFee === null ? "Fee confirmed on WhatsApp" : deliveryFee === 0 ? "Free" : `${formatGHS(deliveryFee)} delivery fee`;
  const methodOption = (value: FulfillmentMethod, label: string, hint: string, Icon: typeof FiHome) => (
    <label className={cn("flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors has-focus-visible:ring-2 has-focus-visible:ring-brand/30", method === value ? "border-brand bg-brand-50" : "border-line hover:border-brand/40")}>
      <input
        type="radio"
        name="fulfillmentMethod"
        value={value}
        checked={method === value}
        onChange={() => {
          onMethodChange(value);
          if (errors.fulfillmentMethod) setErrors((e) => ({ ...e, fulfillmentMethod: "" }));
        }}
        className="size-4 shrink-0 accent-brand"
      />
      <Icon className="size-5 shrink-0 text-brand" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block text-sm font-bold text-brand-deep">{label}</span>
        <span className="block text-xs text-muted">{hint}</span>
      </span>
    </label>
  );

  return (
    <form ref={root} id={formId} onSubmit={handleSubmit} noValidate className="scroll-mt-24 rounded-2xl border border-line bg-white p-4 shadow-card sm:p-6" aria-labelledby="details-heading">
      <h2 id="details-heading" className="flex items-center gap-3 border-b border-line pb-4 text-xl font-bold text-brand-deep">
        <FiUser className="size-6 text-brand" aria-hidden="true" /> Your Details
      </h2>
      <div className="space-y-4 pt-4">
        {formError && <p className="rounded-xl bg-danger-50 px-3.5 py-2.5 text-sm font-medium text-danger" role="alert">{formError}</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Your name" required autoComplete="name" value={form.name} onChange={(e) => update("name", e.target.value)} error={errors.name} maxLength={80} />
          <Input label="WhatsApp number" required type="tel" inputMode="tel" autoComplete="tel" placeholder="024 123 4567" value={form.phone} onChange={(e) => update("phone", e.target.value)} error={errors.phone} maxLength={25} />
        </div>

        <div>
          <label className="flex min-h-9 cursor-pointer items-start gap-2.5 text-sm text-ink">
            <input type="checkbox" checked={form.whatsappConfirmed} onChange={(event) => update("whatsappConfirmed", event.target.checked)} aria-invalid={errors.whatsappConfirmed ? true : undefined} className="mt-0.5 size-4 shrink-0 accent-brand" />
            This number is on WhatsApp and you can contact me on it about my order.
          </label>
          {errors.whatsappConfirmed && <p role="alert" className="mt-1 text-sm text-danger">{errors.whatsappConfirmed}</p>}
        </div>

        <fieldset>
          <legend className="mb-2 text-sm font-semibold text-ink">How would you like to get your order? <span className="text-danger">*</span></legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {methodOption("pickup", "Pickup", "Collect from our store · Free", FiShoppingBag)}
            {methodOption("delivery", "Delivery to your doorstep", feeText, FiHome)}
          </div>
          {errors.fulfillmentMethod && <p role="alert" className="mt-1.5 text-sm text-danger">{errors.fulfillmentMethod}</p>}
        </fieldset>

        <Collapse open={method === "delivery"}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Delivery area or town" required autoComplete="address-level2" placeholder="e.g. East Legon, Accra" value={form.deliveryLocation} onChange={(e) => update("deliveryLocation", e.target.value)} error={errors.deliveryLocation} maxLength={120} />
            <Input label="Address or landmark" hint="Optional. Helps our rider find you." autoComplete="street-address" value={form.deliveryAddress} onChange={(e) => update("deliveryAddress", e.target.value)} error={errors.deliveryAddress} maxLength={300} />
          </div>
        </Collapse>

        <Textarea label="Additional notes" hint="Optional" rows={2} value={form.notes} onChange={(e) => update("notes", e.target.value)} error={errors.notes} maxLength={500} />
        <p className="text-xs text-muted">WhatsApp opens with your full order written out. Your order only reaches us when you tap send.</p>
      </div>
    </form>
  );
}
