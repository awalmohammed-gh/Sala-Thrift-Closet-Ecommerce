import assert from "node:assert/strict";
import test from "node:test";
import { storePath } from "../src/lib/storePath.ts";

test("the prerendered home page counts as the home page", () => {
  assert.equal(storePath("/index"), "/");
  assert.equal(storePath("/"), "/");
});

test("other pages keep their address, including ones that only look like the home page", () => {
  assert.equal(storePath("/shop"), "/shop");
  assert.equal(storePath("/products/index"), "/products/index");
  assert.equal(storePath("/index-sale"), "/index-sale");
});
