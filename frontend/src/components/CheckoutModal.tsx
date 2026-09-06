import React, { useState } from "react";
import confetti from "canvas-confetti";
import { 
  ShieldCheck, 
  CreditCard, 
  MapPin, 
  CheckCircle2, 
  Loader2, 
  Zap, 
  Copy, 
  Check, 
  AlertCircle
} from "lucide-react";
import { Dialog } from "./ui/dialog";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { Cart, Order } from "../types/api.types";
import { formatCurrency, generateUUID } from "../lib/utils";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Cart | null;
  onCheckoutSuccess: (order: Order) => void;
  onPerformCheckout: (
    reservationId: string, 
    idempotencyKey: string
  ) => Promise<Order>;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  onCheckoutSuccess,
  onPerformCheckout,
}) => {
  const [shippingAddress, setShippingAddress] = useState("123 Tech Park Way, Silicon Valley, CA 94025");
  const [paymentMethod, setPaymentMethod] = useState("FlashPay Direct");
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => generateUUID());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [copiedKey, setCopiedKey] = useState(false);

  // Reset state when opening dialog
  React.useEffect(() => {
    if (isOpen) {
      setIdempotencyKey(generateUUID());
      setErrorMsg(null);
      setCompletedOrder(null);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart || cart.items.length === 0) return;

    const reservationId = cart.items[0]?.reservationId;
    if (!reservationId) {
      setErrorMsg("No active reservation found to checkout.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const order = await onPerformCheckout(
        reservationId,
        idempotencyKey
      );

      setCompletedOrder(order);
      onCheckoutSuccess(order);

      // Trigger Confetti effect
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#9333ea', '#f59e0b', '#10b981', '#6366f1'],
      });
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to complete checkout. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyIdempotencyKey = () => {
    navigator.clipboard.writeText(idempotencyKey);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={completedOrder ? "Order Confirmed!" : "Flash Checkout"}
      description={
        completedOrder 
          ? "Your order has been recorded and stock transferred from reservation."
          : "Review items and complete your purchase before reservation expires."
      }
      maxWidth="max-w-xl"
    >
      {completedOrder ? (
        /* Order Completed Success Screen */
        <div className="space-y-6 text-center py-4">
          <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-xl shadow-emerald-950/50">
            <CheckCircle2 className="w-10 h-10 animate-bounce" />
          </div>

          <div className="space-y-1">
            <Badge variant="success" className="px-3 py-1 text-xs">
              STATUS: {completedOrder.status}
            </Badge>
            <h3 className="text-xl font-bold text-white">Thank you for your order!</h3>
            <p className="text-xs text-slate-400 font-mono">Order ID: {completedOrder.id}</p>
          </div>

          {/* Purchased Items List */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-left space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono border-b border-slate-800 pb-2">
              Order Summary Snapshot
            </h4>
            {completedOrder.items?.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs">
                <span className="text-slate-200 font-medium">{item.productName} x{item.quantity}</span>
                <span className="font-mono text-purple-300">{formatCurrency(item.subtotal)}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold text-white">
              <span>Total Paid</span>
              <span className="font-mono text-emerald-400">{formatCurrency(completedOrder.totalAmount)}</span>
            </div>
          </div>

          <div className="pt-2">
            <Button
              variant="default"
              size="lg"
              onClick={onClose}
              className="w-full font-bold"
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      ) : (
        /* Checkout Form */
        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/60 text-red-300 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-white">Checkout Error</strong>
                <span>{errorMsg}</span>
              </div>
            </div>
          )}

          {/* Idempotency Key Info Badge */}
          <div className="p-3 rounded-xl bg-purple-950/30 border border-purple-800/40 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-purple-300 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-purple-400" />
                Idempotency-Key Header:
              </span>
              <button
                type="button"
                onClick={copyIdempotencyKey}
                className="text-[10px] text-purple-400 hover:text-purple-200 flex items-center gap-1 bg-purple-900/40 px-2 py-0.5 rounded border border-purple-700/50"
              >
                {copiedKey ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedKey ? "Copied" : "Copy Key"}
              </button>
            </div>
            <p className="font-mono text-[11px] text-slate-400 truncate">{idempotencyKey}</p>
          </div>

          {/* Order items preview */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-400">
              <span>Items to purchase ({cart?.items.length || 0})</span>
              <span>Subtotal</span>
            </div>
            {cart?.items.map((item) => (
              <div key={item.id} className="flex justify-between items-center text-xs">
                <span className="text-slate-300 truncate max-w-[240px]">{item.product?.name}</span>
                <span className="font-mono text-purple-300">{formatCurrency((item.product?.price || 0) * item.quantity)}</span>
              </div>
            ))}
            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-sm font-bold text-white">
              <span>Total Price</span>
              <span className="font-mono text-emerald-400 text-base">{formatCurrency(cart?.totalAmount || 0)}</span>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-purple-400" />
              Shipping Address
            </label>
            <input
              type="text"
              required
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="FlashPay Direct">FlashPay Direct (Instant Settlement)</option>
              <option value="Credit Card">Credit Card (Visa / MasterCard)</option>
              <option value="UPI Instant">UPI Instant (QR Code)</option>
              <option value="Crypto Lightning">Crypto Lightning (USDT)</option>
            </select>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="w-1/3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="flash"
              disabled={isSubmitting}
              className="w-2/3 font-bold"
            >
              {isSubmitting ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5">
                  <Zap className="w-4 h-4 text-white fill-white" />
                  <span>Pay {formatCurrency(cart?.totalAmount || 0)}</span>
                </div>
              )}
            </Button>
          </div>

        </form>
      )}
    </Dialog>
  );
};
