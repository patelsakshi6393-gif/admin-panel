"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  ArrowDownCircle,
  ArrowUpCircle,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Filter,
  CreditCard,
  Building,
  Smartphone,
  Copy,
  Check,
} from "lucide-react";
import { UserProfile, DepositRequest } from "@/lib/types";

interface DepositSectionProps {
  users: UserProfile[];
  allDeposits: DepositRequest[];
  onOpenPlayerModal: (player: UserProfile, tab: "deposit" | "withdrawal") => void;
  onApproveDeposit: (dep: DepositRequest) => void;
  onDenyDeposit: (dep: DepositRequest) => void;
  adminEmail?: string;
}

export function DepositSection({
  users,
  allDeposits,
  onOpenPlayerModal,
  onApproveDeposit,
  onDenyDeposit,
  adminEmail,
}: DepositSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Match player by Player ID, UID, Phone, Email, Name
  const matchedPlayer = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const q = searchQuery.trim().toLowerCase();
    return (
      users.find(
        (u) =>
          (u.playerId && u.playerId.toLowerCase() === q) ||
          u.uid.toLowerCase() === q ||
          (u.phone && u.phone.includes(q)) ||
          (u.email && u.email.toLowerCase().includes(q)) ||
          (u.displayName && u.displayName.toLowerCase().includes(q))
      ) || null
    );
  }, [searchQuery, users]);

  // Deposits for matched player
  const playerDeposits = useMemo(() => {
    if (!matchedPlayer) return [];
    return allDeposits.filter((d) => d.uid === matchedPlayer.uid);
  }, [matchedPlayer, allDeposits]);

  // Filtered deposits across platform
  const filteredAllDeposits = useMemo(() => {
    return allDeposits.filter((d) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      return true;
    });
  }, [allDeposits, statusFilter]);

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const pendingCount = allDeposits.filter((d) => d.status === "pending").length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Section Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 p-6 rounded-2xl border border-emerald-500/20">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ArrowDownCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Deposit Management
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Search players by Player ID, inspect their profile, and approve or deny deposit requests in real-time.
          </p>
        </div>

        {/* Counter */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800 text-right">
            <span className="text-[11px] text-slate-400 block font-medium">Pending Deposits</span>
            <span className="text-xl font-bold font-mono text-amber-400">
              {pendingCount} Request{pendingCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
      </div>

      {/* SEARCH PLAYER BY ID */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label className="text-sm font-bold text-white flex items-center gap-2">
            <Search className="w-4 h-4 text-emerald-400" />
            <span>Search Player ID:</span>
          </label>
          <span className="text-xs text-slate-400">
            e.g. RA-8D3RR0, RA-GXA7P0, RA-G1X94V or Phone Number
          </span>
        </div>

        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter Player ID (e.g. RA-8D3RR0)..."
            className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border-2 border-slate-700/80 rounded-xl text-base text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition font-mono"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-800"
            >
              Clear
            </button>
          )}
        </div>

        {/* Quick Select Existing Players */}
        <div className="flex items-center gap-2 flex-wrap pt-1">
          <span className="text-xs text-slate-500 font-medium">Quick Select Players:</span>
          {users.slice(0, 6).map((u) => {
            const pId = u.playerId || `RA-${u.uid.slice(0, 6)}`;
            const isSelected = matchedPlayer?.uid === u.uid;
            return (
              <button
                key={u.uid}
                onClick={() => setSearchQuery(pId)}
                className={`text-xs px-3 py-1 rounded-lg border font-mono font-medium transition flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/50 ring-2 ring-emerald-500/20"
                    : "bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white"
                }`}
              >
                <span>{pId}</span>
                <span className="text-slate-500 text-[10px]">({u.displayName || "User"})</span>
              </button>
            );
          })}
        </div>

        {/* MATCHED PLAYER PROFILE CARD */}
        {matchedPlayer ? (
          <div className="mt-6 pt-6 border-t border-slate-800 animate-slide-down">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Player Profile Found
              </span>
              <span className="text-xs text-slate-400">
                Click profile card to view full modal with Deposit & Withdrawal options
              </span>
            </div>

            {/* Profile Card */}
            <div
              onClick={() => onOpenPlayerModal(matchedPlayer, "deposit")}
              className="group cursor-pointer p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-emerald-500/40 hover:border-emerald-400 transition shadow-xl hover:shadow-emerald-950/30"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white text-xl font-black shadow-lg">
                    {matchedPlayer.displayName ? matchedPlayer.displayName.charAt(0).toUpperCase() : "P"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-white group-hover:text-emerald-300 transition">
                        {matchedPlayer.displayName || "Unknown Player"}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        {matchedPlayer.playerId}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-medium">
                        {matchedPlayer.accountStatus || "active"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                      {matchedPlayer.email && <span>Email: {matchedPlayer.email}</span>}
                      {matchedPlayer.phone && <span>Phone: {matchedPlayer.phone}</span>}
                      <span className="font-mono text-slate-500">UID: {matchedPlayer.uid}</span>
                    </div>
                  </div>
                </div>

                {/* The 2 Core Options on the card */}
                <div className="flex items-center gap-2 pt-2 md:pt-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPlayerModal(matchedPlayer, "deposit");
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md transition"
                  >
                    <ArrowDownCircle className="w-4 h-4" />
                    <span>Deposit Option</span>
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenPlayerModal(matchedPlayer, "withdrawal");
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm shadow-md transition"
                  >
                    <ArrowUpCircle className="w-4 h-4" />
                    <span>Withdrawal Option</span>
                  </button>
                </div>
              </div>
            </div>

            {/* In-place deposit requests for matched player */}
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Player Deposit Requests:</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {playerDeposits.length}
                </span>
              </h4>

              {playerDeposits.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                  No deposit requests found for this player. Click on the profile card to create a test request or adjust wallet balance manually.
                </div>
              ) : (
                <div className="space-y-2">
                  {playerDeposits.map((dep) => {
                    const displayAmt = dep.requestedAmount || dep.amount || 0;
                    return (
                      <div
                        key={dep.id}
                        className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xl font-bold text-emerald-400">
                              ₹{displayAmt.toLocaleString("en-IN")}
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                                dep.status === "pending"
                                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                  : dep.status === "approved"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                              }`}
                            >
                              {dep.status}
                            </span>
                            <span className="text-xs text-slate-400 font-mono bg-slate-900 px-2 py-0.5 rounded">
                              {dep.paymentMethod || "UPI"}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 flex flex-wrap gap-x-4">
                            {dep.depositId && <span className="font-mono text-slate-500">ID: {dep.depositId}</span>}
                            {dep.utr && <span className="font-mono text-slate-300">UTR: {dep.utr}</span>}
                            <span>
                              Time: {dep.requestedAt ? new Date(dep.requestedAt).toLocaleString("en-IN") : "Recent"}
                            </span>
                            {dep.whatsappOpenedAt && (
                              <span className="text-emerald-500/80">WhatsApp Verification Opened</span>
                            )}
                          </div>
                        </div>

                        {dep.status === "pending" && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => onApproveDeposit(dep)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-md shadow-emerald-950/40"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => onDenyDeposit(dep)}
                              className="px-3.5 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>Deny</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        ) : searchQuery.trim() ? (
          <div className="p-6 rounded-xl bg-slate-950/60 border border-rose-500/30 text-center text-rose-300 text-xs">
            No player found matching &quot;{searchQuery}&quot;. Please check the Player ID.
          </div>
        ) : null}
      </div>

      {/* ALL DEPOSITS MASTER LIST */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
              <span>All Deposit Requests</span>
            </h3>
            <p className="text-xs text-slate-400">
              Live incoming player deposit requests and ledger
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
            {(["pending", "all", "approved", "rejected"] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-medium capitalize transition ${
                  statusFilter === st
                    ? "bg-slate-800 text-white font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {filteredAllDeposits.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
            No deposit requests found in this category.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4">Player ID</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment Method</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Requested At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredAllDeposits.map((dep) => {
                  const player = users.find((u) => u.uid === dep.uid);
                  const displayAmt = dep.requestedAmount || dep.amount || 0;
                  return (
                    <tr key={dep.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-medium text-white">
                        {dep.playerName || player?.displayName || "Player"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-amber-400 text-xs">
                        {dep.playerId || player?.playerId || dep.uid.slice(0, 8)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-400 font-mono text-base">
                        ₹{displayAmt.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        <div>{dep.paymentMethod || "UPI"}</div>
                        {dep.utr && <div className="text-[11px] font-mono text-slate-400">{dep.utr}</div>}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            dep.status === "pending"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                              : dep.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                          }`}
                        >
                          {dep.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {dep.requestedAt ? new Date(dep.requestedAt).toLocaleString("en-IN") : "-"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {dep.status === "pending" ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => onApproveDeposit(dep)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => onDenyDeposit(dep)}
                              className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 rounded text-xs font-bold transition"
                            >
                              Deny
                            </button>
                          </div>
                        ) : player ? (
                          <button
                            onClick={() => onOpenPlayerModal(player, "deposit")}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                          >
                            View Profile
                          </button>
                        ) : (
                          <span className="text-slate-500 text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
