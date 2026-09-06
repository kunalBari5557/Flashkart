import React from "react";
import { 
  Zap, 
  ShoppingCart, 
  Flame, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { Product } from "../types/api.types";
import { formatCurrency } from "../lib/utils";

interface ProductCardProps {
  product: Product;
  onReserve: (product: Product, quantity: number) => void;
  onViewDetails: (product: Product) => void;
  isReserving?: boolean;
}

// Generate themed SVG icon / avatar for product based on SKU/name
const getProductIcon = (sku: string) => {
  if (sku.includes("LAPTOP")) return "💻";
  if (sku.includes("HEADPHONES")) return "🎧";
  if (sku.includes("CABLE")) return "🔌";
  if (sku.includes("MOUSE")) return "🖱️";
  if (sku.includes("KEYBOARD")) return "⌨️";
  if (sku.includes("MONITOR")) return "🖥️";
  if (sku.includes("WEBCAM")) return "📷";
  if (sku.includes("HUB")) return "⚙️";
  if (sku.includes("SSD")) return "💾";
  return "📦";
};

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onReserve,
  onViewDetails,
  isReserving = false,
}) => {
  const iconEmoji = getProductIcon(product.sku);
  const isOutOfStock = product.stock <= 0 || product.status === "out_of_stock";
  const isLowStock = product.stock > 0 && product.stock <= 50;

  return (
    <Card className="group relative flex flex-col justify-between overflow-hidden border-slate-800 bg-slate-900/60 hover:bg-slate-900/90 transition-all duration-300 hover:border-purple-500/50 hover:shadow-2xl hover:shadow-purple-950/50">
      
      {/* Top Banner Tag */}
      <div className="absolute top-3 left-3 z-10 flex items-center space-x-2">
        {isOutOfStock ? (
          <Badge variant="destructive" className="flex items-center gap-1 font-bold">
            <AlertCircle className="w-3 h-3" />
            SOLD OUT
          </Badge>
        ) : isLowStock ? (
          <Badge variant="warning" className="flex items-center gap-1 font-bold">
            <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
            ONLY {product.stock} LEFT
          </Badge>
        ) : (
          <Badge variant="success" className="flex items-center gap-1 font-bold">
            <CheckCircle2 className="w-3 h-3" />
            {product.stock} IN STOCK
          </Badge>
        )}
      </div>

      {/* Product Image Box */}
      <div className="relative w-full h-48 bg-gradient-to-b from-slate-800/80 to-slate-900/90 flex items-center justify-center overflow-hidden border-b border-slate-800 group-hover:scale-105 transition-transform duration-500">
        <span className="text-6xl select-none filter drop-shadow-lg transform group-hover:scale-110 transition-transform">
          {iconEmoji}
        </span>
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-slate-950/80 border border-slate-800 font-mono text-[10px] text-slate-400">
          SKU: {product.sku}
        </div>
      </div>

      {/* Card Content */}
      <CardHeader className="space-y-1.5 p-5">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-1">
            {product.name}
          </CardTitle>
        </div>
        <CardDescription className="line-clamp-2 text-slate-400 text-xs">
          {product.description}
        </CardDescription>
      </CardHeader>

      <CardContent className="px-5 py-0 flex items-baseline justify-between mb-4">
        <div>
          <span className="text-2xl font-black text-white font-mono">
            {formatCurrency(product.price)}
          </span>
          <span className="ml-2 text-xs text-slate-500 line-through">
            {formatCurrency(product.price * 1.25)}
          </span>
        </div>
        <button
          onClick={() => onViewDetails(product)}
          className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium transition-colors"
        >
          <Info className="w-3.5 h-3.5" />
          Specs
        </button>
      </CardContent>

      {/* Card Footer Actions */}
      <CardFooter className="p-5 pt-0 flex gap-2">
        <Button
          variant={isOutOfStock ? "secondary" : "flash"}
          size="default"
          disabled={isOutOfStock || isReserving}
          onClick={() => onReserve(product, 1)}
          className="w-full flex items-center justify-center space-x-2 font-bold"
        >
          {isReserving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-white" />
              <span>Locking Stock...</span>
            </>
          ) : isOutOfStock ? (
            <span>Sold Out</span>
          ) : (
            <>
              <Zap className="w-4 h-4 text-white fill-white" />
              <span>Reserve Deal</span>
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
