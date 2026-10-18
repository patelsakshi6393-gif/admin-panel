"use client";

import React, { useState } from "react";
import { ShieldCheck, Wifi, Database, User, Key, CheckCircle, ExternalLink, RefreshCw, LogOut } from "lucide-react";
import { firebaseConfig } from "@/lib/firebase";

interface NavbarProps {
  currentAdminEmail?: string;
  totalUsersCount: number;
  onRefresh?: () => void;
  onLogout?: () => void;
  onOpenRules?: () => void;
}

export function Navbar({
  currentAdminEmail = "admin@rummyadda.com",
  totalUsersCount,
  onRefresh,
  onLogout,
  onOpenRules,
}: NavbarProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    if (onRefresh) onRefresh();
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-950/40">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-amber-400 via-rose-300 to-indigo-200 bg-clip-text text-transparent">
                RUMMY ADDA
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-semibold tracking-wide uppercase">
                Admin Panel
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium hidden sm:block">
              Real-time Player Management, Deposit & Withdrawal Control
            </p>
          </div>
        </div>

        {/* Status Badges & Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            title="Refresh Data"
            className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin text-amber-400" : ""}`} />
          </button>

          {/* Firebase Rules Button */}
          {onOpenRules && (
            <button
              onClick={onOpenRules}
              title="Firebase Rules"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold transition"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Firebase Rules</span>
            </button>
          )}

          {/* Current Admin Email */}
          <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700/80 rounded-lg px-2.5 py-1 text-xs text-slate-200">
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center font-bold text-white text-[10px]">
              A
            </div>
            <div className="hidden lg:block text-left">
              <div className="font-medium truncate max-w-[130px] text-slate-200">
                {currentAdminEmail}
              </div>
              <div className="text-[10px] text-amber-400 font-semibold leading-none">Super Admin</div>
            </div>
          </div>

          {/* Logout Button */}
          {onLogout && (
            <button
              onClick={onLogout}
              title="Secure Logout"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/30 text-xs font-semibold transition"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
