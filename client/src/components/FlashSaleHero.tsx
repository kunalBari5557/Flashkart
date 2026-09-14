import React, { useState, useEffect } from "react";
import { Zap, Clock, ShieldCheck, Flame, Cpu, ArrowRight } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export const FlashSaleHero: React.FC<{ onScrollToProducts: () => void }> = ({ onScrollToProducts }) => {
  // Live sale countdown simulation
  const [secondsLeft, setSecondsLeft] = useState(14 * 60 + 32);

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 15 * 60));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatSaleTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}m ${String(secs).padStart(2, "0")}s`;
  };

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-purple-950/80 to-slate-900 border border-purple-900/40 p-8 sm:p-12 mb-10 shadow-2xl">
      {/* Background glow graphics */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        
        {/* Left Column Text */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="flash" className="px-3 py-1 text-xs flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-amber-400 fill-amber-400 animate-pulse" />
              LIVE FLASH SALE
            </Badge>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-950/80 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" style={{ animationDuration: '4s' }} />
              <span>SALE ENDS IN: {formatSaleTime(secondsLeft)}</span>
            </div>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-none">
            High-Speed <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-red-500">Flash Deals</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
            Reserve flash sale products in real-time. Powered by Redis Lua scripts for zero overselling, 
            5-minute automatic stock reservation lock, and dual-layer idempotent checkouts.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-2">
            <Button variant="flash" size="lg" onClick={onScrollToProducts} className="group">
              <span>Grab Flash Deals</span>
              <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>

        {/* Right Column Highlights */}
        <div className="lg:col-span-4 bg-slate-950/70 border border-slate-800 rounded-2xl p-6 backdrop-blur-md space-y-4">
          <h3 className="text-xs uppercase font-extrabold tracking-wider text-purple-400 font-mono">
            Platform Specifications
          </h3>

          <div className="space-y-3">
            <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <Cpu className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Atomic Stock Lock</h4>
                <p className="text-[11px] text-slate-400">Redis Lua scripts guarantee zero race condition overselling.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">300s Stock TTL</h4>
                <p className="text-[11px] text-slate-400">Items locked in cart for 5 minutes before auto-release worker runs.</p>
              </div>
            </div>

            <div className="flex items-start space-x-3 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/80">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-white">Idempotent Checkout</h4>
                <p className="text-[11px] text-slate-400">UUID Idempotency keys prevent double billing on network retries.</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
