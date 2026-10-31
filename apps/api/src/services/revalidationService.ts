import { waitUntil } from "@vercel/functions";
import { env } from "../config/env.js";

export type StorefrontTag = "products" | "categories" | "banners" | "settings";

/**
 * Tells the Next.js storefront to drop cached pages after catalogue changes,
 * so updates show without waiting for the time-based cache to expire.
 * Fire-and-forget: a failure only means the storefront refreshes on its normal schedule.
 * On Vercel, waitUntil keeps the function alive until the request finishes, so callers
 * that do not await it are not cut off when the response is sent.
 */
export function revalidateStorefront(...tags: StorefrontTag[]): Promise<void> {
  if (!env.WEB_REVALIDATE_URL || !env.REVALIDATE_SECRET || env.isTest) return Promise.resolve();
  const unique = [...new Set(tags)];
  const task = fetch(env.WEB_REVALIDATE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-revalidate-secret": env.REVALIDATE_SECRET },
    body: JSON.stringify({ tags: unique }),
    signal: AbortSignal.timeout(4000),
  })
    .then((res) => {
      if (!res.ok) console.warn(`[revalidate] storefront responded ${res.status} for ${unique.join(",")}`);
    })
    .catch((error: unknown) => {
      console.warn(`[revalidate] could not reach storefront: ${(error as Error).message}`);
    });
  waitUntil(task);
  return task;
}
