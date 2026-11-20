import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("command palette: atajo, búsqueda de producto y navegación", async ({ page }) => {
  await login(page);

  await page.keyboard.press("Control+K");
  const dialog = page.getByRole("dialog", { name: "Buscar en el panel" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("combobox")).toBeFocused();

  await dialog.getByRole("combobox").fill("auriculares");
  await expect(
    dialog.getByRole("option", { name: /Auriculares inalámbricos Pro/ }),
  ).toBeVisible();

  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");

  await expect(page).toHaveURL(
    /\/admin\/productos\/b1000000-0000-4000-8000-000000000001$/,
  );
  await expect(page.getByRole("heading", { name: "Editar producto" })).toBeVisible();
});
