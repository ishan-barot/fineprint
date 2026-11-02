import { readFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const fixture = (f: string) => path.join(__dirname, "fixtures", f);
const mock = JSON.parse(readFileSync(fixture("parse-response.json"), "utf8"));

async function upload(page: Page) {
  await page.goto("/");
  await page.getByLabel("Your bill (PDF, screenshot or .txt)").setInputFiles(fixture("bill.txt"));
}

// mock the api so e2e runs cost nothing and never flake
test.beforeEach(async ({ page }) => {
  await page.route("**/api/parse", (route) => route.fulfill({ json: mock }));
});

test("upload a bill and see flags, line items and plans", async ({ page }) => {
  await upload(page);
  await expect(page.getByText("Heads up")).toBeVisible();
  await expect(page.getByText(/Promo ends in/)).toBeVisible();
  await expect(page.getByText(/Save \$/).first()).toBeVisible();
});

test("results have no WCAG A/AA violations", async ({ page }) => {
  await upload(page);
  await expect(page.getByText("Heads up")).toBeVisible();
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
  expect(results.violations).toEqual([]);
});

test("falls back to manual entry when parsing fails", async ({ page }) => {
  await page.route("**/api/parse", (route) => route.fulfill({ status: 422, json: { error: "manual" } }));
  await upload(page);
  await expect(page.getByText("Enter the basics", { exact: true })).toBeVisible();
});