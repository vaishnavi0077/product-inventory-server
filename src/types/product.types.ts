export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  stockQuantity: number;
  createdAt: string; 
  updatedAt: string;
}


export interface CreateProductInput {
  name: string;
  category: string;
  price: number;
  stockQuantity: number;
}


export type UpdateProductInput = Partial<CreateProductInput>;


export interface ProductFilters {
  category?: string;
  inStock?: boolean;
}