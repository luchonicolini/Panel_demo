import { describe, expect, it } from "vitest";
import { buildImportPreview, IMPORT_TEMPLATE } from "@/lib/csv";

const categories = [
  { id: "cat-1", name: "Auriculares" },
  { id: "cat-2", name: "Teclados" },
];

const existing = [{ id: "prod-1", sku: "NI-AUR-001" }];

function preview(csv: string) {
  return buildImportPreview(csv, categories, existing);
}

describe("buildImportPreview", () => {
  it("acepta la plantilla descargable", () => {
    const result = preview(IMPORT_TEMPLATE);
    expect(result.fatalError).toBeUndefined();
    expect(result.errorCount).toBe(0);
    expect(result.createCount).toBe(1);
    expect(result.updateCount).toBe(1);
    expect(result.canApply).toBe(true);
  });

  it("marca como actualización un SKU existente", () => {
    const result = preview(
      [
        "nombre,sku,categoria,precio,stock,estado",
        "Auriculares Pro,NI-AUR-001,Auriculares,129900,6,publicado",
      ].join("\n"),
    );

    expect(result.updateCount).toBe(1);
    expect(result.createCount).toBe(0);
    expect(result.rows[0]?.status).toBe("update");
  });

  it("rechaza SKU duplicados dentro del archivo", () => {
    const result = preview(
      [
        "nombre,sku,categoria,precio,stock,estado",
        "Producto uno,DUP-1,Auriculares,1000,5,publicado",
        "Producto dos,DUP-1,Auriculares,2000,3,publicado",
      ].join("\n"),
    );

    expect(result.errorCount).toBe(2);
    expect(result.canApply).toBe(false);
    expect(result.rows[0]?.errors).toContain("SKU duplicado dentro del archivo.");
  });

  it("rechaza categorías inexistentes y precios inválidos", () => {
    const result = preview(
      [
        "nombre,sku,categoria,precio,stock,estado",
        "Producto raro,NEW-9,Categoría inexistente,abc,5,publicado",
      ].join("\n"),
    );

    expect(result.errorCount).toBe(1);
    expect(result.rows[0]?.errors.join(" ")).toContain("no existe");
    expect(result.rows[0]?.errors.join(" ")).toContain("precio no es un número válido");
  });

  it("normaliza acentos y mayúsculas al buscar la categoría", () => {
    const result = preview(
      [
        "nombre,sku,categoria,precio,stock,estado",
        "Producto ok,NEW-10,AURICULARES,1000,5,borrador",
      ].join("\n"),
    );

    expect(result.errorCount).toBe(0);
    expect(result.rows[0]?.categoryName).toBe("AURICULARES");
  });

  it("detecta columnas obligatorias faltantes", () => {
    const result = preview("nombre,sku\nProducto,NEW-1");
    expect(result.fatalError).toContain("Faltan columnas obligatorias");
    expect(result.canApply).toBe(false);
  });

  it("acepta punto y coma como delimitador", () => {
    const result = preview(
      [
        "nombre;sku;categoria;precio;stock;estado",
        "Producto punto y coma;NEW-11;Auriculares;1500;2;publicado",
      ].join("\n"),
    );

    expect(result.errorCount).toBe(0);
    expect(result.createCount).toBe(1);
  });
});
