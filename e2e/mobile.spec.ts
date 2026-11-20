import { expect, test } from "@playwright/test";
import { login, expectNoHorizontalOverflow } from "./helpers";

test("mobile: edición rápida en bottom sheet y layout sin desbordes", async ({ page }) => {
  await login(page);

  await expect(page.getByRole("status").filter({ hasText: "Modo demo panel" })).toBeVisible();
  await expectNoHorizontalOverflow(page, "productos mobile");

  await page.getByRole("button", { name: "Buscar en el panel" }).click();
  const commandPalette = page.getByRole("dialog", { name: "Buscar en el panel" });
  await expect(commandPalette).toBeVisible();
  await expectNoHorizontalOverflow(page, "command palette mobile");
  await page.keyboard.press("Escape");
  await expect(commandPalette).toBeHidden();

  await page.getByRole("button", { name: "Seleccionar Hub USB-C 7 en 1" }).click();

  const sheet = page.getByRole("dialog");
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("heading", { name: "Edición rápida" }).last()).toBeVisible();
  await expectNoHorizontalOverflow(page, "bottom sheet de edición rápida");

  await sheet.getByLabel("Precio", { exact: true }).fill("41000");
  await sheet.getByLabel("Stock", { exact: true }).fill("9");
  await sheet.getByRole("button", { name: "Guardar cambios" }).click();
  await expect(sheet.getByText("Cambios guardados.", { exact: true })).toBeVisible();
  await expectNoHorizontalOverflow(page, "bottom sheet con feedback");

  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();

  await page.goto("/admin/productos/nuevo", { waitUntil: "networkidle" });
  await expectNoHorizontalOverflow(page, "formulario de producto mobile");

  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.getByRole("status").filter({ hasText: "Modo demo tienda" })).toBeVisible();
  await expect(page.locator('#catalogo a[href^="/producto/"]').first()).toBeVisible();
  await expectNoHorizontalOverflow(page, "catálogo público mobile");
});
