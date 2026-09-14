export interface Product {
  id: string;
  name: string;
  sku: string;
  description: string;
  price: number;
  stock: number;
  status: 'active' | 'inactive' | 'out_of_stock';
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  product: Product;
  quantity: number;
  reservationId: string;
  reservationExpiresAt?: string;
  expiresAt?: string;
  createdAt?: string;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  priceAtPurchase: number;
  quantity: number;
  subtotal: number;
}

export interface Order {
  id: string;
  userId: string;
  status: 'CREATED' | 'PAID' | 'FULFILLED' | 'CANCELLED';
  totalAmount: number;
  shippingAddress: string;
  paymentMethod: string;
  idempotencyKey: string;
  items: OrderItem[];
  createdAt: string;
}

export interface UserSim {
  id: string;
  name: string;
  email: string;
  role?: string;
  avatarColor: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}

export interface ReserveStockPayload {
  productId: string;
  quantity: number;
}

export interface CheckoutPayload {
  reservationId: string;
}
