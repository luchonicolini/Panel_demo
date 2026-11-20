import { promises as fs } from "node:fs";
import path from "node:path";
import { demoSeed, type DemoDb } from "@/lib/demo/seed";

const DATA_DIR = process.env.DEMO_DATA_DIR
  ? path.resolve(process.env.DEMO_DATA_DIR)
  : path.join(process.cwd(), ".data");
const DB_PATH = path.join(DATA_DIR, "demo-db.json");

let queue: Promise<unknown> = Promise.resolve();

export async function readDemoDb(): Promise<DemoDb> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    return JSON.parse(raw) as DemoDb;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      const seed = structuredClone(demoSeed);
      await writeDemoDb(seed);
      return seed;
    }
    throw error;
  }
}

export async function writeDemoDb(db: DemoDb) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(db, null, 2), "utf8");
}

/**
 * Serializa las operaciones de escritura para evitar condiciones de carrera
 * entre dos requests que editan el mismo archivo JSON.
 */
export function withDemoDb<T>(mutate: (db: DemoDb) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const db = await readDemoDb();
    const result = await mutate(db);
    await writeDemoDb(db);
    return result;
  });

  queue = run.then(
    () => undefined,
    () => undefined,
  );

  return run;
}

export async function resetDemoDb() {
  await writeDemoDb(structuredClone(demoSeed));
}
