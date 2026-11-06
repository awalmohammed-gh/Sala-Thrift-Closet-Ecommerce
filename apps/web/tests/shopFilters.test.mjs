import assert from "node:assert/strict";
import { test } from "node:test";
import { hasActiveFilters, parseShopFilters, priceCeiling, shopHref } from "../src/lib/shopFilters.ts";

test("unsafe URL values fall back to the defaults", () => {
  assert.deepEqual(parseShopFilters({ sort: "cheapest", category: "../admin", min: "-5", max: "abc", view: "table", page: "0", availability: "maybe" }), {
    q: "", category: "", sort: "newest", availability: "all", min: 0, max: 0, view: "grid", page: 1,
  });
});

test("valid filters are kept and a backwards price range drops its top", () => {
  const state = parseShopFilters({ q: "  jeans ", category: "jeans", sort: "price-asc", availability: "in-stock", min: "50", max: "100", view: "list", page: "3" });
  assert.deepEqual(state, { q: "jeans", category: "jeans", sort: "price-asc", availability: "in-stock", min: 50, max: 100, view: "list", page: 3 });
  assert.equal(parseShopFilters({ min: "100", max: "50" }).max, 0);
});

test("the shop URL only carries what differs from the defaults", () => {
  const state = parseShopFilters({});
  assert.equal(shopHref(state), "/shop");
  assert.equal(shopHref(state, { category: "jeans", min: 40, max: 80 }), "/shop?category=jeans&min=40&max=80");
});

test("changing a filter returns to page 1 and keeps the other filters", () => {
  const state = parseShopFilters({ q: "jeans", view: "list", page: "3" });
  assert.equal(shopHref(state, { sort: "price-desc" }), "/shop?q=jeans&sort=price-desc&view=list");
  assert.equal(shopHref(state, { page: 2 }), "/shop?q=jeans&view=list&page=2");
});

test("sorting or switching view is not a filter, so the banner can stay", () => {
  assert.equal(hasActiveFilters(parseShopFilters({ sort: "price-asc", view: "list" })), false);
  for (const params of [{ q: "x" }, { category: "jeans" }, { min: "10" }, { max: "10" }, { availability: "in-stock" }]) {
    assert.equal(hasActiveFilters(parseShopFilters(params)), true);
  }
});

test("the price slider tops out at a tidy number above the dearest item", () => {
  assert.equal(priceCeiling(16000), 160);
  assert.equal(priceCeiling(16050), 170);
  assert.equal(priceCeiling(undefined), 1000);
});
