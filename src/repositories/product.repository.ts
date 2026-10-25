import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { DATA_FILE } from "../config/env.js";
import type { Product } from "../types/product.types.js";

// ---------- Write lock ----------
// Every create/update/delete is a read-modify-write cycle. If two requests
// ran at the same time, one could overwrite the other's changes.
// This promise chain makes writes run one after another.
let writeQueue: Promise<unknown> = Promise.resolve();

function withWriteLock<T>(task: () => Promise<T>): Promise<T> {
  const result = writeQueue.then(task);
  writeQueue = result.catch(() => undefined); // keep the queue alive after errors
  return result;
}

// ---------- Low-level file helpers ----------
async function readAll(): Promise<Product[]> {
  let raw: string;
  try {
    raw = await readFile(DATA_FILE, "utf-8");
  } catch (err) {
    // File does not exist yet: treat it as an empty inventory
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }

  if (raw.trim() === "") return [];

  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed)) {
    throw new Error("Data file is corrupted: expected a JSON array");
  }
  return parsed as Product[];
}

async function writeAll(products: Product[]): Promise<void> {
  await mkdir(path.dirname(DATA_FILE), { recursive: true });

  // Write to a temp file first, then rename it over the real file.
  // If the process crashes mid-write, products.json is never left half-written.
  const tempFile = `${DATA_FILE}.tmp`;
  await writeFile(tempFile, JSON.stringify(products, null, 2), "utf-8");
  await rename(tempFile, DATA_FILE);
}

// ---------- Public API ----------
export async function findAll(): Promise<Product[]> {
  return readAll();
}

export async function findById(id: string): Promise<Product | undefined> {
  const products = await readAll();
  return products.find((p) => p.id === id);
}

export function create(product: Product): Promise<Product> {
  return withWriteLock(async () => {
    const products = await readAll();
    products.push(product);
    await writeAll(products);
    return product;
  });
}

// The service passes a function that receives the existing product and
// returns the updated one. Returns undefined if the id doesn't exist.
export function update(
  id: string,
  updater: (existing: Product) => Product
): Promise<Product | undefined> {
  return withWriteLock(async () => {
    const products = await readAll();
    const index = products.findIndex((p) => p.id === id);
    if (index === -1) return undefined;

    const updated = updater(products[index]);
    products[index] = updated;
    await writeAll(products);
    return updated;
  });
}

// Returns true if something was deleted, false if the id wasn't found.
export function remove(id: string): Promise<boolean> {
  return withWriteLock(async () => {
    const products = await readAll();
    const remaining = products.filter((p) => p.id !== id);
    if (remaining.length === products.length) return false;

    await writeAll(remaining);
    return true;
  });
}