import { rm } from "node:fs/promises";
import path from "node:path";

/**
 * Cada corrida E2E usa su propia base demo y su propia carpeta de uploads,
 * así no toca los datos locales de desarrollo.
 */
export default async function globalSetup() {
  await rm(path.join(process.cwd(), ".data", "e2e"), {
    recursive: true,
    force: true,
  });
  await rm(path.join(process.cwd(), "public", "uploads", "e2e"), {
    recursive: true,
    force: true,
  });
}
