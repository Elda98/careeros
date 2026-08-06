import { expect, test } from "@playwright/test";

test("marketing landing page shows Orbit branding and entry points", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/Orbit/);
  await expect(page.getByRole("heading", { name: /AI that never stops working/i })).toBeVisible();
  await expect(page.locator("header").getByText("Orbit", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Get Started" }).first()).toBeVisible();
});

test("marketing landing page's section anchors are present", async ({ page }) => {
  await page.goto("/");
  for (const id of ["features", "how-it-works", "agents", "about", "preview", "faq"]) {
    await expect(page.locator(`#${id}`)).toBeAttached();
  }
});
