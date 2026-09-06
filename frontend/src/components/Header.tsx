import React from "react";
import { 
  Zap, 
  ShoppingBag, 
  User, 
  PackageCheck, 
  Clock, 
  Activity,
  Check
} from "lucide-react";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import type { UserSim } from "../types/api.types";

export const TEST_USERS: UserSim[] = [
  { id: "11111111-1111-4111-8111-111111111111", name: "Alice Johnson", email: "alice@example.com", avatarColor: "bg-purple-600" },
  { id: "22222222-2222-4222-8222-222222222222", name: "Bob Smith", email: "bob@example.com", avatarColor: "bg-indigo-600" },
  { id: "33333333-3333-4333-8333-333333333333", name: "Charlie Brown", email: "charlie@example.com", avatarColor: "bg-emerald-600" },
  { id: "44444444-4444-4444-8444-444444444444", name: "Diana Prince", email: "diana@example.com", avatarColor: "bg-pink-600" },
  { id: "55555555-5555-4555-8555-555555555555", name: "Eve Wilson", email: "eve@example.com", avatarColor: "bg-amber-600" },
];

interface HeaderProps {
  currentUser: UserSim;
  onSelectUser: (user: UserSim) => void;
  cartItemCount: number;
  onOpenCart: () => void;
  onOpenOrders: () => void;
  isBackendHealthy: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSelectUser,
  cartItemCount,
  onOpenCart,
  onOpenOrders,
  isBackendHealthy,
}) => {
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 shadow-lg shadow-purple-900/40 p-2">
            <Zap className="w-6 h-6 text-white fill-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-black tracking-tight text-white font-mono">
                FLASH<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">KART</span>
              </span>
              <Badge variant="flash" className="hidden sm:inline-flex text-[10px]">
                HIGH CONCURRENCY
              </Badge>
            </div>
            <p className="text-[10px] text-slate-400 font-medium">Flash Sale Engine • 300s Stock Reservation</p>
          </div>
        </div>

        {/* User Switcher & Actions */}
        <div className="flex items-center space-x-3">

          {/* Backend Status indicator */}
          <div 
            className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-slate-900/80 border border-slate-800 text-xs text-slate-300"
            title={isBackendHealthy ? "Backend server connected" : "Backend server disconnected"}
          >
            <span className={`w-2 h-2 rounded-full ${isBackendHealthy ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`} />
            <span className="font-mono text-[11px]">{isBackendHealthy ? "API Connected" : "API Offline"}</span>
          </div>

          {/* User Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center space-x-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all text-left"
            >
              <div className={`w-7 h-7 rounded-lg ${currentUser.avatarColor} flex items-center justify-center text-white text-xs font-bold shadow-md`}>
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs font-semibold text-white leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 truncate max-w-[100px]">{currentUser.email}</p>
              </div>
              <User className="w-4 h-4 text-slate-400 ml-1" />
            </button>

            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-slate-800 bg-slate-900 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                <div className="px-2 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-bold border-b border-slate-800 mb-1">
                  Switch Active User (Auth Token)
                </div>
                {TEST_USERS.map((user) => {
                  const isSelected = user.id === currentUser.id;
                  return (
                    <button
                      key={user.id}
                      onClick={() => {
                        onSelectUser(user);
                        setShowUserDropdown(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-xs text-left transition-all ${
                        isSelected 
                          ? "bg-purple-950/60 border border-purple-800/50 text-white font-medium" 
                          : "hover:bg-slate-800 text-slate-300"
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <div className={`w-6 h-6 rounded-md ${user.avatarColor} flex items-center justify-center text-white text-[10px] font-bold`}>
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-200">{user.name}</div>
                          <div className="text-[10px] text-slate-400">{user.email}</div>
                        </div>
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-purple-400" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Orders History Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenOrders}
            className="flex items-center space-x-1.5"
          >
            <PackageCheck className="w-4 h-4 text-indigo-400" />
            <span className="hidden md:inline">Orders</span>
          </Button>

          {/* Cart Drawer Trigger */}
          <Button
            variant="default"
            size="sm"
            onClick={onOpenCart}
            className="relative flex items-center space-x-2 px-4"
          >
            <ShoppingBag className="w-4 h-4 text-white" />
            <span className="hidden sm:inline font-semibold">Cart</span>
            {cartItemCount > 0 && (
              <span className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-extrabold text-[11px] animate-bounce">
                {cartItemCount}
              </span>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};
