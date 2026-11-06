"use client";

import { FaWhatsapp } from "react-icons/fa";
import { FiArrowRight, FiFileText, FiInfo, FiShield, FiTrash2 } from "react-icons/fi";
import { formatGHS, type FulfillmentMethod } from "@salasty-thrift-closet/shared";
import { PopOnChange } from "@/components/animations/PopOnChange";
import { Button } from "@/components/ui/Button";
import { Spinner } from "@/components/ui/Spinner";

interface CartSummaryProps {
  itemCount: number;
  subtotal: number;
  total: number;
  method: FulfillmentMethod | null;
  deliveryFee: number | null;
  checking: boolean;
  submitting: boolean;
  blockedReason: string | null;
  formId: string;
  onClear: () => void;
}

/** Never says "Free" for doorstep delivery unless the store set the fee to 0. */
function deliveryLabel(method: FulfillmentMethod | null, fee: number | null): { text: string; free: boolean } {
  if (!method) return { text: "Choose below", free: false };
  if (method === "pickup" || fee === 0) return { text: "Free", free: true };
  return fee === null ? { text: "Confirmed on WhatsApp", free: false } : { text: formatGHS(fee), free: false };
}

export function CartSummary({ itemCount, subtotal, total, method, deliveryFee, checking, submitting, blockedReason, formId, onClear }: CartSummaryProps) {
  const delivery = deliveryLabel(method, deliveryFee);
  return (
    <aside className="h-fit rounded-2xl border border-line bg-white p-5 shadow-card sm:p-6 lg:sticky lg:top-24" aria-labelledby="summary-heading">
      <h2 id="summary-heading" className="flex items-center gap-3 border-b border-line pb-4 text-xl font-bold text-brand-deep">
        <span className="flex size-9 items-center justify-center rounded-lg bg-brand text-white"><FiFileText className="size-5" aria-hidden="true" /></span>
        Order Summary
      </h2>
      <dl className="space-y-3 py-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-ink">Subtotal ({itemCount} item{itemCount === 1 ? "" : "s"})</dt>
          <dd className="font-semibold text-ink">{formatGHS(subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="inline-flex items-center gap-1.5 text-ink">Delivery Fee<FiInfo className="size-3.5 text-muted" aria-hidden="true" title="Charged for delivery to your doorstep. Pickup is free." /></dt>
          <dd className={delivery.free ? "font-bold text-success" : "text-right font-semibold text-ink"}><PopOnChange value={delivery.text}>{delivery.text}</PopOnChange></dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
          <dt className="text-lg font-bold text-brand-deep">Total</dt>
          <dd className="flex items-center gap-2 font-display text-xl font-bold text-brand-deep">
            {checking && <Spinner className="text-muted" label="Checking prices" />}
            <PopOnChange value={total}>{formatGHS(total)}</PopOnChange>
          </dd>
        </div>
      </dl>

      <p className="flex items-center gap-3 rounded-xl bg-brand-50 p-3.5 text-xs leading-relaxed text-ink">
        <FiShield className="size-7 shrink-0 text-success" aria-hidden="true" />
        <span><strong className="block text-sm text-brand-deep">Order via WhatsApp</strong>No online payment. Just send us your order on WhatsApp.</span>
      </p>

      <Button type="submit" form={formId} variant="whatsapp" size="lg" className="group mt-4 w-full rounded-full!" loading={submitting} disabled={!!blockedReason || itemCount === 0} leftIcon={<FaWhatsapp className="size-5" aria-hidden="true" />} rightIcon={<FiArrowRight className="size-4 transition-transform duration-200 ease-out-soft group-hover:translate-x-1" aria-hidden="true" />}>
        Proceed to WhatsApp
      </Button>
      {blockedReason && <p className="mt-2 text-center text-xs font-medium text-danger">{blockedReason}</p>}

      <p className="my-3 flex items-center gap-3 text-xs text-muted before:h-px before:flex-1 before:bg-line after:h-px after:flex-1 after:bg-line">or</p>

      <button type="button" onClick={onClear} disabled={submitting} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand-deep text-sm font-semibold text-brand-deep transition-colors hover:bg-brand-50 disabled:opacity-50">
        <FiTrash2 className="size-4" aria-hidden="true" /> Clear Cart
      </button>
    </aside>
  );
}
