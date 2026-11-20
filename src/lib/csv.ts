import { parsePriceInput, slugify } from "@/lib/format";
import type {
  Category,
  ImportPreview,
  ImportRow,
  Product,
  ProductStatus,
} from "@/lib/types";

export const IMPORT_HEADERS = [
  "nombre",
  "sku",
  "categoria",
  "descripcion",
  "precio",
  "stock",
  "estado",
] as const;

export const IMPORT_TEMPLATE = `nombre,sku,categoria,descripcion,precio,stock,estado
Auriculares inalámbricos Pro,NI-AUR-001,Auriculares,Auriculares over-ear con cancelación de ruido.,129900,6,publicado
Teclado mecánico RGB,NI-TEC-008,Teclados,Teclado mecánico con switches táctiles.,89900,14,borrador
`;

type CsvRecord = { values: string[]; line: number };

function detectDelimiter(text: string): "," | ";" {
  let inQuotes = false;
  let commas = 0;
  let semicolons = 0;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (char === '"') {
      if (inQuotes && text[index + 1] === '"') {
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (!inQuotes) {
      if (char === ",") commas += 1;
      if (char === ";") semicolons += 1;
      if (char === "\n") break;
    }
  }

  return semicolons > commas ? ";" : ",";
}

export function parseCsv(text: string): CsvRecord[] {
  const source = text.replace(/^\uFEFF/, "");
  const delimiter = detectDelimiter(source);
  const records: CsvRecord[] = [];

  let field = "";
  let row: string[] = [];
  let inQuotes = false;
  let line = 1;
  let recordLine = 1;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];

    if (inQuotes) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        if (char === "\n") line += 1;
        field += char;
      }
      continue;
    }

    if (char === '"' && field === "") {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      records.push({ values: row, line: recordLine });
      row = [];
      field = "";
      line += 1;
      recordLine = line;
    } else if (char !== "\r") {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    records.push({ values: row, line: recordLine });
  }

  return records.filter((record) => record.values.some((value) => value.trim() !== ""));
}

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function normalizeHeader(value: string) {
  return normalize(value).replace(/\s+/g, "_");
}

const HEADER_ALIASES: Record<string, string> = {
  nombre: "nombre",
  name: "nombre",
  producto: "nombre",
  sku: "sku",
  categoria: "categoria",
  category: "categoria",
  descripcion: "descripcion",
  description: "descripcion",
  precio: "precio",
  price: "precio",
  stock: "stock",
  cantidad: "stock",
  estado: "estado",
  status: "estado",
};

function parseStatus(value: string): ProductStatus | null {
  const normalized = normalize(value);
  if (!normalized) return "draft";
  if (["publicado", "published", "publicada"].includes(normalized)) return "published";
  if (["borrador", "draft", "borrador/a"].includes(normalized)) return "draft";
  if (["archivado", "archived", "archivada"].includes(normalized)) return "archived";
  return null;
}

