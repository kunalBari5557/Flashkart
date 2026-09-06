import React, { useState, useEffect, useCallback } from "react";
import { Header, TEST_USERS } from "./components/Header";
import { FlashSaleHero } from "./components/FlashSaleHero";
import { ProductGrid } from "./components/ProductGrid";
import { ProductDetailModal } from "./components/ProductDetailModal";
import { CartDrawer } from "./components/CartDrawer";
import { CheckoutModal } from "./components/CheckoutModal";
import { OrderHistoryModal } from "./components/OrderHistoryModal";
import { ToastContainer } from "./components/ui/toast";
import type { ToastMessage } from "./components/ui/toast";
import { api } from "./lib/api";
import type { Product, Cart, Order, UserSim } from "./types/api.types";
import { generateUUID } from "./lib/utils";

export function App() {
  // Active state
  const [currentUser, setCurrentUser] = useState<UserSim>(TEST_USERS[0]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Cart | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isBackendHealthy, setIsBackendHealthy] = useState(true);

  // Loading flags
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  const [reservingProductId, setReservingProductId] = useState<string | null>(null);

  // Modals & Drawers
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isOrdersOpen, setIsOrdersOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Toast notification queue
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (type: ToastMessage["type"], title: string, message?: string) => {
    const id = generateUUID();
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch Health
  const checkHealth = useCallback(async () => {
    try {
      await api.checkHealth();
      setIsBackendHealthy(true);
    } catch {
      setIsBackendHealthy(false);
    }
  }, []);

  // Fetch Products
  const loadProducts = useCallback(async () => {
    setIsProductsLoading(true);
    try {
      const res = await api.getProducts();
      if (res.success && res.data) {
        setProducts(res.data);
      }
    } catch (err: any) {
      addToast("error", "Error Loading Products", err.message || "Could not fetch flash sale products.");
    } finally {
      setIsProductsLoading(false);
    }
  }, []);

  // Fetch Cart for Active User
  const loadCart = useCallback(async (userId: string) => {
    setIsCartLoading(true);
    try {
      const res = await api.getCart(userId);
      if (res.success && res.data) {
        setCart(res.data);
      } else {
        setCart(null);
      }
    } catch (err: any) {
      // 404 or empty cart is normal for new users
      setCart(null);
    } finally {
      setIsCartLoading(false);
    }
  }, []);

  // Fetch Orders for Active User
  const loadOrders = useCallback(async (userId: string) => {
    setIsOrdersLoading(true);
    try {
      const res = await api.getOrders(userId);
      if (res.success && res.data) {
        setOrders(res.data);
      } else {
        setOrders([]);
      }
    } catch (err: any) {
      setOrders([]);
    } finally {
      setIsOrdersLoading(false);
    }
  }, []);

  // Initial load & periodic polling
  useEffect(() => {
    checkHealth();
    loadProducts();
    loadCart(currentUser.id);

    // Refresh every 15s for live Redis reservation updates
    const interval = setInterval(() => {
      checkHealth();
      loadProducts();
      loadCart(currentUser.id);
    }, 15000);

    return () => clearInterval(interval);
  }, [currentUser.id, checkHealth, loadProducts, loadCart]);

  // Handle User Switch
  const handleSelectUser = (user: UserSim) => {
    setCurrentUser(user);
    addToast("info", "User Switched", `Now acting as ${user.name} (${user.email})`);
    loadCart(user.id);
    loadOrders(user.id);
  };

  // Stock Reservation Handler (POST /cart/reserve)
  const handleReserveStock = async (product: Product, quantity: number) => {
    setReservingProductId(product.id);
    const idempotencyKey = generateUUID();

    try {
      const res = await api.reserveStock(
        currentUser.id, 
        { productId: product.id, quantity }, 
        idempotencyKey
      );

      if (res.success) {
        addToast(
          "success", 
          "Stock Locked! ⚡", 
          `Reserved ${quantity} x ${product.name}. Items held for 300s.`
        );
        // Refresh products & cart
        loadProducts();
        loadCart(currentUser.id);
      }
    } catch (err: any) {
      const code = err.code || "";
      if (code === "INSUFFICIENT_STOCK") {
        addToast("error", "Stock Unavailable", "Not enough stock available in FlashKart Redis pool.");
      } else if (code === "RESERVATION_LIMIT_EXCEEDED") {
        addToast("warning", "Reservation Limit Reached", "Max 5 concurrent reservations allowed per user.");
      } else {
        addToast("error", "Reservation Failed", err.message || "Failed to reserve product.");
      }
    } finally {
      setReservingProductId(null);
    }
  };

  // Remove Item from Cart (DELETE /cart/items/:id)
  const handleRemoveCartItem = async (cartItemId: string) => {
    try {
      const res = await api.removeCartItem(currentUser.id, cartItemId);
      if (res.success) {
        addToast("info", "Stock Released", "Item removed from your reservation cart.");
        loadCart(currentUser.id);
        loadProducts();
      }
    } catch (err: any) {
      addToast("error", "Failed to Remove Item", err.message);
    }
  };

  // Clear Cart (DELETE /cart/:id)
  const handleClearCart = async (cartId: string) => {
    try {
      const res = await api.clearCart(currentUser.id, cartId);
      if (res.success) {
        addToast("info", "Cart Cleared", "All reserved stock returned to product pool.");
        loadCart(currentUser.id);
        loadProducts();
      }
    } catch (err: any) {
      addToast("error", "Failed to Clear Cart", err.message);
    }
  };

  // Checkout API Call (POST /order/checkout)
  const handlePerformCheckout = async (
    reservationId: string, 
    idempotencyKey: string
  ): Promise<Order> => {
    const res = await api.checkout(
      currentUser.id,
      { reservationId },
      idempotencyKey
    );

    if (res.success && res.data) {
      loadCart(currentUser.id);
      loadProducts();
      loadOrders(currentUser.id);
      return res.data;
    }
    throw new Error(res.error?.message || "Checkout failed.");
  };

  const cartItemCount = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-purple-600 selection:text-white">
      
      {/* Header Bar */}
      <Header
        currentUser={currentUser}
        onSelectUser={handleSelectUser}
        cartItemCount={cartItemCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenOrders={() => {
          loadOrders(currentUser.id);
          setIsOrdersOpen(true);
        }}
        isBackendHealthy={isBackendHealthy}
      />

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        
        {/* Hero Banner */}
        <FlashSaleHero onScrollToProducts={() => {
          const el = document.getElementById("flash-deals");
          el?.scrollIntoView({ behavior: "smooth" });
        }} />

        {/* Product Catalog Grid Section */}
        <div id="flash-deals">
          <ProductGrid
            products={products}
            isLoading={isProductsLoading}
            onRefresh={() => {
              loadProducts();
              loadCart(currentUser.id);
            }}
            onReserve={handleReserveStock}
            onViewDetails={(prod) => setSelectedProduct(prod)}
            reservingProductId={reservingProductId}
          />
        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 mt-16 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 FlashKart High-Concurrency Platform. Powered by React, Tailwind CSS, Redis & PostgreSQL.</p>
          <div className="flex items-center space-x-4">
            <span className="hover:text-slate-400 cursor-pointer" onClick={() => checkHealth()}>API Health</span>
            <span>•</span>
            <a href="http://localhost:3000/api/docs" target="_blank" rel="noreferrer" className="hover:text-purple-400">
              API Docs
            </a>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        isLoading={isCartLoading}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
        onRefreshCart={() => loadCart(currentUser.id)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onCheckoutSuccess={() => {
          addToast("success", "Order Confirmed! 🎉", "Your checkout was executed with idempotency key verification.");
        }}
        onPerformCheckout={handlePerformCheckout}
      />

      <OrderHistoryModal
        isOpen={isOrdersOpen}
        onClose={() => setIsOrdersOpen(false)}
        orders={orders}
        isLoading={isOrdersLoading}
        onRefreshOrders={() => loadOrders(currentUser.id)}
      />

      <ProductDetailModal
        product={selectedProduct}
        isOpen={!!selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onReserve={handleReserveStock}
        isReserving={!!reservingProductId}
      />

      {/* Global Toast Alerts */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}

export default App;
