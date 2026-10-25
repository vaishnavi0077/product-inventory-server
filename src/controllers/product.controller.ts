import type { IncomingMessage, ServerResponse } from "node:http";
import * as service from "../services/product.service.js";
import {
  validateCreateProduct,
  validateFilters,
  validateUpdateProduct,
} from "../validators/product.validator.js";
import { parseBody, sendJson } from "../utils/http.js";

// GET /health
export async function health(_req: IncomingMessage, res: ServerResponse): Promise<void> {
  sendJson(res, 200, { status: "ok", uptime: process.uptime() });
}

// POST /products
export async function createProduct(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const body = await parseBody(req);
  const input = validateCreateProduct(body);
  const product = await service.createProduct(input);
  sendJson(res, 201, product);
}

// GET /products?category=...&inStock=...
export async function getProducts(
  _req: IncomingMessage,
  res: ServerResponse,
  _params: Record<string, string>,
  query: URLSearchParams
): Promise<void> {
  const filters = validateFilters(query);
  const products = await service.getProducts(filters);
  sendJson(res, 200, { count: products.length, data: products });
}

// GET /products/:id
export async function getProductById(
  _req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>
): Promise<void> {
  const product = await service.getProductById(params.id);
  sendJson(res, 200, product);
}

// PATCH /products/:id
export async function updateProduct(
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>
): Promise<void> {
  const body = await parseBody(req);
  const changes = validateUpdateProduct(body);
  const product = await service.updateProduct(params.id, changes);
  sendJson(res, 200, product);
}

// DELETE /products/:id
export async function deleteProduct(
  _req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>
): Promise<void> {
  await service.deleteProduct(params.id);
  sendJson(res, 200, { message: "Product deleted successfully" });
}