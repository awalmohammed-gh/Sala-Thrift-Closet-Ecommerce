"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";
import { FiArrowLeft, FiCheckCircle, FiCopy, FiShoppingBag, FiShoppingCart, FiTrash2 } from "react-icons/fi";
import { formatGHS, type FulfillmentMethod, type QuoteLine } from "@salasty-thrift-closet/shared";
import { Button, ButtonLink } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { useCart } from "@/hooks/useCart";
import { errorMessage } from "@/lib/api";
import { initiateOrderHandoff } from "@/lib/order-handoff";
import { cartLineKey } from "@/types/cart";
import { CartItem } from "./CartItem";
import { CartSummary } from "./CartSummary";
import { saveLastOrder, useLastOrder, type LastOrder } from "./lastOrderStore";
import { WhatsAppCheckout } from "./WhatsAppCheckout";
import { confirm } from "@/components/ui/ConfirmDialog";
import { toast } from "@/components/ui/Toast";

function OrderSent({ order }: { order: LastOrder }) {
  const [copied, setCopied] = useState(false);
  const [opening, setOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function continueOrder() {
    setOpening(true);
    setError(null);
    try {
      if (!await initiateOrderHandoff(order.id, order.whatsappUrl)) setError("Allow pop-ups, then try Open WhatsApp again. Your cart is still saved.");
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setOpening(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(order.message);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section className="rounded-2xl border border-success/30 bg-white p-5 shadow-card sm:p-7" aria-labelledby="order-ready-heading">
      <div className="flex items-start gap-3">
        <FiCheckCircle className="mt-1 size-6 shrink-0 text-success" aria-hidden="true" />
        <div className="space-y-1">
          <h2 id="order-ready-heading" className="text-xl font-bold text-ink">
            Order {order.orderReference} is ready to send
          </h2>
          <p className="text-sm text-muted">
            {order.itemCount} item{order.itemCount === 1 ? "" : "s"} · {formatGHS(order.total)}. Your order reaches us once you press{" "}
            <strong>send</strong> in WhatsApp. We&apos;ll reply to confirm availability, delivery and payment.
          </p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <Button onClick={continueOrder} loading={opening} variant="whatsapp" size="lg" leftIcon={<FaWhatsapp className="size-5" aria-hidden="true" />}>
          Open WhatsApp
        </Button>
        <Button variant="secondary" size="lg" onClick={copy} leftIcon={<FiCopy className="size-4" aria-hidden="true" />}>
          {copied ? "Copied" : "Copy order message"}
        </Button>
        <Button variant="ghost" size="lg" onClick={() => saveLastOrder(null)}>
          Done
        </Button>
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}
      <div className="mt-4 flex flex-wrap gap-4">
        <ButtonLink href="/my-orders" variant="link">View your private order history</ButtonLink>
        <ButtonLink href={order.previewUrl} external variant="link">View products with images</ButtonLink>
      </div>
      <p className="mt-3 text-xs text-muted">
        WhatsApp didn&apos;t open? Use the button above, or copy the message and send it to us on WhatsApp.
      </p>
    </section>
  );
}

const FORM_ID = "checkout-form";

export function CartView({ whatsappEnabled, whatsappNotice, deliveryFee }: { whatsappEnabled: boolean; whatsappNotice?: string | null; deliveryFee: number | null }) {
  const { lines, hydrated, itemCount, subtotal, clear, applyQuote, quote, pending: checking, error, refresh } = useCart();
  const lastOrder = useLastOrder();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [method, setMethod] = useState<FulfillmentMethod | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const total = subtotal + (method === "delivery" ? deliveryFee ?? 0 : 0);

  const issues = useMemo(() => {
    const map = new Map<string, QuoteLine>();
    for (const line of quote?.lines ?? []) {
      if (line.status !== "ok") map.set(cartLineKey(line.productId, line.variantId), line);
    }
    return map;
  }, [quote]);

  // "Order via WhatsApp" on a product page lands here, ready for the customer's details.
  const wantsCheckout = searchParams.get("checkout") === "1";
  const ready = hydrated && lines.length > 0;
  useEffect(() => {
    if (wantsCheckout && ready) document.getElementById(FORM_ID)?.scrollIntoView({ block: "start" });
  }, [wantsCheckout, ready]);

  const blockingIssue = lines.some((l) => {
    const issue = issues.get(l.key);
    return !!issue;
  });
  const blockedReason = error ? "Refresh your cart before continuing." : !whatsappEnabled
    ? whatsappNotice ?? "WhatsApp ordering is being set up. Please check back soon."
    : blockingIssue
      ? "Adjust the quantities or remove unavailable items to continue."
      : null;

  const clearCart = async () => {
    if (!(await confirm({ title: "Remove all items from your cart?", confirmLabel: "Remove all", tone: "danger" }))) return;
    void clear().then(() => toast.success("Your cart is now empty."), () => undefined);
  };

  if (!hydrated) {
    return (
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]" aria-hidden="true">
        <div className="skeleton h-96 rounded-2xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && <div role="alert" className="rounded-xl bg-danger-50 p-4 text-sm text-danger">{error} <Button variant="link" onClick={() => void refresh()}>Retry</Button></div>}
      {lastOrder && <OrderSent order={lastOrder} />}

      {notice && (
        <p className="rounded-xl border border-accent/40 bg-accent-50 px-4 py-3 text-sm font-medium text-accent-700" role="status">
          {notice}
        </p>
      )}

      {lines.length === 0 ? (
        !lastOrder && (
          <EmptyState
            icon={<FiShoppingBag />}
            title="Your cart is empty"
            description="Browse the store and pick what you like. You can send the whole order to us on WhatsApp in one go."
            action={<ButtonLink href="/shop">Start shopping</ButtonLink>}
          />
        )
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
          <div className="min-w-0 space-y-6">
            <section aria-labelledby="cart-items-heading" className="animate-hero-rise rounded-2xl border border-line bg-white p-4 shadow-card sm:p-6">
              <div className="flex items-center justify-between gap-3 border-b border-line pb-4">
                <h2 id="cart-items-heading" className="flex items-center gap-3 text-xl font-bold text-brand-deep">
                  <FiShoppingCart className="size-6 text-brand" aria-hidden="true" />
                  <span>My Cart <span className="font-normal">({itemCount} Item{itemCount === 1 ? "" : "s"})</span></span>
                </h2>
                <button type="button" onClick={() => void clearCart()} disabled={submitting} className="inline-flex min-h-9 shrink-0 items-center gap-1.5 text-sm font-semibold text-brand hover:underline">
                  <FiTrash2 className="size-4" aria-hidden="true" /> Clear Cart
                </button>
              </div>
              <ul className="divide-y divide-line">
                {lines.map((line) => (
                  <CartItem key={line.key} line={line} issue={issues.get(line.key)} />
                ))}
              </ul>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
                <Link href="/shop" className="inline-flex min-h-9 items-center gap-2 text-sm font-semibold text-brand hover:underline">
                  <FiArrowLeft className="size-4" aria-hidden="true" /> Continue Shopping
                </Link>
                <Link href="/my-orders" className="text-xs text-muted hover:text-brand">My orders</Link>
              </div>
            </section>

            <WhatsAppCheckout
              formId={FORM_ID}
              method={method}
              onMethodChange={setMethod}
              deliveryFee={deliveryFee}
              expectedTotal={total}
              blocked={!!blockedReason}
              onSubmittingChange={setSubmitting}
              onCartChanged={(updated, message) => {
                applyQuote(updated);
                // The fee may be what changed, and it comes from the page's settings.
                router.refresh();
                setNotice(`${message} Please review your cart before sending.`);
              }}
            />
          </div>

          <CartSummary
            itemCount={itemCount}
            subtotal={subtotal}
            total={total}
            method={method}
            deliveryFee={deliveryFee}
            checking={checking}
            submitting={submitting}
            blockedReason={blockedReason}
            formId={FORM_ID}
            onClear={() => void clearCart()}
          />
        </div>
      )}
    </div>
  );
}
