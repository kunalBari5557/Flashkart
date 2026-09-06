import React, { useState } from "react";
import { Search, Flame, Filter, RefreshCw, AlertCircle } from "lucide-react";
import { ProductCard } from "./ProductCard";
import type { Product } from "../types/api.types";
import { Button } from "./ui/button";

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
  onRefresh: () => void;
  onReserve: (product: Product, quantity: number) => void;
  onViewDetails: (product: Product) => void;
  reservingProductId?: string | null;
}

export const ProductGrid: React.FC<ProductGridProps> = ({
  products,
  isLoading,
  onRefresh,
  onReserve,
  onViewDetails,
  reservingProductId,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState<"all" | "limited" | "active">("all");

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;

    if (filterCategory === "limited") {
      return p.stock > 0 && p.stock <= 50;
    }
    if (filterCategory === "active") {
      return p.stock > 0;
    }
    return true;
  });

  return (
    <section className="space-y-6">
      
      {/* Controls Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur-md">
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search flash sale products by name or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          />
        </div>

        {/* Filters & Refresh */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setFilterCategory("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterCategory === "all"
                ? "bg-purple-600 text-white shadow-md shadow-purple-900/40"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            All Products ({products.length})
          </button>

          <button
            onClick={() => setFilterCategory("limited")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
              filterCategory === "limited"
                ? "bg-amber-600 text-white shadow-md shadow-amber-900/40"
                : "bg-slate-950 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Limited Stock (&le;50)
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center space-x-1 ml-2"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-purple-400" : "text-slate-400"}`} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        </div>

      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
            <div key={n} className="h-80 rounded-xl bg-slate-900/40 border border-slate-800/60 animate-pulse p-4 flex flex-col justify-between">
              <div className="w-full h-40 bg-slate-800/50 rounded-lg mb-4" />
              <div className="space-y-2">
                <div className="h-4 bg-slate-800/80 rounded w-3/4" />
                <div className="h-3 bg-slate-800/50 rounded w-1/2" />
              </div>
              <div className="h-9 bg-slate-800/80 rounded-lg mt-4" />
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-16 px-4 rounded-2xl bg-slate-900/40 border border-slate-800">
          <AlertCircle className="w-12 h-12 text-slate-500 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No products found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search criteria or filter options to discover active flash sale items.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onReserve={onReserve}
              onViewDetails={onViewDetails}
              isReserving={reservingProductId === product.id}
            />
          ))}
        </div>
      )}
    </section>
  );
};
