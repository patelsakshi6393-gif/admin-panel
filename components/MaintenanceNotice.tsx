"use client";

import React from "react";
import {
  CheckCircle2,
  ExternalLink,
  MessageCircle,
  Calendar,
} from "lucide-react";

export function MaintenanceNotice() {
  const whatsappUrl = `https://wa.me/917704843966?text=${encodeURIComponent(
    "Hello, regarding monthly maintenance (₹550) for Rummy Adda Admin Panel (Next Cycle: 17 Nov 2026)."
  )}`;

  return (
    <div className="w-full bg-gradient-to-r from-emerald-950/80 via-slate-900 to-slate-900 border-b border-emerald-500/40 p-3 sm:p-4 text-white shadow-xl animate-fade-in relative z-30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Status Details */}
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0 mt-0.5 sm:mt-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-sm text-white">
                Monthly Maintenance: ₹550 Paid (Current Month Active)
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Paid Active
              </span>
              <span className="text-[11px] text-amber-300 font-mono flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-400" />
                <span>Next Billing Cycle: 17 Nov 2026 • Cycle: 17th of Every Month</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Current month maintenance payment of ₹550 has been completed. Next maintenance cycle of ₹550 will be due on <strong>17 November 2026</strong>.
            </p>
          </div>
        </div>

        {/* Action Controls - WhatsApp Maintenance Support Button */}
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/40 transition hover:scale-[1.02]"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Maintenance Support (+91 7704843966)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-75" />
          </a>
        </div>
      </div>
    </div>
  );
}
