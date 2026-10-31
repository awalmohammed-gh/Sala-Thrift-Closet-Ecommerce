"use client";

import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { FiAlertTriangle, FiArrowRight, FiCheckCircle, FiChevronRight, FiClock, FiInbox, FiPlus, FiRefreshCw } from "react-icons/fi";
import { formatGHS, type DashboardSummary } from "@salasty-thrift-closet/shared";
import { ErrorBlock, LoadingBlock, OrderStatusBadge, PageHeader, Panel, StockBadge } from "@/components/admin/AdminUI";
import { DashboardStats } from "@/components/admin/DashboardStats";
import { useAdminSession } from "@/components/admin/AdminSession";
import { Button, ButtonLink } from "@/components/ui/Button";
import { useAdminResource } from "@/hooks/useAdminResource";
import { formatRelativeTime } from "@/lib/time";
import { cn } from "@/lib/utils";

function greeting(hour: number) {
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const panelLink = "inline-flex min-h-9 items-center gap-1.5 text-sm font-semibold text-brand hover:underline";

export function OverviewView() {
  const { admin } = useAdminSession();
  const { data, error, loading, reload } = useAdminResource<DashboardSummary>("/admin/dashboard");
  const now = new Date();
  const today = now.toLocaleDateString("en-GH", { weekday: "long", day: "numeric", month: "long" });

  return (
    <>
      <PageHeader
        title={`${greeting(now.getHours())}, ${admin.name.split(" ")[0]}`}
        description={`${today}. Here is what needs you today.`}
        actions={<>
          <Button variant="secondary" onClick={reload} disabled={loading} aria-label={loading ? "Refreshing dashboard" : "Refresh dashboard"} leftIcon={<FiRefreshCw className={cn("size-4", loading && "motion-safe:animate-spin")} aria-hidden="true" />}>Refresh</Button>
          <ButtonLink href="/admin/products/new" leftIcon={<FiPlus className="size-4" aria-hidden="true" />}>Add product</ButtonLink>
        </>}
      />

      {loading && !data ? <LoadingBlock label="Loading dashboard" /> : error && !data ? <ErrorBlock message={error} onRetry={reload} /> : data ? (
        <div className="space-y-6" aria-busy={loading}>
          {error && <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-danger/20 bg-danger-50 px-4 py-3 text-sm text-danger"><p>Could not refresh the dashboard. Showing the last available figures.</p><Button size="sm" variant="secondary" onClick={reload}>Try again</Button></div>}
          <AttentionList summary={data} />
          <DashboardStats summary={data} />

          <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
            <LatestOrders summary={data} />
            <div className="min-w-0 space-y-6">
              <OrdersByStatus summary={data} />
              <RestockList summary={data} />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** The day's to-do list: the first thing the admin sees, in plain words. */
function AttentionList({ summary }: { summary: DashboardSummary }) {
  const { orders, products } = summary;
  const stockAlerts = products.lowStock + products.outOfStock;
  const tasks: { icon: ReactNode; tone: string; text: ReactNode; href: string; action: string }[] = [];
  if (!products.total) {
    tasks.push({ icon: <FiPlus className="size-4" />, tone: "bg-brand text-white", text: <>Add your first product so customers have something to order.</>, href: "/admin/products/new", action: "Add product" });
  }
  if (orders.pending) {
    tasks.push({ icon: <FiClock className="size-4" />, tone: "bg-sky-500 text-white", text: <><strong>{orders.pending} new order{orders.pending === 1 ? "" : "s"}</strong> waiting for you to confirm on WhatsApp.</>, href: "/admin/orders?status=WhatsApp%20Pending", action: "Review" });
  }
  if (stockAlerts) {
    tasks.push({ icon: <FiAlertTriangle className="size-4" />, tone: "bg-red-500 text-white", text: <><strong>{stockAlerts} item{stockAlerts === 1 ? "" : "s"}</strong> {products.outOfStock && products.lowStock ? "sold out or running low" : products.outOfStock ? "sold out" : "running low"}.</>, href: "/admin/inventory", action: "Restock" });
  }

  if (!tasks.length) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-success/20 bg-success-50 px-4 py-3.5 sm:px-5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-success text-white"><FiCheckCircle className="size-[18px]" aria-hidden="true" /></span>
        <p className="text-sm text-ink"><strong>All caught up.</strong> No new orders or stock problems right now.</p>
      </div>
    );
  }

  return (
    <section aria-labelledby="attention-heading" className="overflow-hidden rounded-2xl border border-line bg-white shadow-card">
      <h2 id="attention-heading" className="border-b border-line px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-muted sm:px-5">Needs your attention</h2>
      <ul className="divide-y divide-line">
        {tasks.map((task) => (
          <li key={task.href}>
            <Link href={task.href} className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-brand-50/60 sm:px-5">
              <span aria-hidden="true" className={cn("flex size-9 shrink-0 items-center justify-center rounded-full", task.tone)}>{task.icon}</span>
              <p className="min-w-0 flex-1 text-sm text-ink">{task.text}</p>
              <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-brand px-3 py-1.5 text-xs font-semibold text-white transition-colors group-hover:bg-brand-700">{task.action}<FiChevronRight className="size-3.5" aria-hidden="true" /></span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function LatestOrders({ summary }: { summary: DashboardSummary }) {
  const orders = summary.recentOrders;
  return (
    <Panel title="Latest orders" actions={<Link href="/admin/orders" className={panelLink}>All orders <FiArrowRight aria-hidden="true" /></Link>}>
      {orders.length === 0 ? (
        <div className="flex flex-col items-center px-5 py-12 text-center">
          <span className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-brand-50 text-brand"><FiInbox className="size-6" aria-hidden="true" /></span>
          <h3 className="text-base font-semibold text-ink">No orders yet</h3>
          <p className="mt-2 max-w-xs text-sm text-muted">When a customer sends an order on WhatsApp, it shows up here straight away.</p>
        </div>
      ) : (
        <ul className="divide-y divide-line">
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={`/admin/orders?open=${order.id}`} className={cn("group flex min-w-0 items-center gap-3 px-4 py-3.5 transition-colors hover:bg-cream-200/60 sm:px-5", order.status === "WhatsApp Pending" && "bg-sky-50/60")}>
                <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-bold text-brand">{order.customer.name.trim().charAt(0).toUpperCase() || "?"}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">{order.customer.name || "Customer"}</p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {order.orderReference} · {order.itemCount} item{order.itemCount === 1 ? "" : "s"} · <time dateTime={order.createdAt}>{formatRelativeTime(order.createdAt)}</time>
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-sm font-bold tabular-nums text-ink">{formatGHS(order.total)}</span>
                  <OrderStatusBadge status={order.status} />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function OrdersByStatus({ summary }: { summary: DashboardSummary }) {
  const { orders } = summary;
  const rows = [
    { label: "Waiting to confirm", value: orders.pending, href: "/admin/orders?status=WhatsApp%20Pending", bar: "bg-sky-500" },
    { label: "Confirmed", value: orders.confirmed, href: "/admin/orders?status=Confirmed", bar: "bg-brand" },
    { label: "Being prepared or on the way", value: orders.inProgress, href: "/admin/orders", bar: "bg-indigo-500" },
    { label: "Completed", value: orders.completed, href: "/admin/orders?status=Completed", bar: "bg-success" },
    { label: "Cancelled", value: orders.cancelled, href: "/admin/orders?status=Cancelled", bar: "bg-slate-300" },
  ];
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <Panel title="Orders by status" actions={<span className="text-xs text-muted">{orders.total} in total</span>}>
      <ul className="space-y-1 p-2 sm:p-3">
        {rows.map((row) => (
          <li key={row.label}>
            <Link href={row.href} className="block rounded-xl px-2 py-2 transition-colors hover:bg-cream-200/60 sm:px-3">
              <span className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate text-ink">{row.label}</span>
                <span className="font-semibold tabular-nums text-ink">{row.value}</span>
              </span>
              <span aria-hidden="true" className="mt-1.5 block h-1.5 overflow-hidden rounded-full bg-cream-200">
                <span className={cn("block h-full rounded-full transition-[width] duration-500", row.bar)} style={{ width: `${(row.value / max) * 100}%` }} />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function RestockList({ summary }: { summary: DashboardSummary }) {
  const items = summary.lowStockItems.slice(0, 5);
  return (
    <Panel title="Restock soon" actions={<Link href="/admin/inventory" className={panelLink}>Stock <FiArrowRight aria-hidden="true" /></Link>}>
      {items.length === 0 ? (
        <p className="flex items-center gap-2 px-4 py-5 text-sm text-muted sm:px-5"><FiCheckCircle className="size-4 shrink-0 text-success" aria-hidden="true" />{summary.products.active ? "Nothing needs restocking." : "Stock alerts appear here once you add products."}</p>
      ) : (
        <ul className="divide-y divide-line">
          {items.map((row) => (
            <li key={`${row.productId}-${row.variantId ?? "base"}`}>
              <Link href="/admin/inventory" className="flex min-w-0 items-center gap-3 px-4 py-3 transition-colors hover:bg-cream-200/60 sm:px-5">
                <div className="relative size-11 shrink-0 overflow-hidden rounded-xl border border-line bg-cream"><Image src={row.image || "/images/placeholders/product.svg"} alt="" fill sizes="44px" className="object-cover" /></div>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-ink">{row.productName}</p>{row.variantLabel && <p className="mt-0.5 truncate text-xs text-muted">{row.variantLabel}</p>}</div>
                <div className="flex shrink-0 flex-col items-end gap-1"><span className="text-xs font-semibold tabular-nums text-ink">{row.stock} left</span><StockBadge state={row.state} /></div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
