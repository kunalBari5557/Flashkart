import React, { useState } from "react";
import { PackageCheck, Clock, ShieldCheck, ChevronRight, AlertCircle, RefreshCcw } from "lucide-react";
import { Dialog } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import type { Order } from "../types/api.types";
import { formatCurrency } from "../lib/utils";

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
  isLoading: boolean;
  onRefreshOrders: () => void;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  orders,
  isLoading,
  onRefreshOrders,
}) => {
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  if (!isOpen) return null;

  const getStatusBadge = (status: Order["status"]) => {
    switch (status) {
      case "PAID":
      case "FULFILLED":
        return <Badge variant="success">{status}</Badge>;
      case "CREATED":
        return <Badge variant="default">{status}</Badge>;
      case "CANCELLED":
        return <Badge variant="destructive">{status}</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Order History"
      description="View past orders, payment statuses, and transaction snapshots."
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        
        {/* Top Header Refresh */}
        <div className="flex justify-between items-center text-xs text-slate-400 pb-2 border-b border-slate-800">
          <span>Completed Transactions ({orders.length})</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefreshOrders}
            disabled={isLoading}
            className="text-xs text-purple-400 hover:text-purple-300"
          >
            <RefreshCcw className={`w-3.5 h-3.5 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <RefreshCcw className="w-6 h-6 animate-spin text-purple-400 mx-auto" />
            <p className="text-xs">Loading order history...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <PackageCheck className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-sm font-semibold text-white">No orders found</p>
            <p className="text-xs text-slate-500 max-w-xs mx-auto">
              You haven't placed any orders with this user account yet.
            </p>
          </div>
        ) : selectedOrder ? (
          /* Order Details View */
          <div className="space-y-4 animate-in fade-in">
            <button
              onClick={() => setSelectedOrder(null)}
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-medium"
            >
              &larr; Back to all orders
            </button>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-bold text-white">Order #{selectedOrder.id.slice(0, 8)}...</h4>
                    {getStatusBadge(selectedOrder.status)}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Placed on {new Date(selectedOrder.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base font-black font-mono text-emerald-400">
                    {formatCurrency(selectedOrder.totalAmount)}
                  </span>
                </div>
              </div>

              {/* Idempotency Key */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 space-y-0.5">
                <div className="flex items-center gap-1 text-purple-400 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Idempotency Key:</span>
                </div>
                <div className="truncate">{selectedOrder.idempotencyKey}</div>
              </div>

              {/* Items Table */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <h5 className="text-xs font-bold text-slate-300">Purchased Items</h5>
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <div>
                      <div className="font-semibold text-white">{item.productName}</div>
                      <div className="text-[10px] text-slate-400">
                        {formatCurrency(item.priceAtPurchase)} x {item.quantity}
                      </div>
                    </div>
                    <span className="font-mono text-purple-300 font-bold">{formatCurrency(item.subtotal)}</span>
                  </div>
                ))}
              </div>

              {/* Address */}
              <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 space-y-0.5">
                <div className="font-semibold text-slate-300">Shipping Address</div>
                <div>{selectedOrder.shippingAddress}</div>
                <div className="text-[11px] text-slate-500">Payment: {selectedOrder.paymentMethod}</div>
              </div>
            </div>
          </div>
        ) : (
          /* Order List View */
          <div className="space-y-3">
            {orders.map((order) => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-purple-500/40 hover:bg-slate-900/90 transition-all cursor-pointer flex items-center justify-between group"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">
                      Order #{order.id.slice(0, 8)}
                    </span>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-slate-400">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>{order.items?.length || 0} items</span>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <span className="text-base font-bold font-mono text-emerald-400">
                    {formatCurrency(order.totalAmount)}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </Dialog>
  );
};
