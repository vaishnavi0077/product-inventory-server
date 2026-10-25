import path from "node:path";

// Load variables from .env if the file exists (built into Node 20.12+).
// If there is no .env file, we silently fall back to the defaults below.
try {
  process.loadEnvFile();
} catch {
  // no .env file, that's fine
}

const parsedPort = Number(process.env.PORT);

export const PORT: number =
  Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3000;

export const DATA_FILE: string = path.resolve(
  process.cwd(),
  process.env.DATA_FILE ?? "data/products.json"
);