import type { 
  Product, 
  Cart, 
  Order, 
  ApiResponse, 
  ReserveStockPayload, 
  CheckoutPayload 
} from "../types/api.types";
import { generateUUID } from "./utils";

const API_BASE_URL = "http://localhost:3000";

async function fetchApi<T>(
  endpoint: string, 
  options: RequestInit & { userId?: string; idempotencyKey?: string } = {}
): Promise<T> {
  const { userId, idempotencyKey, headers = {}, ...rest } = options;

  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...((headers as Record<string, string>) || {}),
  };

  if (userId) {
    reqHeaders["Authorization"] = `Bearer ${userId}`;
  }

  if (idempotencyKey) {
    reqHeaders["Idempotency-Key"] = idempotencyKey;
  }

  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const response = await fetch(url, {
      ...rest,
      headers: reqHeaders,
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data?.error?.message || data?.message || `HTTP error ${response.status}`;
      const errorCode = data?.error?.code || 'API_ERROR';
      const err = new Error(errorMessage);
      (err as any).code = errorCode;
      (err as any).status = response.status;
      (err as any).data = data;
      throw err;
    }

    return data as T;
  } catch (err: any) {
    console.error(`[API Error] ${endpoint}:`, err);
    throw err;
  }
}

export const api = {
  // Health
  checkHealth: async () => {
    return fetchApi<{ status: string; timestamp: string }>("/health");
  },

  // Products
  getProducts: async (): Promise<ApiResponse<Product[]>> => {
    return fetchApi<ApiResponse<Product[]>>("/products");
  },

  getProductById: async (productId: string): Promise<ApiResponse<Product>> => {
    return fetchApi<ApiResponse<Product>>(`/products/${productId}`);
  },

  // Cart & Reservations
  reserveStock: async (
    userId: string, 
    payload: ReserveStockPayload, 
    idempotencyKey?: string
  ): Promise<ApiResponse<any>> => {
    const key = idempotencyKey || generateUUID();
    return fetchApi<ApiResponse<any>>("/cart/reserve", {
      method: "POST",
      userId,
      idempotencyKey: key,
      body: JSON.stringify(payload),
    });
  },

  getCart: async (userId: string): Promise<ApiResponse<Cart>> => {
    return fetchApi<ApiResponse<Cart>>("/cart", {
      method: "GET",
      userId,
    });
  },

  removeCartItem: async (userId: string, cartItemId: string): Promise<ApiResponse<any>> => {
    return fetchApi<ApiResponse<any>>(`/cart/items/${cartItemId}`, {
      method: "DELETE",
      userId,
    });
  },

  clearCart: async (userId: string, cartId: string): Promise<ApiResponse<any>> => {
    return fetchApi<ApiResponse<any>>(`/cart/${cartId}`, {
      method: "DELETE",
      userId,
    });
  },

  // Checkout & Orders
  checkout: async (
    userId: string, 
    payload: CheckoutPayload, 
    idempotencyKey?: string
  ): Promise<ApiResponse<Order>> => {
    const key = idempotencyKey || generateUUID();
    return fetchApi<ApiResponse<Order>>("/order/checkout", {
      method: "POST",
      userId,
      idempotencyKey: key,
      body: JSON.stringify(payload),
    });
  },

  getOrders: async (userId: string): Promise<ApiResponse<Order[]>> => {
    return fetchApi<ApiResponse<Order[]>>("/order", {
      method: "GET",
      userId,
    });
  },

  getOrderById: async (userId: string, orderId: string): Promise<ApiResponse<Order>> => {
    return fetchApi<ApiResponse<Order>>(`/order/${orderId}`, {
      method: "GET",
      userId,
    });
  },
};
