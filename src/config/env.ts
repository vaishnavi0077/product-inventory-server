import path from "node:path";

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