export function buildImportPreview(
  csvText: string,
  categories: Pick<Category, "id" | "name">[],
  existingProducts: Pick<Product, "id" | "sku">[],
): ImportPreview {
  const empty: ImportPreview = {
    rows: [],
    createCount: 0,
    updateCount: 0,
    errorCount: 0,
    canApply: false,
  };

  if (!csvText.trim()) {
    return { ...empty, fatalError: "El archivo está vacío." };
  }

  const records = parseCsv(csvText);
  if (records.length === 0) {
    return { ...empty, fatalError: "No encontramos filas en el archivo." };
  }

  const headerRecord = records[0];
  const headerMap = new Map<string, number>();
  headerRecord.values.forEach((header, index) => {
    const canonical = HEADER_ALIASES[normalizeHeader(header)];
    if (canonical && !headerMap.has(canonical)) headerMap.set(canonical, index);
  });

  const required = ["nombre", "sku", "categoria", "precio", "stock"] as const;
  const missing = required.filter((header) => !headerMap.has(header));
  if (missing.length > 0) {
    return {
      ...empty,
      fatalError: `Faltan columnas obligatorias: ${missing.join(", ")}. Descargá la plantilla para ver el formato.`,
    };
  }

  const dataRecords = records.slice(1);
  if (dataRecords.length === 0) {
    return { ...empty, fatalError: "El archivo solo tiene encabezados. Agregá al menos un producto." };
  }
  if (dataRecords.length > 500) {
    return { ...empty, fatalError: "El archivo supera el máximo de 500 filas por importación." };
  }

  const existingBySku = new Map(existingProducts.map((product) => [product.sku.toUpperCase(), product]));
  const categoryByName = new Map(categories.map((category) => [normalize(category.name), category]));

  const get = (record: CsvRecord, key: string) => {
    const index = headerMap.get(key);
    return index === undefined ? "" : (record.values[index] ?? "").trim();
  };

  const skuCounts = new Map<string, number>();
  dataRecords.forEach((record) => {
    const sku = get(record, "sku").toUpperCase();
    if (sku) skuCounts.set(sku, (skuCounts.get(sku) ?? 0) + 1);
  });

  const rows: ImportRow[] = dataRecords.map((record, index) => {
    const raw: Record<string, string> = {};
    headerMap.forEach((position, key) => {
      raw[key] = (record.values[position] ?? "").trim();
    });

    const name = get(record, "nombre");
    const sku = get(record, "sku").toUpperCase();
    const categoryName = get(record, "categoria");
    const description = get(record, "descripcion");
    const priceRaw = get(record, "precio");
    const stockRaw = get(record, "stock");
    const statusRaw = get(record, "estado");
    const errors: string[] = [];

    if (name.length < 2) errors.push("El nombre debe tener al menos 2 caracteres.");
    if (name.length > 120) errors.push("El nombre supera los 120 caracteres.");

    if (!sku) {
      errors.push("El SKU es obligatorio.");
    } else if (!/^[A-Z0-9][A-Z0-9._-]*$/i.test(sku)) {
      errors.push("El SKU solo admite letras, números, puntos, guiones o guiones bajos.");
    } else if ((skuCounts.get(sku) ?? 0) > 1) {
      errors.push("SKU duplicado dentro del archivo.");
    }

    const category = categoryByName.get(normalize(categoryName));
    if (!categoryName) {
      errors.push("La categoría es obligatoria.");
    } else if (!category) {
      errors.push(`La categoría "${categoryName}" no existe.`);
    }

    if (description.length > 5000) errors.push("La descripción supera los 5000 caracteres.");

    const price = parsePriceInput(priceRaw);
    if (price === null) errors.push("El precio no es un número válido.");
    else if (price < 0) errors.push("El precio no puede ser negativo.");

    const stockNumber = stockRaw.replace(/\s/g, "");
    const stock = stockNumber === "" ? null : Number(stockNumber);
    if (stock === null || !Number.isInteger(stock) || stock < 0) {
      errors.push("El stock debe ser un entero mayor o igual a 0.");
    }

    const productStatus = parseStatus(statusRaw);
    if (!productStatus) {
      errors.push('El estado debe ser "borrador", "publicado" o "archivado".');
    }

    const isUpdate = Boolean(sku && existingBySku.has(sku));
    const status = errors.length > 0 ? "error" : isUpdate ? "update" : "create";

    return {
      line: record.line,
      status,
      sku,
      name,
      categoryName,
      price,
      stock,
      productStatus,
      errors,
      raw: {
        ...raw,
        descripcion: description,
      },
    };
  });

  const createCount = rows.filter((row) => row.status === "create").length;
  const updateCount = rows.filter((row) => row.status === "update").length;
  const errorCount = rows.filter((row) => row.status === "error").length;

  return {
    rows,
    createCount,
    updateCount,
    errorCount,
    canApply: errorCount === 0,
  };
}

export function buildSlugBase(name: string, sku: string) {
  return slugify(name) || slugify(sku) || "producto";
}
