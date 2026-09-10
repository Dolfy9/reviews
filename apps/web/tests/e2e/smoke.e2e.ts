import { test, expect } from "@playwright/test";

test.describe("production smoke", () => {
  test("home page renders the catalog and search", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /Discover products you'll love/i }),
    ).toBeVisible();
    await expect(page.getByText("Trusted Reviews Platform")).toBeVisible();
  });

  test("search autocomplete returns product for partial term", async ({
    page,
  }) => {
    await page.goto("/");
    const search = page.getByPlaceholder("Search products and reviews...");
    await search.click();
    await search.fill("pell");
    await expect(
      page.getByText("pain grillé pelletier", { exact: false }),
    ).toBeVisible({ timeout: 10000 });
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: /Welcome back/i }),
    ).toBeVisible();
    await expect(page.getByText("Sign in to continue")).toBeVisible();
  });

  test("api health endpoint is reachable", async ({ request }) => {
    const response = await request.get("http://localhost:3001/api/health");
    expect(response.ok()).toBeTruthy();
    const body = await response.json();
    expect(body).toHaveProperty("status", "ok");
  });
});
