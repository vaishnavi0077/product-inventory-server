import { randomUUID } from "node:crypto";
import * as repository from "../repositories/product.repository.js";
import { NotFoundError } from "../utils/errors.js";
import type {
  CreateProductInput,
  Product,
  ProductFilters,
  UpdateProductInput,
} from "../types/product.types.js";

export async function createProduct(input: CreateProductInput): Promise<Product> {
  const now = new Date().toISOString();

  const product: Product = {
    id: randomUUID(),
    name: input.name,
    category: input.category,
    price: input.price,
    stockQuantity: input.stockQuantity,
    createdAt: now,
    updatedAt: now,
  };

  return repository.create(product);
}

export async function getProducts(filters: ProductFilters = {}): Promise<Product[]> {
  const products = await repository.findAll();
  return products.filter((product) => {
    
    if (
      filters.category !== undefined &&
      product.category.toLowerCase() !== filters.category.toLowerCase()
    ) {
      return false;
    }

    // inStock=true  -> stockQuantity > 0
    // inStock=false -> stockQuantity === 0
    if (filters.inStock !== undefined) {
      const isInStock = product.stockQuantity > 0;
      if (isInStock !== filters.inStock) return false;
    }

    return true;
  });
}

export async function getProductById(id: string): Promise<Product> {
  const product = await repository.findById(id);
  if (!product) {
    throw new NotFoundError(`Product with id ${id} not found`);
  }
  return product;
}

export async function updateProduct(
  id: string,
  changes: UpdateProductInput
): Promise<Product> {
  const updated = await repository.update(id, (existing) => ({
    ...existing,
    ...changes,
    id: existing.id,              
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString(),
  }));

  if (!updated) {
    throw new NotFoundError(`Product with id ${id} not found`);
  }
  return updated;
}

export async function deleteProduct(id: string): Promise<void> {
  const deleted = await repository.remove(id);
  if (!deleted) {
    throw new NotFoundError(`Product with id ${id} not found`);
  }
}