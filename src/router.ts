import type { IncomingMessage, ServerResponse } from "node:http";
import * as controller from "./controllers/product.controller.js";
import { AppError, NotFoundError } from "./utils/errors.js";

// Every controller function has this shape
type Handler = (
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
  query: URLSearchParams
) => Promise<void>;

interface Route {
  method: string;
  path: string;
  handler: Handler;
}

// All the routes of our API in one place
const routes: Route[] = [
  { method: "GET", path: "/health", handler: controller.health },
  { method: "POST", path: "/products", handler: controller.createProduct },
  { method: "GET", path: "/products", handler: controller.getProducts },
  { method: "GET", path: "/products/:id", handler: controller.getProductById },
  { method: "PATCH", path: "/products/:id", handler: controller.updateProduct },
  { method: "DELETE", path: "/products/:id", handler: controller.deleteProduct },
];

// Checks if the request path matches a route path.
// Example: route "/products/:id" and request "/products/abc"
// returns { id: "abc" }. If it does not match, it returns null.
function matchPath(
  routePath: string,
  requestPath: string
): Record<string, string> | null {
  const routeParts = routePath.split("/");
  const requestParts = requestPath.split("/");

  // Different number of parts means it can never match
  if (routeParts.length !== requestParts.length) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < routeParts.length; i++) {
    const routePart = routeParts[i];
    const requestPart = requestParts[i];

    if (routePart.startsWith(":")) {
      // This part is a variable like :id, so save its value
      if (requestPart === "") return null;
      const name = routePart.slice(1);
      params[name] = decodeURIComponent(requestPart);
    } else if (routePart !== requestPart) {
      // This part is fixed text and it does not match
      return null;
    }
  }

  return params;
}

export async function handleRoute(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
  query: URLSearchParams
): Promise<void> {
  // Remove a trailing slash so "/products/" works like "/products"
  const path = pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
  const method = req.method ?? "GET";

  // Becomes true if the path exists but with a different method
  let pathFound = false;

  for (const route of routes) {
    const params = matchPath(route.path, path);

    // Path does not match this route, check the next one
    if (params === null) continue;

    pathFound = true;

    // Path matches, but the method is different (for example PUT)
    if (route.method !== method) continue;

    await route.handler(req, res, params, query);
    return;
  }

  // The path exists, but this method is not allowed on it
  if (pathFound) {
    throw new AppError(405, `Method ${method} not allowed on ${path}`);
  }

  // No route matched at all
  throw new NotFoundError(`Route ${method} ${path} not found`);
}