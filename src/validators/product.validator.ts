import { ValidationError } from "../utils/errors.js";
import type {
  CreateProductInput,
  ProductFilters,
  UpdateProductInput,
} from "../types/product.types.js";

const ALLOWED_FIELDS = ["name", "category", "price", "stockQuantity"] as const;
type Field = (typeof ALLOWED_FIELDS)[number];

const MAX_TEXT_LENGTH = 100;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Returns an error message if the value is invalid, or null if it is fine.
function checkField(field: Field, value: unknown): string | null {
  switch (field) {
    case "name":
    case "category": {
      if (typeof value !== "string" || value.trim() === "") {
        return `${field} must be a non-empty string`;
      }
      if (value.trim().length > MAX_TEXT_LENGTH) {
        return `${field} must be at most ${MAX_TEXT_LENGTH} characters`;
      }
      return null;
    }
    case "price": {
      if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
        return "price must be a non-negative number";
      }
      return null;
    }
    case "stockQuantity": {
      if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
        return "stockQuantity must be a non-negative integer";
      }
      return null;
    }
  }
}

function findUnknownFields(body: Record<string, unknown>): string[] {
  return Object.keys(body)
    .filter((key) => !(ALLOWED_FIELDS as readonly string[]).includes(key))
    .map((key) => `Unknown field: ${key}`);
}

// Trim strings, leave numbers as they are
function clean(field: Field, value: unknown): string | number {
  return field === "name" || field === "category"
    ? (value as string).trim()
    : (value as number);
}

// ---------- POST /products ----------
export function validateCreateProduct(body: unknown): CreateProductInput {
  if (!isPlainObject(body)) {
    throw new ValidationError("Request body must be a JSON object");
  }

  const errors: string[] = [];

  for (const field of ALLOWED_FIELDS) {
    if (body[field] === undefined) {
      errors.push(`${field} is required`);
      continue;
    }
    const error = checkField(field, body[field]);
    if (error) errors.push(error);
  }

  errors.push(...findUnknownFields(body));

  if (errors.length > 0) throw new ValidationError("Validation failed", errors);

  return {
    name: clean("name", body.name) as string,
    category: clean("category", body.category) as string,
    price: body.price as number,
    stockQuantity: body.stockQuantity as number,
  };
}

// ---------- PATCH /products/:id ----------
export function validateUpdateProduct(body: unknown): UpdateProductInput {
  if (!isPlainObject(body)) {
    throw new ValidationError("Request body must be a JSON object");
  }

  const errors: string[] = [];
  const result: Record<string, string | number> = {};

  for (const field of ALLOWED_FIELDS) {
    if (body[field] === undefined) continue; // optional in PATCH
    const error = checkField(field, body[field]);
    if (error) errors.push(error);
    else result[field] = clean(field, body[field]);
  }

  errors.push(...findUnknownFields(body));

  if (errors.length === 0 && Object.keys(result).length === 0) {
    errors.push(`Provide at least one field to update: ${ALLOWED_FIELDS.join(", ")}`);
  }

  if (errors.length > 0) throw new ValidationError("Validation failed", errors);

  return result as UpdateProductInput;
}

// ---------- GET /products?category=...&inStock=... ----------
export function validateFilters(query: URLSearchParams): ProductFilters {
  const filters: ProductFilters = {};
  const errors: string[] = [];

  const category = query.get("category");
  if (category !== null) {
    if (category.trim() === "") errors.push("category filter must not be empty");
    else filters.category = category.trim();
  }

  const inStock = query.get("inStock");
  if (inStock !== null) {
    if (inStock === "true") filters.inStock = true;
    else if (inStock === "false") filters.inStock = false;
    else errors.push('inStock must be "true" or "false"');
  }

  if (errors.length > 0) throw new ValidationError("Invalid query parameters", errors);

  return filters;
}