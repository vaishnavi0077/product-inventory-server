export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stockQuantity: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// What the client must send to create a product
export interface CreateProductInput {
  name: string;
  category: string;
  price: number;
  stockQuantity: number;
}

// For PATCH: every field is optional, but at least one must be present
export type UpdateProductInput = Partial<CreateProductInput>;

// Parsed query params for GET /products
export interface ProductFilters {
  category?: string;
  inStock?: boolean;
}