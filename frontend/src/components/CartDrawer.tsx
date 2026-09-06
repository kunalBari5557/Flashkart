import React, { useState, useEffect } from "react";
import { 
  ShoppingBag, 
  X, 
  Trash2, 
  Clock, 
  ArrowRight, 
  AlertTriangle, 
  ShieldCheck, 
  Zap,
  RefreshCcw
} from "lucide-react";
import type { Cart, CartItem } from "../types/api.types";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { formatCurrency, getTimeRemainingSeconds, formatCountdown } from "../lib/utils";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Cart | null;
  isLoading: boolean;
  onRemoveItem: (cartItemId: string) => void;
  onClearCart: (cartId: string) => void;
  onProceedToCheckout: () => void;
  onRefreshCart: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  isLoading,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout,
  onRefreshCart,
}) => {
  // Timer state ticker
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const items = cart?.items || [];
  const hasItems = items.length > 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-950 border-l border-slate-800 text-slate-100 shadow-2xl backdrop-blur-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-purple-600/20 border border-purple-500/30 text-purple-400">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>Reserved Cart</span>
                  {hasItems && (
                    <Badge variant="flash" className="text-[10px]">
                      {items.length} {items.length === 1 ? 'ITEM' : 'ITEMS'}
                    </Badge>
                  )}
                </h2>
                <p className="text-xs text-slate-400">Stock locked in Redis for 300 seconds</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Content Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {isLoading ? (
              <div className="space-y-4 py-8 text-center">
                <RefreshCcw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-400">Fetching live reservation status...</p>
              </div>
            ) : !hasItems ? (
              <div className="py-16 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-slate-600">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-white">Your cart is empty</h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Browse flash sale items and click "Reserve Deal" to lock stock before it sells out!
                </p>
              </div>
            ) : (
              items.map((item: CartItem) => {
                const remainingSecs = getTimeRemainingSeconds(item.expiresAt);
                const { text: countdownText, isUrgent, progressPct } = formatCountdown(remainingSecs);
                const isExpired = remainingSecs <= 0;

                return (
                  <div
                    key={item.id}
                    className={`relative p-4 rounded-xl border transition-all ${
                      isExpired
                        ? "bg-red-950/20 border-red-900/50 opacity-75"
                        : isUrgent
                        ? "bg-amber-950/20 border-amber-500/50 animate-pulse-glow"
                        : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                    }`}
                  >
                    {/* Item Info Header */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1">
                        <h4 className="text-sm font-bold text-white line-clamp-1">
                          {item.product?.name || "Flash Sale Item"}
                        </h4>
                        <div className="flex items-center space-x-2 text-xs text-slate-400 mt-0.5">
                          <span>Qty: <strong className="text-slate-200">{item.quantity}</strong></span>
                          <span>•</span>
                          <span className="font-mono text-purple-300 font-semibold">
                            {formatCurrency(item.product?.price || 0)}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.id)}
                        className="text-slate-500 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-slate-800"
                        title="Release Stock & Remove"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* TTL Reservation Bar & Countdown */}
                    <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 font-mono text-[11px] text-slate-400">
                          <Clock className={`w-3.5 h-3.5 ${isUrgent ? "text-red-400 animate-spin" : "text-amber-400"}`} />
                          Stock Reserved:
                        </span>
                        <span
                          className={`font-mono text-xs font-bold ${
                            isExpired
                              ? "text-red-400"
                              : isUrgent
                              ? "text-amber-400 animate-pulse"
                              : "text-emerald-400"
                          }`}
                        >
                          {countdownText}
                        </span>
                      </div>

                      {/* Dynamic Progress Bar */}
                      <Progress
                        value={progressPct}
                        indicatorClassName={
                          isExpired
                            ? "bg-red-600"
                            : isUrgent
                            ? "bg-amber-500"
                            : "bg-gradient-to-r from-emerald-500 to-teal-400"
                        }
                      />
                      {isExpired && (
                        <p className="text-[10px] text-red-400 flex items-center gap-1 mt-1">
                          <AlertTriangle className="w-3 h-3" />
                          Reservation expired! Worker will return stock to pool.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Checkout Summary */}
          {hasItems && (
            <div className="p-6 border-t border-slate-800 bg-slate-900/90 space-y-4">
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Items Subtotal</span>
                  <span className="font-mono text-slate-200">{formatCurrency(cart?.totalAmount || 0)}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Flash Shipping</span>
                  <span className="text-emerald-400 font-bold uppercase">FREE</span>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-sm font-bold text-white">
                  <span>Total Lock Price</span>
                  <span className="text-lg font-mono text-purple-400">{formatCurrency(cart?.totalAmount || 0)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => cart && onClearCart(cart.id)}
                  className="text-xs text-red-400 hover:text-red-300 hover:border-red-800/50"
                >
                  Clear All
                </Button>

                <Button
                  variant="flash"
                  size="default"
                  onClick={onProceedToCheckout}
                  className="col-span-1 w-full flex items-center justify-center space-x-1.5 font-bold"
                >
                  <span>Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center justify-center space-x-1 text-[10px] text-slate-500 font-mono">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Protected by Idempotent Checkout Engine</span>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
