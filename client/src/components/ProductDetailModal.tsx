import React, { useState } from "react";
import { Zap, ShieldCheck, Clock, Flame, CheckCircle2, AlertCircle, Minus, Plus, Loader2 } from "lucide-react";
import { Dialog } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { Product } from "../types/api.types";
import { formatCurrency } from "../lib/utils";

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onReserve: (product: Product, quantity: number) => void;
  isReserving?: boolean;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onReserve,
  isReserving = false,
}) => {
  const [quantity, setQuantity] = useState(1);

  React.useEffect(() => {
    setQuantity(1);
  }, [product, isOpen]);

  if (!product || !isOpen) return null;

  const isOutOfStock = product.stock <= 0 || product.status === "out_of_stock";
  const maxAllowedQty = Math.min(5, product.stock);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={product.name}
      description={`SKU: ${product.sku}`}
      maxWidth="max-w-xl"
    >
      <div className="space-y-6">
        
        {/* Product Header Graphic */}
        <div className="w-full h-44 rounded-2xl bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 border border-slate-800 flex items-center justify-center relative overflow-hidden">
          <span className="text-7xl select-none filter drop-shadow-2xl">⚡</span>
          <div className="absolute top-3 left-3">
            {isOutOfStock ? (
              <Badge variant="destructive">OUT OF STOCK</Badge>
            ) : (
              <Badge variant="success">{product.stock} UNITS AVAILABLE</Badge>
            )}
          </div>
        </div>

        {/* Price & Description */}
        <div className="space-y-2">
          <div className="flex items-baseline space-x-3">
            <span className="text-3xl font-black text-white font-mono">{formatCurrency(product.price)}</span>
            <span className="text-sm text-slate-500 line-through">{formatCurrency(product.price * 1.25)}</span>
            <Badge variant="flash">20% FLASH DISCOUNT</Badge>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{product.description}</p>
        </div>

        {/* Quantity Selector */}
        {!isOutOfStock && (
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="space-y-0.5">
              <label className="text-xs font-bold text-white">Select Reservation Quantity</label>
              <p className="text-[10px] text-slate-400">Max 5 units per user reservation lock</p>
            </div>

            <div className="flex items-center space-x-3 bg-slate-900 border border-slate-800 rounded-lg p-1">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="font-mono text-sm font-bold text-white px-2">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(maxAllowedQty, q + 1))}
                disabled={quantity >= maxAllowedQty}
                className="p-1 rounded hover:bg-slate-800 text-slate-300 disabled:opacity-30"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Feature Badges */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-slate-300 text-[11px]">300s TTL Stock Lock</span>
          </div>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-300 text-[11px]">Atomic Lua Reservation</span>
          </div>
        </div>

        {/* Reserve Button */}
        <div className="pt-2">
          <Button
            variant={isOutOfStock ? "secondary" : "flash"}
            size="lg"
            disabled={isOutOfStock || isReserving}
            onClick={() => {
              onReserve(product, quantity);
              onClose();
            }}
            className="w-full font-bold flex items-center justify-center space-x-2"
          >
            {isReserving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>Reserving in Redis...</span>
              </>
            ) : isOutOfStock ? (
              <span>Item Sold Out</span>
            ) : (
              <>
                <Zap className="w-4 h-4 text-white fill-white" />
                <span>Reserve {quantity} {quantity === 1 ? 'Unit' : 'Units'} ({formatCurrency(product.price * quantity)})</span>
              </>
            )}
          </Button>
        </div>

      </div>
    </Dialog>
  );
};
