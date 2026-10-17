"use client";

import React, { useState, useMemo } from "react";
import {
  Search,
  ArrowUpCircle,
  ArrowDownCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Building,
  Smartphone,
  ExternalLink,
  ChevronRight,
  Filter,
  Trash2,
} from "lucide-react";
import { UserProfile, WithdrawalRequest } from "@/lib/types";

interface WithdrawalSectionProps {
  users: UserProfile[];
  allWithdrawals: WithdrawalRequest[];
  onOpenPlayerModal: (player: UserProfile, tab: "withdrawal" | "deposit") => void;
  onApproveWithdrawalPrompt: (wth: WithdrawalRequest) => void;
  onDenyWithdrawalPrompt: (wth: WithdrawalRequest) => void;
  onDeleteWithdrawal?: (wth: WithdrawalRequest) => void;
  adminEmail?: string;
}

export function WithdrawalSection({
  users,
  allWithdrawals,
  onOpenPlayerModal,
  onApproveWithdrawalPrompt,
  onDenyWithdrawalPrompt,
  onDeleteWithdrawal,
}: WithdrawalSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

  // Match player by ID, UID, Phone, Email, Name
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

  // Withdrawals for matched player
  const playerWithdrawals = useMemo(() => {
    if (!matchedPlayer) return [];
    return allWithdrawals.filter((w) => w.uid === matchedPlayer.uid);
  }, [matchedPlayer, allWithdrawals]);

  // Filtered withdrawals
  const filteredWithdrawals = useMemo(() => {
    return allWithdrawals.filter((w) => {
      if (statusFilter !== "all" && w.status !== statusFilter) return false;
      return true;
    });
  }, [allWithdrawals, statusFilter]);

  const pendingCount = allWithdrawals.filter((w) => w.status === "pending").length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/40 p-6 rounded-2xl border border-amber-500/20">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <ArrowUpCircle className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Withdrawal Management
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
            Review player withdrawal requests, verify payout destination (Bank / UPI), and approve or deny requests.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-950/80 px-4 py-2.5 rounded-xl border border-slate-800 text-right">
            <span className="text-[11px] text-slate-400 block font-medium">Pending Withdrawals</span>
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
            <Search className="w-4 h-4 text-amber-400" />
            <span>Search Player by ID:</span>
          </label>
          <span className="text-xs text-slate-400">
            e.g. RA-8D3RR0, RA-GXA7P0
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Enter Player ID (e.g. RA-8D3RR0)..."
            className="w-full pl-12 pr-4 py-3.5 bg-slate-950 border-2 border-slate-700/80 rounded-xl text-base text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition font-mono"
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

        {/* Quick Player Chips */}
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
                    ? "bg-amber-500/20 text-amber-300 border-amber-500/50 ring-2 ring-amber-500/20"
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
        {matchedPlayer && (
          <div className="mt-6 pt-6 border-t border-slate-800 animate-slide-down">
            <div
              onClick={() => onOpenPlayerModal(matchedPlayer, "withdrawal")}
              className="group cursor-pointer p-5 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-2 border-amber-500/40 hover:border-amber-400 transition shadow-xl hover:shadow-amber-950/30"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white text-xl font-black shadow-lg">
                    {matchedPlayer.displayName ? matchedPlayer.displayName.charAt(0).toUpperCase() : "P"}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition">
                        {matchedPlayer.displayName || "Unknown Player"}
                      </h3>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        {matchedPlayer.playerId}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-1 flex flex-wrap gap-x-4 gap-y-0.5">
                      {matchedPlayer.email && <span>Email: {matchedPlayer.email}</span>}
                      {matchedPlayer.phone && <span>Phone: {matchedPlayer.phone}</span>}
                      <span className="font-mono text-slate-500">UID: {matchedPlayer.uid}</span>
                    </div>
                  </div>
                </div>

                {/* The 2 Core Options */}
                <div className="flex items-center gap-2">
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
                </div>
              </div>
            </div>

            {/* In-place player withdrawal requests */}
            <div className="mt-6 space-y-3">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Player Withdrawal Requests:</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {playerWithdrawals.length}
                </span>
              </h4>

              {playerWithdrawals.length === 0 ? (
                <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 text-center text-xs text-slate-400">
                  No withdrawal requests found for this player.
                </div>
              ) : (
                <div className="space-y-2">
                  {playerWithdrawals.map((wth) => (
                    <div
                      key={wth.id}
                      className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xl font-bold text-amber-400">
                            ₹{wth.amount.toLocaleString("en-IN")}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                              wth.status === "pending"
                                ? "bg-amber-500/20 text-amber-400"
                                : wth.status === "approved"
                                ? "bg-emerald-500/20 text-emerald-400"
                                : "bg-rose-500/20 text-rose-400"
                            }`}
                          >
                            {wth.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex flex-wrap gap-x-4">
                          {(wth.maskedDestination || wth.upiId) && (
                            <span>Destination: <strong className="text-slate-200">{wth.maskedDestination || wth.upiId}</strong></span>
                          )}
                          {wth.method && <span>Method: {wth.method}</span>}
                          {wth.accountNumber && <span>Account: {wth.accountNumber} ({wth.ifscCode})</span>}
                          {wth.holderName && <span>Name: {wth.holderName}</span>}
                        </div>
                      </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {wth.status === "pending" && (
                            <>
                              <button
                                onClick={() => onApproveWithdrawalPrompt(wth)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-md"
                              >
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => onDenyWithdrawalPrompt(wth)}
                                className="px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-bold transition flex items-center gap-1"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Deny</span>
                              </button>
                            </>
                          )}
                          {onDeleteWithdrawal && (
                            <button
                              onClick={() => onDeleteWithdrawal(wth)}
                              title="Delete request"
                              className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-300 border border-slate-700 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ALL WITHDRAWALS MASTER LIST */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ArrowUpCircle className="w-5 h-5 text-amber-400" />
              <span>All Withdrawal Requests</span>
            </h3>
            <p className="text-xs text-slate-400">
              Live queue of player withdrawal and cashout requests
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

        {filteredWithdrawals.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-slate-400 text-xs">
            No withdrawal requests found in this category.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Player</th>
                  <th className="py-3 px-4">Player ID</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payout Details</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Requested At</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredWithdrawals.map((wth) => {
                  const player = users.find((u) => u.uid === wth.uid);
                  return (
                    <tr key={wth.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 font-medium text-white">
                        {wth.playerName || player?.displayName || "Player"}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-amber-400 text-xs">
                        {wth.playerId || player?.playerId || wth.uid.slice(0, 8)}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-amber-400 font-mono text-base">
                        ₹{wth.amount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-4 text-slate-300">
                        {wth.maskedDestination || wth.upiId ? (
                          <div className="flex items-center gap-1 font-mono text-xs">
                            <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                            <span>{wth.maskedDestination || wth.upiId}</span>
                          </div>
                        ) : wth.accountNumber ? (
                          <div className="text-xs">
                            <div className="font-mono text-slate-200">Account: {wth.accountNumber}</div>
                            <div className="text-[11px] text-slate-400">IFSC: {wth.ifscCode}</div>
                          </div>
                        ) : (
                          <span className="text-slate-500">No destination details</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                            wth.status === "pending"
                              ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                              : wth.status === "approved"
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                              : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                          }`}
                        >
                          {wth.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {wth.requestedAt ? new Date(wth.requestedAt).toLocaleString("en-IN") : "-"}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {wth.status === "pending" ? (
                            <>
                              <button
                                onClick={() => onApproveWithdrawalPrompt(wth)}
                                className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => onDenyWithdrawalPrompt(wth)}
                                className="px-2.5 py-1 bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 rounded text-xs font-bold transition"
                              >
                                Deny
                              </button>
                            </>
                          ) : player ? (
                            <button
                              onClick={() => onOpenPlayerModal(player, "withdrawal")}
                              className="text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                            >
                              View Profile
                            </button>
                          ) : (
                            <span className="text-slate-500 text-xs">-</span>
                          )}
                          {onDeleteWithdrawal && (
                            <button
                              onClick={() => onDeleteWithdrawal(wth)}
                              title="Delete request"
                              className="p-1 rounded bg-slate-800 hover:bg-rose-600/30 text-slate-400 hover:text-rose-300 border border-slate-700 transition"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
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
