import assert from "node:assert/strict";
import { test } from "node:test";
import { bestDeal, cardCompareAtPrice, categoryPhoto, dealPercent, marketAisles, onlyVariant } from "../src/lib/productDisplay.ts";

const variant = (overrides = {}) => ({ id: "v1", attributes: [], sku: null, price: null, compareAtPrice: null, stock: 3, isActive: true, ...overrides });
const product = (overrides = {}) => ({ id: "p1", price: 6500, compareAtPrice: null, variants: [], inStock: true, ...overrides });
const category = (name, productCount, overrides = {}) => ({ id: name, name, slug: name.toLowerCase(), isActive: true, displayOrder: 0, productCount, ...overrides });

test("a compare-at price is only a deal when the shopper pays less", () => {
  assert.equal(dealPercent(product({ compareAtPrice: 10000 })), 35);
  assert.equal(dealPercent(product()), null);
  assert.equal(dealPercent(product({ compareAtPrice: 7000, variants: [variant({ price: 7000 })] })), null, "variant price overrides the product discount");
  assert.equal(dealPercent(product({ compareAtPrice: 10000, variants: [variant()] })), 35, "variant inherits the product price");
  assert.equal(dealPercent(product({ variants: [variant({ price: 5000, compareAtPrice: 10000 }), variant({ price: 9000 })] })), 50);
  assert.equal(dealPercent(product({ variants: [variant({ price: 5000, compareAtPrice: 10000, isActive: false })] })), null);
});

test("no discount is promised unless the admin set one on something in stock", () => {
  assert.equal(bestDeal(undefined), 0);
  assert.equal(bestDeal([product()]), 0);
  assert.equal(bestDeal([product({ compareAtPrice: 7000, variants: [variant({ price: 7000 })] })]), 0);
  assert.equal(bestDeal([product({ compareAtPrice: 10000, inStock: false })]), 0);
  assert.equal(bestDeal([product({ compareAtPrice: 10000 }), product({ compareAtPrice: 7000 })]), 35);
});

test("a card strikes through a price only when every option shares it", () => {
  assert.equal(cardCompareAtPrice(product({ compareAtPrice: 10000 })), 10000);
  assert.equal(cardCompareAtPrice(product({ compareAtPrice: 7000, variants: [variant({ price: 7000 })] })), null);
  assert.equal(cardCompareAtPrice(product({ variants: [variant({ price: 5000, compareAtPrice: 8000 }), variant({ price: 5000, compareAtPrice: 8000 })] })), 8000);
  assert.equal(cardCompareAtPrice(product({ variants: [variant({ price: 5000, compareAtPrice: 8000 }), variant({ price: 6000, compareAtPrice: 8000 })] })), null);
});

test("only a product with one option can skip the options page", () => {
  const only = variant();
  assert.equal(onlyVariant(product({ variants: [only] })), only);
  assert.equal(onlyVariant(product()), null);
  assert.equal(onlyVariant(product({ variants: [variant(), variant({ id: "v2" })] })), null);
  assert.equal(onlyVariant(product({ variants: [only, variant({ id: "v2", isActive: false })] })), null, "a hidden option still means the product has options");
});

test("categories come only from the store: fullest first, none empty or hidden", () => {
  const categories = [category("Royal", 1), category("Jeans", 12), category("Empty", 0), category("Hidden", 9, { isActive: false }), category("Bubu", 2)];
  assert.deepEqual(marketAisles(categories).map((item) => item.name), ["Jeans", "Bubu", "Royal"]);
  assert.deepEqual(marketAisles(null), []);
});

test("house photos follow the category name and never guess", () => {
  assert.equal(categoryPhoto("Jeans"), "/images/categories/jeans.webp");
  assert.equal(categoryPhoto("Trousers & Jeans"), "/images/categories/jeans.webp");
  assert.equal(categoryPhoto("Bubu dress"), "/images/categories/dress.webp");
  assert.equal(categoryPhoto("Perfumes"), "/images/categories/perfume.webp");
  assert.equal(categoryPhoto("Body splash"), "/images/categories/perfume.webp");
  assert.equal(categoryPhoto("T-Shirts & Tops"), "/images/categories/t-shirt.webp");
  assert.equal(categoryPhoto("Cargo pant"), null);
  assert.equal(categoryPhoto("Laptops"), null, "words are matched whole");
  assert.equal(categoryPhoto("ASAD"), null);
});

test("a category appears once a product is added to it", () => {
  const before = [category("Jeans", 12), category("Shoes", 0)];
  assert.deepEqual(marketAisles(before).map((item) => item.name), ["Jeans"]);
  assert.deepEqual(marketAisles([category("Jeans", 12), category("Shoes", 1)]).map((item) => item.name), ["Jeans", "Shoes"]);
});
