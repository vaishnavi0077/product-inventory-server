import type { IncomingMessage, ServerResponse } from "node:http";
import * as controller from "./controllers/product.controller.js";
import { AppError, NotFoundError } from "./utils/errors.js";

type Handler = (
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
  query: URLSearchParams
) => Promise<void>;

interface Route {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: Handler;
}

// Turns "/products/:id" into a regex and remembers the param names ["id"]
function route(method: string, path: string, handler: Handler): Route {
  const paramNames: string[] = [];
  const regexSource = path.replace(/:([A-Za-z]+)/g, (_match, name: string) => {
    paramNames.push(name);
    return "([^/]+)";
  });
  return { method, pattern: new RegExp(`^${regexSource}$`), paramNames, handler };
}

const routes: Route[] = [
  route("GET", "/health", controller.health),
  route("POST", "/products", controller.createProduct),
  route("GET", "/products", controller.getProducts),
  route("GET", "/products/:id", controller.getProductById),
  route("PATCH", "/products/:id", controller.updateProduct),
  route("DELETE", "/products/:id", controller.deleteProduct),
];

export async function handleRoute(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  query: URLSearchParams
): Promise<void> {
  // Remove a trailing slash so "/products/" works like "/products"
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const method = req.method ?? "GET";

  let pathMatched = false;

  for (const r of routes) {
    const match = r.pattern.exec(path);
    if (!match) continue;

    pathMatched = true;
    if (r.method !== method) continue;

    const params: Record<string, string> = {};
    r.paramNames.forEach((name, i) => {
      params[name] = decodeURIComponent(match[i + 1]);
    });

    await r.handler(req, res, params, query);
    return;
  }

  if (pathMatched) {
    throw new AppError(405, `Method ${method} not allowed on ${path}`);
  }
  throw new NotFoundError(`Route ${method} ${path} not found`);
}