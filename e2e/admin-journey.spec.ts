import { expect, test } from "@playwright/test";
import { promises as fs } from "node:fs";
import path from "node:path";
import { PRODUCT_PNG_BASE64 } from "./credentials";
import { login } from "./helpers";

const DB_PATH = path.join(process.cwd(), ".data", "e2e", "demo-db.json");

test("recorrido completo: borrador, publicación, edición rápida, CSV inválido y archivo", async ({
  page,
}) => {
  const suffix = Date.now().toString(36);
  const name = `Producto E2E ${suffix}`;
  const sku = `E2E-${suffix}`.toUpperCase();
  const slug = `producto-e2e-${suffix}`;
  const consoleErrors: string[] = [];

  page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().includes("Failed to load resource")) {
      consoleErrors.push(`console: ${message.text()}`);
    }
  });

  await login(page);

  await test.step("crear producto con foto y guardarlo como borrador", async () => {
    await page.getByRole("link", { name: "Nuevo producto" }).first().click();
    await page.waitForURL("**/admin/productos/nuevo");

    await page.locator("#name").fill(name);
    await page.locator("#sku").fill(sku);
    await page
      .locator("#description")
      .fill("Producto creado por el test E2E del starter.");
    await page.locator("#price").fill("129900");
    await page.locator("#stock").fill("8");
    await page.locator('input[type="file"][accept*="image"]').setInputFiles({
      name: "producto.png",
      mimeType: "image/png",
      buffer: Buffer.from(PRODUCT_PNG_BASE64, "base64"),
    });
    await expect(page.locator('img[alt="Foto nueva"]')).toBeVisible();

    await page.getByRole("button", { name: "Guardar producto" }).click();
    await page.waitForURL(/\/admin\/productos(\?|$)/, { timeout: 20_000 });
    await expect(page.getByText("Producto creado.", { exact: true })).toBeVisible();

    const row = page.locator("div.group").filter({ hasText: sku }).first();
    await expect(row.getByText("Borrador", { exact: true }).first()).toBeVisible();
    await expect(row.locator('img[src*="/uploads/e2e/"]').first()).toBeVisible();
  });

  await test.step("publicar y verificar la tienda pública", async () => {
    let row = page.locator("div.group").filter({ hasText: sku }).first();
    await row.locator('button[aria-label^="Acciones para"]:visible').click();
    await page.getByRole("menuitem", { name: "Publicar" }).click();
    await expect(
      page.getByText("Producto publicado en la tienda.", { exact: true }),
    ).toBeVisible();

    row = page.locator("div.group").filter({ hasText: sku }).first();
    await expect(row.getByText("Publicado", { exact: true }).first()).toBeVisible();

    await page.goto(`/producto/${slug}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("heading", { level: 1, name })).toBeVisible();
    await expect(page.locator("body")).toContainText("129.900");
    await expect(page.locator("body")).toContainText("Últimas unidades");
    await expect(page.locator('img[src*="/uploads/e2e/"]').first()).toBeVisible();

    await page.goto("/", { waitUntil: "networkidle" });
    await expect(
      page.locator(`#catalogo a[href="/producto/${slug}"]`).first(),
    ).toBeVisible();
  });

  await test.step("editar precio y stock desde el panel lateral", async () => {
    await page.goto("/admin/productos", { waitUntil: "networkidle" });
    const row = page.locator("div.group").filter({ hasText: sku }).first();
    await row.locator('button[title="Seleccionar para edición rápida"]').click();

    const quick = page.locator("aside").filter({ hasText: "Edición rápida" });
    await quick.getByLabel("Precio", { exact: true }).fill("55500");
    await quick.getByLabel("Stock", { exact: true }).fill("3");
    await quick.getByRole("button", { name: "Guardar cambios" }).click();
    await expect(quick.getByText("Cambios guardados.", { exact: true })).toBeVisible();

    await expect(row.getByText(/55\.500/).first()).toBeVisible();
    await expect(row.getByText("3 u.", { exact: true }).first()).toBeVisible();

    await page.goto(`/producto/${slug}`, { waitUntil: "networkidle" });
    await expect(page.locator("body")).toContainText("55.500");
    await expect(page.locator("body")).toContainText("Últimas unidades");
  });

  await test.step("rechazar un CSV inválido sin modificar datos", async () => {
    const before = JSON.parse(await fs.readFile(DB_PATH, "utf8")) as {
      products: Array<{ sku: string }>;
    };
    const beforeSkus = before.products.map((product) => product.sku).sort();

    await page.goto("/admin/productos", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: "Importar CSV" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const invalidCsv = [
      "nombre,sku,categoria,descripcion,precio,stock,estado",
      "Producto CSV inválido,CSV-INVALID-1,Categoría inexistente,,1000,5,publicado",
      "Otro producto inválido,CSV-INVALID-1,Auriculares,,2000,3,publicado",
    ].join("\n");

    await dialog.locator('input[type="file"][accept*=".csv"]').setInputFiles({
      name: "invalido.csv",
      mimeType: "text/csv",
      buffer: Buffer.from(invalidCsv, "utf8"),
    });

    await expect(dialog.getByText(/SKU duplicado dentro del archivo/).first()).toBeVisible();
    await expect(dialog.getByText(/no existe/).first()).toBeVisible();
    await expect(dialog.getByText("Con errores", { exact: true }).first()).toBeVisible();

    await dialog.getByRole("button", { name: "Aplicar cambios" }).click();
    await expect(dialog.getByText(/No se aplicó ningún cambio/).first()).toBeVisible();
    await expect(dialog).toBeVisible();

    await dialog.getByRole("button", { name: "Cancelar" }).click();
    await page.getByLabel("Buscar por nombre o SKU").fill("CSV-INVALID");
    await expect(page.getByText("No encontramos productos")).toBeVisible();

    const after = JSON.parse(await fs.readFile(DB_PATH, "utf8")) as {
      products: Array<{ sku: string }>;
    };
    expect(after.products.map((product) => product.sku).sort()).toEqual(beforeSkus);
  });

  await test.step("archivar y confirmar que desaparece de la tienda", async () => {
    await page.goto("/admin/productos", { waitUntil: "networkidle" });
    const row = page.locator("div.group").filter({ hasText: sku }).first();
    await row.locator('button[aria-label^="Acciones para"]:visible').click();
    await page.getByRole("menuitem", { name: "Archivar" }).click();
    await expect(page.getByRole("heading", { name: "Archivar producto" })).toBeVisible();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Archivar", exact: true })
      .click();
    await expect(
      page.getByText("Producto archivado. Ya no aparece en la tienda.", { exact: true }),
    ).toBeVisible();

    const archivedRow = page.locator("div.group").filter({ hasText: sku }).first();
    await expect(archivedRow.getByText("Archivado", { exact: true }).first()).toBeVisible();

    const response = await page.goto(`/producto/${slug}`, { waitUntil: "networkidle" });
    expect(response?.status()).toBe(404);
    await expect(
      page.getByText("Este producto no está disponible", { exact: true }),
    ).toBeVisible();

    await page.goto("/", { waitUntil: "networkidle" });
    await expect(page.locator(`a[href="/producto/${slug}"]`)).toHaveCount(0);
  });

  expect(consoleErrors).toEqual([]);
});
