"use client";

import React, { useState, useMemo } from "react";
import {
  Users,
  UserCheck,
  Shield,
  Calendar,
  Search,
  Filter,
  ArrowDownCircle,
  ArrowUpCircle,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { UserProfile } from "@/lib/types";

interface TotalUsersSectionProps {
  users: UserProfile[];
  onOpenPlayerModal: (player: UserProfile, tab: "deposit" | "withdrawal" | "wallet") => void;
}

export function TotalUsersSection({ users, onOpenPlayerModal }: TotalUsersSectionProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | "player" | "Admin">("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const totalCount = users.length;
  const activeCount = users.filter((u) => u.accountStatus === "active").length;
  const adminCount = users.filter((u) => u.role === "Admin" || u.role === "admin").length;
  const playerCount = totalCount - adminCount;

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.trim().toLowerCase();
      return (
        (u.playerId && u.playerId.toLowerCase().includes(q)) ||
        u.uid.toLowerCase().includes(q) ||
        (u.displayName && u.displayName.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q))
      );
    });
  }, [users, roleFilter, searchQuery]);

  const copyToClipboard = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/20 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-300 uppercase tracking-wider">
              Total Users
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white">{totalCount}</span>
            <span className="text-xs text-indigo-400 font-medium">Accounts</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Total registered in Firestore</p>
        </div>

        {/* Active Players */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-emerald-950/40 border border-emerald-500/20 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-300 uppercase tracking-wider">
              Active Players
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white">{playerCount}</span>
            <span className="text-xs text-emerald-400 font-medium">Players</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Rummy gaming players</p>
        </div>

        {/* Admin Accounts */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-amber-950/40 border border-amber-500/20 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
              Admins
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white">{adminCount}</span>
            <span className="text-xs text-amber-400 font-medium">Admins</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Authorized system managers</p>
        </div>

        {/* Live Status */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 to-rose-950/40 border border-rose-500/20 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-300 uppercase tracking-wider">
              Active Status
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black font-mono text-white">{activeCount}</span>
            <span className="text-xs text-rose-400 font-medium">Verified</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">100% Real-time database sync</p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-400" />
              <span>Registered Users Directory</span>
            </h3>
            <p className="text-xs text-slate-400">
              Click on any player to open their profile with live Deposit & Withdrawal options
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, ID, phone..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>

            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              {(["all", "player", "Admin"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1 rounded-lg capitalize transition font-medium ${
                    roleFilter === r
                      ? "bg-slate-800 text-white font-bold"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-12 text-center bg-slate-950/40 rounded-xl border border-slate-800 text-slate-400 text-sm">
            No players found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-950/80 border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Player Name</th>
                  <th className="py-3 px-4">Player ID</th>
                  <th className="py-3 px-4">Email / Phone</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Quick Options</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredUsers.map((user) => {
                  const pId = user.playerId || `RA-${user.uid.slice(0, 6)}`;
                  const isCopied = copiedId === pId;

                  return (
                    <tr
                      key={user.uid}
                      className="hover:bg-slate-800/40 transition group cursor-pointer"
                      onClick={() => onOpenPlayerModal(user, "deposit")}
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                            {user.displayName ? user.displayName.charAt(0).toUpperCase() : "U"}
                          </div>
                          <div>
                            <span className="font-bold text-white group-hover:text-indigo-300 transition block">
                              {user.displayName || "Unknown Player"}
                            </span>
                            <span className="text-[10px] text-slate-500 font-mono">
                              UID: {user.uid.slice(0, 10)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            copyToClipboard(pId);
                          }}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition"
                          title="Click to copy"
                        >
                          <span>{pId}</span>
                          {isCopied ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3 text-amber-400/60" />
                          )}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-300">
                        <div>{user.email || "-"}</div>
                        {user.phone && (
                          <div className="text-[11px] text-slate-400">Ph: {user.phone}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                            user.role === "Admin" || user.role === "admin"
                              ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                              : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                          }`}
                        >
                          {user.role || "player"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold uppercase">
                          {user.accountStatus || "active"}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-400 text-xs">
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN") : "-"}
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenPlayerModal(user, "deposit")}
                            className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 rounded-lg text-xs font-semibold transition"
                          >
                            Deposit
                          </button>
                          <button
                            onClick={() => onOpenPlayerModal(user, "withdrawal")}
                            className="px-2.5 py-1 bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 rounded-lg text-xs font-semibold transition"
                          >
                            Withdrawal
                          </button>
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
