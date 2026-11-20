import { expect, type Page } from "@playwright/test";
import { DEMO_EMAIL, DEMO_PASSWORD } from "./credentials";

export async function login(page: Page) {
  await page.goto("/login", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Completar credenciales" }).click();
  await expect(page.locator("#email")).toHaveValue(DEMO_EMAIL);
  await expect(page.locator("#password")).toHaveValue(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Ingresar", exact: true }).click();
  await page.waitForURL("**/admin/productos", { timeout: 20_000 });
  await page.waitForLoadState("networkidle");
}

export async function expectNoHorizontalOverflow(page: Page, label: string) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));

  expect(
    scrollWidth,
    `${label}: la página desborda horizontalmente (${scrollWidth}px > ${innerWidth}px)`,
  ).toBeLessThanOrEqual(innerWidth + 1);
}
