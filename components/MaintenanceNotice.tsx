"use client";

import React from "react";
import {
  AlertTriangle,
  ExternalLink,
  MessageCircle,
  Calendar,
} from "lucide-react";

export function MaintenanceNotice() {
  const whatsappUrl = `https://wa.me/919118431155?text=${encodeURIComponent(
    "Hello, I want to complete the monthly maintenance payment of Rs 550 for Rummy Adda Admin Panel (Cycle: 12th of the month)."
  )}`;

  return (
    <div className="w-full bg-gradient-to-r from-rose-950/95 via-amber-950/85 to-slate-900 border-b-2 border-rose-500/60 p-3 sm:p-4 text-white shadow-xl animate-fade-in relative z-30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Warning Details */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0 mt-0.5 sm:mt-0">
            <AlertTriangle className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-white">
                Monthly Maintenance Notice: ₹550 Due
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-200 border border-rose-500/40">
                Recurring Monthly
              </span>
              <span className="text-[11px] text-amber-300 font-mono flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Starts: 12 Oct 2026 • Cycle: 12th of Every Month</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Monthly maintenance charge of ₹550 is due for cloud database upkeep and server maintenance. Please settle the dues on WhatsApp to maintain active services.
            </p>
          </div>
        </div>

        {/* Action Controls - WhatsApp Pay Button */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/40 transition hover:scale-[1.02]"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Pay ₹550 on WhatsApp</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-75" />
          </a>
        </div>
      </div>
    </div>
  );
}
