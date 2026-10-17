"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  User,
  ArrowDownCircle,
  ArrowUpCircle,
  Wallet,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  CreditCard,
  Building,
  Smartphone,
  Copy,
  Check,
  PlusCircle,
  RotateCcw,
} from "lucide-react";
import { UserProfile, WalletData, DepositRequest, WithdrawalRequest } from "@/lib/types";
import {
  listenToWallet,
  listenToPlayerDeposits,
  listenToPlayerWithdrawals,
  approveDeposit,
  denyDeposit,
  approveWithdrawal,
  denyWithdrawal,
  adjustWalletBalance,
  createDepositRequest,
  createWithdrawalRequest,
} from "@/lib/firebaseService";

interface PlayerProfileModalProps {
  player: UserProfile | null;
  initialTab?: "deposit" | "withdrawal" | "wallet";
  onClose: () => void;
  adminEmail?: string;
  onRefresh?: () => void;
}

export function PlayerProfileModal({
  player,
  initialTab = "deposit",
  onClose,
  adminEmail = "admin@rummyadda.com",
  onRefresh,
}: PlayerProfileModalProps) {
  const [activeTab, setActiveTab] = useState<"deposit" | "withdrawal" | "wallet">(initialTab);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [copiedId, setCopiedId] = useState(false);

  // Action state
  const [isProcessing, setIsProcessing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Approval / Denial Prompts
  const [selectedDepositForDeny, setSelectedDepositForDeny] = useState<DepositRequest | null>(null);
  const [denyDepositReason, setDenyDepositReason] = useState("Payment verification failed / invalid UTR");

  const [selectedWithdrawalForApprove, setSelectedWithdrawalForApprove] = useState<WithdrawalRequest | null>(null);
  const [approveWithdrawalUtr, setApproveWithdrawalUtr] = useState("");

  const [selectedWithdrawalForDeny, setSelectedWithdrawalForDeny] = useState<WithdrawalRequest | null>(null);
  const [denyWithdrawalReason, setDenyWithdrawalReason] = useState("Incorrect bank or UPI destination details");

  // Manual Adjustment State
  const [adjType, setAdjType] = useState<"deposit" | "win" | "bonus">("deposit");
  const [adjAmount, setAdjAmount] = useState<string>("500");
  const [adjNote, setAdjNote] = useState<string>("Manual offline UPI verification");

  // Test simulation state
  const [testDepositAmount, setTestDepositAmount] = useState("1000");
  const [testWithdrawalAmount, setTestWithdrawalAmount] = useState("500");

  useEffect(() => {
    if (!player) return;

    const unsubWallet = listenToWallet(player.uid, (data) => {
      setWallet(data);
    });

    const unsubDeposits = listenToPlayerDeposits(player.uid, (data) => {
      setDeposits(data);
    });

    const unsubWithdrawals = listenToPlayerWithdrawals(player.uid, (data) => {
      setWithdrawals(data);
    });

    return () => {
      unsubWallet();
      unsubDeposits();
      unsubWithdrawals();
    };
  }, [player]);

  if (!player) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  // Actions
  const handleApproveDeposit = async (dep: DepositRequest) => {
    try {
      setIsProcessing(true);
      setActionMessage(null);
      const targetAmount = dep.requestedAmount || dep.amount || 0;
      await approveDeposit(dep.id, player.uid, targetAmount, adminEmail, dep.utr || "Verified");
      setActionMessage({
        type: "success",
        text: `Deposit of ₹${targetAmount.toLocaleString("en-IN")} approved successfully! Wallet credited.`,
      });
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      console.error(err);
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to approve deposit",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDenyDeposit = async () => {
    if (!selectedDepositForDeny) return;
    try {
      setIsProcessing(true);
      setActionMessage(null);
      const targetAmount = selectedDepositForDeny.requestedAmount || selectedDepositForDeny.amount || 0;
      await denyDeposit(selectedDepositForDeny.id, player.uid, adminEmail, denyDepositReason);
      setActionMessage({
        type: "success",
        text: `Deposit request of ₹${targetAmount} denied.`,
      });
      setSelectedDepositForDeny(null);
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      console.error(err);
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Error denying deposit",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmApproveWithdrawal = async () => {
    if (!selectedWithdrawalForApprove) return;
    try {
      setIsProcessing(true);
      setActionMessage(null);
      const targetAmount = selectedWithdrawalForApprove.amount || 0;
      await approveWithdrawal(
        selectedWithdrawalForApprove.id,
        player.uid,
        targetAmount,
        adminEmail,
        approveWithdrawalUtr || `UTR${Date.now()}`
      );
      setActionMessage({
        type: "success",
        text: `Withdrawal of ₹${targetAmount} approved and processed! (UTR: ${approveWithdrawalUtr || "Confirmed"})`,
      });
      setSelectedWithdrawalForApprove(null);
      setApproveWithdrawalUtr("");
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      console.error(err);
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Error approving withdrawal",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmDenyWithdrawal = async () => {
    if (!selectedWithdrawalForDeny) return;
    try {
      setIsProcessing(true);
      setActionMessage(null);
      const targetAmount = selectedWithdrawalForDeny.amount || 0;
      await denyWithdrawal(
        selectedWithdrawalForDeny.id,
        player.uid,
        targetAmount,
        adminEmail,
        denyWithdrawalReason,
        true
      );
      setActionMessage({
        type: "success",
        text: `Withdrawal of ₹${targetAmount} denied. Amount refunded back to player balance.`,
      });
      setSelectedWithdrawalForDeny(null);
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      console.error(err);
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Error denying withdrawal",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualWalletAdjustment = async () => {
    const val = parseFloat(adjAmount);
    if (isNaN(val) || val <= 0) {
      setActionMessage({ type: "error", text: "Please enter a valid amount" });
      return;
    }
    try {
      setIsProcessing(true);
      setActionMessage(null);
      const depDelta = adjType === "deposit" ? val : 0;
      const winDelta = adjType === "win" ? val : 0;
      const bonDelta = adjType === "bonus" ? val : 0;

      await adjustWalletBalance(player.uid, depDelta, winDelta, bonDelta, adminEmail, adjNote);
      setActionMessage({
        type: "success",
        text: `Successfully added ₹${val} to player's ${adjType} balance!`,
      });
      if (onRefresh) onRefresh();
    } catch (err: unknown) {
      console.error(err);
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Wallet update failed",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateTestDeposit = async () => {
    const amt = parseFloat(testDepositAmount);
    if (isNaN(amt) || amt <= 0) return;
    try {
      setIsProcessing(true);
      setActionMessage(null);
      await createDepositRequest(
        player.uid,
        player.playerId || "RA-PLAYER",
        player.displayName || "Player",
        amt,
        "UPI",
        `UPI${Date.now().toString().slice(-6)}`
      );
      setActionMessage({
        type: "success",
        text: `New deposit request (₹${amt}) created! You can now Approve or Deny it below.`,
      });
    } catch (err: unknown) {
      console.error(err);
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to create deposit request",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateTestWithdrawal = async () => {
    const amt = parseFloat(testWithdrawalAmount);
    if (isNaN(amt) || amt <= 0) return;
    try {
      setIsProcessing(true);
      setActionMessage(null);
      await createWithdrawalRequest(
        player.uid,
        player.playerId || "RA-PLAYER",
        player.displayName || "Player",
        amt,
        {
          upiId: `${(player.displayName || "user").toLowerCase().replace(/\s+/g, "")}@upi`,
          holderName: player.displayName || "Player Name",
          bankName: "State Bank of India",
          accountNumber: "98765432101",
          ifscCode: "SBIN0001234",
        }
      );
      setActionMessage({
        type: "success",
        text: `New withdrawal request (₹${amt}) created! You can now Approve or Deny it below.`,
      });
    } catch (err: unknown) {
      console.error(err);
      setActionMessage({
        type: "error",
        text: err instanceof Error ? err.message : "Failed to create withdrawal request",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const pendingDeposits = deposits.filter((d) => d.status === "pending");
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-5 sm:p-6 border-b border-slate-800/80 bg-slate-900/90">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg shadow-rose-950/40">
              {player.displayName ? player.displayName.charAt(0).toUpperCase() : "P"}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-white tracking-tight">
                  {player.displayName || "Player Profile"}
                </h2>
                <span
                  onClick={() => copyToClipboard(player.playerId || player.uid)}
                  className="cursor-pointer group inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition"
                  title="Click to copy Player ID"
                >
                  <span>{player.playerId || "RA-PLAYER"}</span>
                  {copiedId ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3 text-amber-400/60 group-hover:text-amber-400" />
                  )}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    player.role === "Admin" || player.role === "admin"
                      ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                      : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
                  }`}
                >
                  {player.role || "player"}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-medium">
                  {player.accountStatus || "active"}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 flex-wrap">
                {player.email && <span>Email: {player.email}</span>}
                {player.phone && <span>• Phone: {player.phone}</span>}
                <span className="font-mono text-slate-500">UID: {player.uid.slice(0, 10)}...</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Wallet Balances Bar */}
        <div className="grid grid-cols-3 gap-3 p-4 sm:px-6 bg-slate-950/60 border-b border-slate-800/80">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-xs text-slate-400 block font-medium">Deposit Balance</span>
            <span className="text-lg sm:text-xl font-bold text-emerald-400 font-mono">
              ₹{(wallet?.depositBalance || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-xs text-slate-400 block font-medium">Winning Balance</span>
            <span className="text-lg sm:text-xl font-bold text-amber-400 font-mono">
              ₹{(wallet?.winBalance || 0).toLocaleString("en-IN")}
            </span>
          </div>
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800">
            <span className="text-xs text-slate-400 block font-medium">Bonus Balance</span>
            <span className="text-lg sm:text-xl font-bold text-indigo-400 font-mono">
              ₹{(wallet?.bonusBalance || 0).toLocaleString("en-IN")}
            </span>
          </div>
        </div>

        {/* The 2 Core Options Tabs: Deposit & Withdrawal */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-900/60">
          <button
            onClick={() => setActiveTab("deposit")}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition ${
              activeTab === "deposit"
                ? "border-emerald-500 text-emerald-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Deposit Requests</span>
            {pendingDeposits.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                {pendingDeposits.length} Pending
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("withdrawal")}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition ${
              activeTab === "withdrawal"
                ? "border-amber-500 text-amber-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Withdrawal Requests</span>
            {pendingWithdrawals.length > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                {pendingWithdrawals.length} Pending
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("wallet")}
            className={`flex items-center gap-2 py-3 px-4 font-semibold text-sm border-b-2 transition ${
              activeTab === "wallet"
                ? "border-indigo-500 text-indigo-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>Wallet Adjustment</span>
          </button>
        </div>

        {/* Notification Toast */}
        {actionMessage && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl flex items-center justify-between text-xs sm:text-sm font-medium ${
              actionMessage.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border border-rose-500/30 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {actionMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>{actionMessage.text}</span>
            </div>
            <button
              onClick={() => setActionMessage(null)}
              className="p-1 hover:bg-slate-800/60 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: DEPOSIT */}
          {activeTab === "deposit" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ArrowDownCircle className="w-5 h-5 text-emerald-400" />
                    Deposit Requests
                  </h3>
                  <p className="text-xs text-slate-400">
                    Review incoming deposit requests and Approve or Deny them.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80 text-xs">
                  <span className="text-slate-400 pl-1 font-medium">Add Request:</span>
                  <input
                    type="number"
                    value={testDepositAmount}
                    onChange={(e) => setTestDepositAmount(e.target.value)}
                    className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-amber-400 font-mono text-center font-bold"
                  />
                  <button
                    onClick={handleCreateTestDeposit}
                    disabled={isProcessing}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition disabled:opacity-50"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {deposits.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800 text-center">
                  <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">
                    No deposit requests found for this player
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    When the player submits a deposit request, it will appear here in real-time.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {deposits.map((dep) => {
                    const isPending = dep.status === "pending";
                    const displayAmt = dep.requestedAmount || dep.amount || 0;
                    return (
                      <div
                        key={dep.id}
                        className={`p-4 rounded-xl border transition ${
                          isPending
                            ? "bg-slate-800/70 border-emerald-500/40 shadow-lg shadow-emerald-950/10"
                            : dep.status === "approved"
                            ? "bg-slate-900/60 border-slate-800"
                            : "bg-slate-900/40 border-rose-950/40 opacity-75"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-2xl font-bold font-mono text-emerald-400">
                                ₹{displayAmt.toLocaleString("en-IN")}
                              </span>
                              <span
                                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  dep.status === "pending"
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                                    : dep.status === "approved"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                    : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                                }`}
                              >
                                {dep.status}
                              </span>
                              <span className="text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {dep.paymentMethod || "UPI"}
                              </span>
                            </div>

                            <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                              {dep.depositId && <span className="font-mono text-slate-400">Ref: {dep.depositId}</span>}
                              {dep.utr && (
                                <span className="font-mono text-slate-300">
                                  UTR: <strong className="text-amber-300">{dep.utr}</strong>
                                </span>
                              )}
                              <span>
                                Date: {dep.requestedAt ? new Date(dep.requestedAt).toLocaleString("en-IN") : "Recent"}
                              </span>
                              {dep.reviewedBy && (
                                <span className="text-slate-500">
                                  Reviewed by: {dep.reviewedBy}
                                </span>
                              )}
                            </div>
                            {dep.note && (
                              <p className="text-xs text-slate-400 italic">
                                Note: {dep.note}
                              </p>
                            )}
                          </div>

                          {/* ACTION BUTTONS */}
                          {isPending && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => handleApproveDeposit(dep)}
                                disabled={isProcessing}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/40 transition disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => setSelectedDepositForDeny(dep)}
                                disabled={isProcessing}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-xs sm:text-sm transition disabled:opacity-50"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Deny</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: WITHDRAWAL */}
          {activeTab === "withdrawal" && (
            <div className="space-y-6">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ArrowUpCircle className="w-5 h-5 text-amber-400" />
                    Withdrawal Requests
                  </h3>
                  <p className="text-xs text-slate-400">
                    Review withdrawal requests, verify payout destination and Approve or Deny.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-xl border border-slate-700/80 text-xs">
                  <span className="text-slate-400 pl-1 font-medium">Add Request:</span>
                  <input
                    type="number"
                    value={testWithdrawalAmount}
                    onChange={(e) => setTestWithdrawalAmount(e.target.value)}
                    className="w-16 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-amber-400 font-mono text-center font-bold"
                  />
                  <button
                    onClick={handleCreateTestWithdrawal}
                    disabled={isProcessing}
                    className="px-2.5 py-1 bg-amber-600 hover:bg-amber-500 text-white rounded font-medium transition disabled:opacity-50"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {withdrawals.length === 0 ? (
                <div className="p-8 rounded-2xl bg-slate-950/40 border border-slate-800 text-center">
                  <Clock className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">
                    No withdrawal requests found for this player
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    When the player submits a withdrawal request, it will appear here in real-time.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {withdrawals.map((wth) => {
                    const isPending = wth.status === "pending";
                    return (
                      <div
                        key={wth.id}
                        className={`p-4 rounded-xl border transition ${
                          isPending
                            ? "bg-slate-800/70 border-amber-500/40 shadow-lg shadow-amber-950/10"
                            : wth.status === "approved"
                            ? "bg-slate-900/60 border-slate-800"
                            : "bg-slate-900/40 border-rose-950/40 opacity-75"
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-2xl font-bold font-mono text-amber-400">
                                ₹{wth.amount.toLocaleString("en-IN")}
                              </span>
                              <span
                                className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                  wth.status === "pending"
                                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                                    : wth.status === "approved"
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                                    : "bg-rose-500/20 text-rose-400 border border-rose-500/40"
                                }`}
                              >
                                {wth.status}
                              </span>
                            </div>

                            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-1">
                              {(wth.maskedDestination || wth.upiId) && (
                                <div className="flex items-center gap-2">
                                  <Smartphone className="w-3.5 h-3.5 text-amber-400" />
                                  <span className="text-slate-400">UPI / Payout ID:</span>
                                  <span className="font-mono text-white font-semibold">
                                    {wth.maskedDestination || wth.upiId}
                                  </span>
                                </div>
                              )}
                              {wth.accountNumber && (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <Building className="w-3.5 h-3.5 text-indigo-400" />
                                  <span className="text-slate-400">Account:</span>
                                  <span className="font-mono text-white">{wth.accountNumber}</span>
                                  <span className="text-slate-400">IFSC:</span>
                                  <span className="font-mono text-white">{wth.ifscCode}</span>
                                  {wth.bankName && <span className="text-slate-500">({wth.bankName})</span>}
                                </div>
                              )}
                              {wth.holderName && (
                                <div className="text-slate-400">
                                  Holder: <span className="text-slate-200">{wth.holderName}</span>
                                </div>
                              )}
                            </div>

                            <div className="text-xs text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                              {wth.utr && (
                                <span className="font-mono text-slate-300">
                                  Payout UTR: <strong className="text-emerald-300">{wth.utr}</strong>
                                </span>
                              )}
                              <span>
                                Date: {wth.requestedAt ? new Date(wth.requestedAt).toLocaleString("en-IN") : "Recent"}
                              </span>
                              {wth.rejectionReason && (
                                <span className="text-rose-400 font-medium">
                                  Reason: {wth.rejectionReason}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* ACTION BUTTONS */}
                          {isPending && (
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                onClick={() => setSelectedWithdrawalForApprove(wth)}
                                disabled={isProcessing}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-950/40 transition disabled:opacity-50"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Approve</span>
                              </button>
                              <button
                                onClick={() => setSelectedWithdrawalForDeny(wth)}
                                disabled={isProcessing}
                                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 font-bold text-xs sm:text-sm transition disabled:opacity-50"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>Deny</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: WALLET CONTROL */}
          {activeTab === "wallet" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-indigo-400" />
                  Manual Wallet Balance Adjustment
                </h3>
                <p className="text-xs text-slate-400">
                  Credit or adjust player balances directly for verified offline transfers.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Balance Type
                    </label>
                    <select
                      value={adjType}
                      onChange={(e) => setAdjType(e.target.value as "deposit" | "win" | "bonus")}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="deposit">Deposit Balance</option>
                      <option value="win">Winning Balance</option>
                      <option value="bonus">Bonus Balance</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={adjAmount}
                      onChange={(e) => setAdjAmount(e.target.value)}
                      placeholder="500"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white font-mono font-bold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-slate-300 block mb-1">
                      Reason / UTR Note
                    </label>
                    <input
                      type="text"
                      value={adjNote}
                      onChange={(e) => setAdjNote(e.target.value)}
                      placeholder="Offline UPI verification"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleManualWalletAdjustment}
                    disabled={isProcessing}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-lg shadow-indigo-950/40 transition disabled:opacity-50"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Credit Wallet (+₹{adjAmount})</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal: Deny Deposit Reason Dialog */}
        {selectedDepositForDeny && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-2xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <XCircle className="w-5 h-5" />
                <span>Deny Deposit Request</span>
              </div>
              <p className="text-xs text-slate-300">
                Amount: <strong className="text-white font-mono">₹{selectedDepositForDeny.requestedAmount || selectedDepositForDeny.amount}</strong>
              </p>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Reason for rejection:
                </label>
                <input
                  type="text"
                  value={denyDepositReason}
                  onChange={(e) => setDenyDepositReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setSelectedDepositForDeny(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDenyDeposit}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition disabled:opacity-50"
                >
                  Confirm Denial
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Approve Withdrawal Prompt (Enter UTR) */}
        {selectedWithdrawalForApprove && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirm Withdrawal & Payout</span>
              </div>
              <p className="text-xs text-slate-300">
                Amount: <strong className="text-white font-mono">₹{selectedWithdrawalForApprove.amount}</strong>
              </p>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Bank Transfer Reference / UTR Number:
                </label>
                <input
                  type="text"
                  value={approveWithdrawalUtr}
                  onChange={(e) => setApproveWithdrawalUtr(e.target.value)}
                  placeholder="e.g. 428190392812"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setSelectedWithdrawalForApprove(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmApproveWithdrawal}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition disabled:opacity-50"
                >
                  Confirm Payout
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Deny Withdrawal Reason Dialog */}
        {selectedWithdrawalForDeny && (
          <div className="absolute inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-rose-500/30 rounded-2xl p-5 space-y-4 shadow-2xl">
              <div className="flex items-center gap-2 text-rose-400 font-bold">
                <XCircle className="w-5 h-5" />
                <span>Deny Withdrawal Request</span>
              </div>
              <p className="text-xs text-slate-300">
                Amount: <strong className="text-white font-mono">₹{selectedWithdrawalForDeny.amount}</strong>
                <span className="block text-slate-400 text-[11px] mt-0.5">
                  (This amount will be refunded back to the player&apos;s winning balance)
                </span>
              </p>
              <div>
                <label className="text-xs text-slate-400 block mb-1">
                  Reason for rejection:
                </label>
                <input
                  type="text"
                  value={denyWithdrawalReason}
                  onChange={(e) => setDenyWithdrawalReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setSelectedWithdrawalForDeny(null)}
                  className="px-4 py-2 rounded-xl text-slate-400 hover:text-white text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDenyWithdrawal}
                  disabled={isProcessing}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition disabled:opacity-50"
                >
                  Confirm Denial & Refund
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
