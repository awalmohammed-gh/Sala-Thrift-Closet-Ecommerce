import Link from "next/link";
import { FiAlertTriangle, FiArrowUpRight, FiBox, FiClock, FiCreditCard } from "react-icons/fi";
import { formatGHS, type DashboardSummary } from "@salasty-thrift-closet/shared";
import { cn } from "@/lib/utils";

type Tone = "plain" | "brand" | "attention" | "danger";

const TONES: Record<Tone, { card: string; icon: string; note: string }> = {
  plain: { card: "border-line bg-white text-ink", icon: "bg-brand-50 text-brand", note: "text-muted" },
  brand: { card: "border-brand bg-brand text-white", icon: "bg-white/15 text-white", note: "text-white/70" },
  attention: { card: "border-sky-300 bg-sky-50 text-ink", icon: "bg-sky-500 text-white", note: "text-sky-800" },
  danger: { card: "border-red-200 bg-red-50 text-ink", icon: "bg-red-500 text-white", note: "text-red-700" },
};

/** Four figures, each a link to the page where the admin acts on it. Cards light up when they need attention. */
export function DashboardStats({ summary }: { summary: DashboardSummary }) {
  const { products, orders } = summary;
  const alerts = products.lowStock + products.outOfStock;
  const hidden = products.total - products.active;
  const stats: { label: string; value: string | number; note: string; href: string; icon: typeof FiBox; tone: Tone }[] = [
    {
      label: "New orders",
      value: orders.pending,
      note: orders.pending ? "Waiting for you to confirm" : "Nothing waiting",
      href: "/admin/orders?status=WhatsApp%20Pending",
      icon: FiClock,
      tone: orders.pending ? "attention" : "plain",
    },
    {
      label: "Sales",
      value: formatGHS(orders.completedValue),
      note: `From ${orders.completed} completed order${orders.completed === 1 ? "" : "s"}`,
      href: "/admin/orders?status=Completed",
      icon: FiCreditCard,
      tone: "brand",
    },
    {
      label: "Items for sale",
      value: products.active,
      note: hidden ? `${hidden} hidden from the store` : "All items are visible",
      href: "/admin/products",
      icon: FiBox,
      tone: "plain",
    },
    {
      label: "Stock alerts",
      value: alerts,
      note: alerts ? `${products.outOfStock} sold out · ${products.lowStock} running low` : "Stock is looking good",
      href: "/admin/inventory",
      icon: FiAlertTriangle,
      tone: alerts ? "danger" : "plain",
    },
  ];

  return (
    <ul aria-label="Store key figures" className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {stats.map(({ label, value, note, href, icon: Icon, tone }) => (
        <li key={label} className="min-w-0">
          <Link href={href} className={cn("group flex h-full min-w-0 flex-col rounded-2xl border p-4 transition-[box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:shadow-card sm:p-5", TONES[tone].card)}>
            <span className="flex items-center justify-between gap-2">
              <span className={cn("flex size-9 items-center justify-center rounded-xl sm:size-10", TONES[tone].icon)}><Icon className="size-[18px]" aria-hidden="true" /></span>
              <FiArrowUpRight className={cn("size-4 opacity-50 transition-opacity group-hover:opacity-100")} aria-hidden="true" />
            </span>
            <span className={cn("mt-4 text-xs font-semibold", tone === "brand" ? "text-white/80" : "text-muted")}>{label}</span>
            <span className="mt-0.5 break-words font-display text-2xl font-bold tracking-tight tabular-nums sm:text-3xl">{value}</span>
            <span className={cn("mt-1.5 text-xs leading-relaxed", TONES[tone].note)}>{note}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
