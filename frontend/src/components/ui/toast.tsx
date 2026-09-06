import React from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "../../lib/utils";

export interface ToastMessage {
  id: string;
  type: "success" | "error" | "warning" | "info";
  title: string;
  message?: string;
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col space-y-3 max-w-md w-full px-4 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={cn(
            "pointer-events-auto flex items-start p-4 rounded-xl border shadow-2xl backdrop-blur-xl transition-all duration-300 transform animate-in slide-in-from-bottom-5",
            toast.type === "success" && "bg-slate-900/95 border-emerald-500/40 text-slate-100 shadow-emerald-950/40",
            toast.type === "error" && "bg-slate-900/95 border-red-500/40 text-slate-100 shadow-red-950/40",
            toast.type === "warning" && "bg-slate-900/95 border-amber-500/40 text-slate-100 shadow-amber-950/40",
            toast.type === "info" && "bg-slate-900/95 border-blue-500/40 text-slate-100 shadow-blue-950/40"
          )}
        >
          <div className="mr-3 mt-0.5 shrink-0">
            {toast.type === "success" && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
            {toast.type === "error" && <XCircle className="w-5 h-5 text-red-400" />}
            {toast.type === "warning" && <AlertTriangle className="w-5 h-5 text-amber-400" />}
            {toast.type === "info" && <Info className="w-5 h-5 text-blue-400" />}
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-white">{toast.title}</h4>
            {toast.message && (
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">{toast.message}</p>
            )}
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="ml-3 text-slate-400 hover:text-slate-200 transition-colors p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
