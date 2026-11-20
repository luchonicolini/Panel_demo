import { describe, expect, it } from "vitest";
import {
  formatCurrency,
  formatPriceInput,
  parsePriceInput,
  slugify,
  whatsappLink,
} from "@/lib/format";

describe("parsePriceInput", () => {
  it.each([
    ["129900", 129900],
    ["129.900", 129900],
    ["55.500", 55500],
    ["1.000", 1000],
    ["129.900,50", 129900.5],
    ["129.9", 129.9],
    ["$ 79.900", 79900],
  ])("interpreta %s como %d", (input, expected) => {
    expect(parsePriceInput(input)).toBe(expected);
  });

  it("devuelve null para valores vacíos o no numéricos", () => {
    expect(parsePriceInput("")).toBeNull();
    expect(parsePriceInput("   ")).toBeNull();
    expect(parsePriceInput("abc")).toBeNull();
  });
});

describe("formatPriceInput", () => {
  it("usa separador de miles argentino", () => {
    expect(formatPriceInput(129900)).toBe("129.900");
    expect(formatPriceInput(1000)).toBe("1.000");
  });
});

describe("formatCurrency", () => {
  it("formatea pesos sin decimales", () => {
    expect(formatCurrency(129900)).toBe("$ 129.900");
  });
});

describe("slugify", () => {
  it("quita acentos y normaliza separadores", () => {
    expect(slugify("Auriculares inalámbricos Pro")).toBe("auriculares-inalambricos-pro");
    expect(slugify("  Teclado / RGB  ")).toBe("teclado-rgb");
  });
});

describe("whatsappLink", () => {
  it("incluye el mensaje codificado y solo los dígitos del teléfono", () => {
    const link = whatsappLink("+54 9 11 0000-0000", "Hola Nicolini Import!");
    expect(link).toBe("https://wa.me/5491100000000?text=Hola%20Nicolini%20Import!");
  });
});
