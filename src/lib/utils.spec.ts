import { test } from "@japa/runner";
import { getPercentageDecrease, parseCurrency } from "./utils";

// @ts-expect-error: Figure out how to type `assert`, because it's for whatever reason `any`.
test("parseCurrency", ({ assert }) => {
  assert.equal(parseCurrency("£2,595.04"), 2595.04);
  assert.equal(parseCurrency("£2 595,04 €"), 2595.04);
  assert.equal(parseCurrency("$2595.04"), 2595.04);
  assert.equal(parseCurrency("$1.009.004,25"), 1009004.25);
  assert.equal(parseCurrency("2595.04 $"), 2595.04);
  assert.equal(parseCurrency("2595.04€"), 2595.04);
  assert.equal(parseCurrency("¥2595.04"), 2595.04);
  assert.equal(parseCurrency("2595.04 kr."), 2595.04);
});

// @ts-expect-error: Figure out how to type `assert`, because it's for whatever reason `any`.
test("getPercentageDecrease", ({ assert }) => {
  assert.equal(getPercentageDecrease(3521.12, 3248.63), "-8%");
  assert.equal(getPercentageDecrease(156.61, 135.84), "-13%");
  assert.equal(getPercentageDecrease(483.19, 448.41), "-7%");
  assert.equal(getPercentageDecrease(345.18, 283.07), "-18%");
  assert.equal(getPercentageDecrease(3243.8, 2595.04), "-20%");
  assert.equal(getPercentageDecrease(1056.39, 933.88), "-12%");
});
