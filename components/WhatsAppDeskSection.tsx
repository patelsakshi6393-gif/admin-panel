"use client";

import React, { useState, useEffect } from "react";
import {
  Phone,
  Search,
  MessageSquare,
  ArrowDownCircle,
  ArrowUpCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Wallet,
  AlertCircle,
  Check,
  X,
  CreditCard,
  Building,
  QrCode,
  Loader2,
  FileText,
  ExternalLink,
  ShieldCheck,
  Coins,
  RefreshCw,
} from "lucide-react";
import {
  UserProfile,
  WalletData,
  DepositRequest,
  WithdrawalRequest,
  TransactionRecord,
} from "@/lib/types";
import {
  listenToWallet,
  listenToPlayerDeposits,
  listenToPlayerWithdrawals,
  listenToPlayerTransactions,
  approveDeposit,
  denyDeposit,
  approveWithdrawal,
  denyWithdrawal,
  directWhatsAppDepositCredit,
  directWhatsAppWithdrawalPayout,
  sanitizePhone,
} from "@/lib/firebaseService";

interface WhatsAppDeskSectionProps {
  users: UserProfile[];
  adminEmail: string;
  onShowToast: (type: "success" | "error", message: string) => void;
}

export function WhatsAppDeskSection({
  users,
  adminEmail,
  onShowToast,
}: WhatsAppDeskSectionProps) {
  // Strict Mobile Search State - NO quick user select
  const [mobileQuery, setMobileQuery] = useState("");
  const [searchError, setSearchError] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  // Selected User & Real-time State
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [deposits, setDeposits] = useState<DepositRequest[]>([]);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);

  // Sub-tabs for user history
  const [activeHistoryTab, setActiveHistoryTab] = useState<"deposits" | "withdrawals" | "ledger">("deposits");

  // Action / Loading State
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Manual WhatsApp Deposit Modal State
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [manualDepAmount, setManualDepAmount] = useState("500");
  const [manualDepUtr, setManualDepUtr] = useState("");
  const [manualDepRemark, setManualDepRemark] = useState("WhatsApp Screenshot Verified");

  // Manual WhatsApp Withdrawal Modal State
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [manualWdAmount, setManualWdAmount] = useState("100");
  const [manualWdMethod, setManualWdMethod] = useState<"UPI" | "Bank">("UPI");
  const [manualWdDestination, setManualWdDestination] = useState("");
  const [manualWdUtr, setManualWdUtr] = useState("");
  const [manualWdRemark, setManualWdRemark] = useState("WhatsApp Cashout Paid");

  // Denial Reason Confirmation Modal
  const [denialModal, setDenialModal] = useState<{
    type: "deposit" | "withdrawal";
    item: DepositRequest | WithdrawalRequest;
  } | null>(null);
  const [denialReason, setDenialReason] = useState("Invalid payment screenshot / UTR not found in bank");

  // Real-time synchronization for selected user
  useEffect(() => {
    if (!selectedUser) {
      setWallet(null);
      setDeposits([]);
      setWithdrawals([]);
      setTransactions([]);
      return;
    }

    const unsubW = listenToWallet(selectedUser.uid, (data) => setWallet(data));
    const unsubD = listenToPlayerDeposits(selectedUser.uid, (data) => setDeposits(data));
    const unsubWd = listenToPlayerWithdrawals(selectedUser.uid, (data) => setWithdrawals(data));
    const unsubTx = listenToPlayerTransactions(selectedUser.uid, (data) => setTransactions(data));

    return () => {
      unsubW();
      unsubD();
      unsubWd();
      unsubTx();
    };
  }, [selectedUser]);

  // Handle Mobile Number Search
  const handleSearchMobile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSearchError("");

    const raw = mobileQuery.trim();
    if (!raw) {
      setSearchError("कृपया यूजर का 10-अंकों का मोबाइल नंबर दर्ज करें।");
      return;
    }

    const clean = sanitizePhone(raw);
    if (clean.length < 10) {
      setSearchError("कृपया 10 अंकों का मान्य मोबाइल नंबर दर्ज करें (Valid 10-digit number required)।");
      return;
    }

    setIsSearching(true);

    // Strict search across users array:
    // Match phone == clean OR phone == 91+clean OR email == clean@phone.rummyadda.in
    const found = users.find((u) => {
      const uPhone = sanitizePhone(u.phone || "");
      if (uPhone && uPhone === clean) return true;
      if (u.email && u.email.toLowerCase().startsWith(clean)) return true;
      if (u.phone && u.phone.includes(clean)) return true;
      // Allow fallback if someone entered exact Player ID
      if (u.playerId && u.playerId.toUpperCase() === raw.toUpperCase()) return true;
      return false;
    });

    setIsSearching(false);

    if (!found) {
      setSearchError(`मोबाइल नंबर "${clean}" से कोई खिलाड़ी नहीं मिला। कृपया नंबर दोबारा जांचें।`);
      setSelectedUser(null);
      return;
    }

    setSelectedUser(found);
    onShowToast("success", `खिलाड़ी ${found.displayName || 'Player'} (${found.playerId}) की प्रोफाइल लोड हो गई!`);
  };

  const handleResetSearch = () => {
    setMobileQuery("");
    setSelectedUser(null);
    setSearchError("");
  };

  // Deposit Actions
  const handleApproveDepositItem = async (dep: DepositRequest) => {
    if (!selectedUser) return;
    setActionLoadingId(dep.id);
    try {
      const amt = dep.requestedAmount || dep.amount || 0;
      await approveDeposit(dep.id, dep.uid, amt, adminEmail, dep.utr || "Approved via WhatsApp Desk");
      onShowToast("success", `डिपॉजिट स्वीकृत (Approved)! ₹${amt.toLocaleString("en-IN")} क्रेडिट हो गए।`);
    } catch (err: unknown) {
      onShowToast("error", err instanceof Error ? err.message : "डिपॉजिट अप्रूव करने में विफल।");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDenyDepositConfirm = async () => {
    if (!denialModal || denialModal.type !== "deposit") return;
    const dep = denialModal.item as DepositRequest;
    setActionLoadingId(dep.id);
    setDenialModal(null);
    try {
      await denyDeposit(dep.id, dep.uid, adminEmail, denialReason);
      onShowToast("success", `डिपॉजिट अस्वीकृत (Rejected) कर दिया गया।`);
    } catch (err: unknown) {
      onShowToast("error", err instanceof Error ? err.message : "डिपॉजिट रिजेक्ट करने में विफल।");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Withdrawal Actions
  const handleApproveWithdrawalItem = async (wth: WithdrawalRequest) => {
    if (!selectedUser) return;
    const utrPrompt = prompt("UTR / Transaction Reference Number दर्ज करें:", `UTR${Date.now()}`);
    if (utrPrompt === null) return;

    setActionLoadingId(wth.id);
    try {
      await approveWithdrawal(wth.id, wth.uid, wth.amount, adminEmail, utrPrompt);
      onShowToast("success", `विड्रॉल स्वीकृत (Paid)! UTR: ${utrPrompt}`);
    } catch (err: unknown) {
      onShowToast("error", err instanceof Error ? err.message : "विड्रॉल अप्रूव करने में विफल।");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDenyWithdrawalConfirm = async () => {
    if (!denialModal || denialModal.type !== "withdrawal") return;
    const wth = denialModal.item as WithdrawalRequest;
    setActionLoadingId(wth.id);
    setDenialModal(null);
    try {
      await denyWithdrawal(wth.id, wth.uid, wth.amount, adminEmail, denialReason, true);
      onShowToast("success", `विड्रॉल अस्वीकृत किया गया और ₹${wth.amount} यूजर के विंग्स में रिफंड हो गए!`);
    } catch (err: unknown) {
      onShowToast("error", err instanceof Error ? err.message : "विड्रॉल रिजेक्ट करने में विफल।");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Execute Direct WhatsApp Deposit
  const handleExecuteDirectDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const num = parseInt(manualDepAmount, 10);
    if (isNaN(num) || num <= 0) {
      onShowToast("error", "कृपया वैध राशि दर्ज करें।");
      return;
    }

    setActionLoadingId("direct-deposit");
    try {
      await directWhatsAppDepositCredit(
        selectedUser.uid,
        selectedUser.playerId || "RA-UNKNOWN",
        num,
        adminEmail,
        manualDepUtr || "WhatsApp Verified",
        manualDepRemark
      );
      setShowDepositModal(false);
      setManualDepUtr("");
      onShowToast("success", `सफलतापूर्वक ₹${num.toLocaleString("en-IN")} खिलाड़ी के डिपॉजिट में जोड़ दिए गए!`);
    } catch (err: unknown) {
      onShowToast("error", err instanceof Error ? err.message : "डिपॉजिट करने में त्रुटि आई।");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Execute Direct WhatsApp Withdrawal
  const handleExecuteDirectWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser || !wallet) return;
    const num = parseInt(manualWdAmount, 10);
    if (isNaN(num) || num <= 0) {
      onShowToast("error", "कृपया वैध राशि दर्ज करें।");
      return;
    }
    if (num > wallet.winBalance) {
      onShowToast("error", `अपर्याप्त विंग्स बैलेंस (उपलब्ध: ₹${wallet.winBalance})।`);
      return;
    }
    if (!manualWdDestination.trim()) {
      onShowToast("error", "कृपया UPI ID या बैंक विवरण दर्ज करें।");
      return;
    }

    setActionLoadingId("direct-withdrawal");
    try {
      await directWhatsAppWithdrawalPayout(
        selectedUser.uid,
        selectedUser.playerId || "RA-UNKNOWN",
        selectedUser.displayName || "Player",
        num,
        manualWdMethod,
        manualWdDestination.trim(),
        adminEmail,
        manualWdUtr || "WhatsApp Cashout Paid",
        manualWdRemark
      );
      setShowWithdrawModal(false);
      setManualWdDestination("");
      setManualWdUtr("");
      onShowToast("success", `सफलतापूर्वक ₹${num.toLocaleString("en-IN")} विड्रॉल करके पेड मार्क कर दिया गया!`);
    } catch (err: unknown) {
      onShowToast("error", err instanceof Error ? err.message : "विड्रॉल प्रोसेस करने में त्रुटि आई।");
    } finally {
      setActionLoadingId(null);
    }
  };

  const pendingDeposits = deposits.filter((d) => d.status === "pending");
  const pendingWithdrawals = withdrawals.filter((w) => w.status === "pending");
  const totalPlayable = wallet
    ? (wallet.depositBalance || 0) + (wallet.winBalance || 0) + (wallet.bonusBalance || 0)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Search Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-emerald-950/40 p-6 rounded-3xl border border-emerald-500/30 shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold mb-3">
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp Operations & Accounts Desk</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white">
            यूजर का 10-अंकों का मोबाइल नंबर दर्ज करें
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 mb-5">
            WhatsApp पर पेमेंट स्क्रीनशॉट या विड्रॉल का मैसेज भेजने वाले खिलाड़ी का मोबाइल नंबर डालें। त्वरित यूजर सेलेक्ट बंद है ताकि गलत खाते में कोई ट्रांजैक्शन न हो।
          </p>

          <form onSubmit={handleSearchMobile} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-bold text-sm">
                +91
              </div>
              <input
                type="tel"
                value={mobileQuery}
                onChange={(e) => setMobileQuery(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                placeholder="9876543210 (10 Digits Mobile Number)"
                className="w-full pl-14 pr-4 py-3.5 bg-slate-950 border border-slate-700/80 rounded-2xl text-base font-mono text-white placeholder-slate-600 focus:outline-none focus:border-emerald-400 transition"
                maxLength={10}
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-sm rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 disabled:opacity-50 transition cursor-pointer whitespace-nowrap"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>खोज रहे हैं...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>प्रोफाइल खोजें (Open Profile)</span>
                </>
              )}
            </button>

            {selectedUser && (
              <button
                type="button"
                onClick={handleResetSearch}
                className="px-4 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-2xl transition"
              >
                नया नंबर
              </button>
            )}
          </form>

          {searchError && (
            <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}
        </div>
      </div>

      {/* RENDERED USER PROFILE & DESK WORKSPACE */}
      {selectedUser && (
        <div className="space-y-6">
          {/* User Profile Header Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Identity */}
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-xl">
                  {selectedUser.displayName?.charAt(0).toUpperCase() || "P"}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      {selectedUser.displayName || "Player"}
                    </h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      ID: {selectedUser.playerId || "RA-XXXXXX"}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {selectedUser.accountStatus || "ACTIVE"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                    <span className="flex items-center gap-1 font-mono text-white">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      +91 {selectedUser.phone || sanitizePhone(selectedUser.email || "")}
                    </span>
                    <span className="text-slate-600">•</span>
                    <span>UID: {selectedUser.uid.slice(0, 8)}...</span>
                    {selectedUser.createdAt && (
                      <>
                        <span className="text-slate-600">•</span>
                        <span>
                          Joined:{" "}
                          {new Date(selectedUser.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                {selectedUser.phone && (
                  <a
                    href={`https://wa.me/91${sanitizePhone(selectedUser.phone)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="py-2.5 px-4 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 font-bold text-xs rounded-xl flex items-center gap-2 transition"
                  >
                    <MessageSquare className="w-4 h-4 text-emerald-400" />
                    <span>Chat on WhatsApp</span>
                  </a>
                )}

                <button
                  onClick={() => setShowDepositModal(true)}
                  className="py-2.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  <span>+ WhatsApp डिपॉजिट करें</span>
                </button>

                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="py-2.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-1.5 transition cursor-pointer"
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  <span>- WhatsApp विड्रॉल करें</span>
                </button>
              </div>
            </div>
          </div>

          {/* Wallet Balances Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950/40 border border-indigo-500/30 rounded-2xl p-5 shadow-xl space-y-1">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-indigo-400">
                Total Playable Balance
              </span>
              <p className="text-2xl sm:text-3xl font-black text-white font-mono">
                ₹{totalPlayable.toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-slate-400">Deposit + Winnings + Bonus</p>
            </div>

            <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-5 shadow-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-blue-400">
                  डिपॉजिट बैलेंस (Deposited)
                </span>
                <button
                  onClick={() => setShowDepositModal(true)}
                  className="text-[10px] font-bold text-blue-400 hover:underline"
                >
                  + Add
                </button>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-white font-mono">
                ₹{(wallet?.depositBalance || 0).toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-slate-400">100% खेल में इस्तेमाल योग्य</p>
            </div>

            <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-xl space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-extrabold tracking-wider text-emerald-400">
                  विंग्स बैलेंस (Withdrawable)
                </span>
                <button
                  onClick={() => setShowWithdrawModal(true)}
                  className="text-[10px] font-bold text-emerald-400 hover:underline"
                >
                  - Withdraw
                </button>
              </div>
              <p className="text-2xl sm:text-3xl font-black text-emerald-300 font-mono">
                ₹{(wallet?.winBalance || 0).toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-slate-400">विड्रॉल देने योग्य राशि</p>
            </div>

            <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-5 shadow-xl space-y-1">
              <span className="text-[10px] uppercase font-extrabold tracking-wider text-purple-400">
                बोनस बैलेंस (Bonus)
              </span>
              <p className="text-2xl sm:text-3xl font-black text-white font-mono">
                ₹{(wallet?.bonusBalance || 0).toLocaleString("en-IN")}
              </p>
              <p className="text-[11px] text-slate-400">Non-withdrawable गेम क्रेडिट्स</p>
            </div>
          </div>

          {/* Pending Alerts Banner */}
          {(pendingDeposits.length > 0 || pendingWithdrawals.length > 0) && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-amber-400 animate-ping" />
                <p className="text-xs sm:text-sm font-bold text-amber-300">
                  इस यूजर की {pendingDeposits.length} पेंडिंग डिपॉजिट और {pendingWithdrawals.length} पेंडिंग विड्रॉल रिक्वेस्ट लंबित हैं!
                </p>
              </div>
              <div className="flex items-center gap-2">
                {pendingDeposits.length > 0 && (
                  <button
                    onClick={() => setActiveHistoryTab("deposits")}
                    className="px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold hover:bg-amber-500/30"
                  >
                    डिपॉजिट देखें ({pendingDeposits.length})
                  </button>
                )}
                {pendingWithdrawals.length > 0 && (
                  <button
                    onClick={() => setActiveHistoryTab("withdrawals")}
                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 text-xs font-bold hover:bg-emerald-500/30"
                  >
                    विड्रॉल देखें ({pendingWithdrawals.length})
                  </button>
                )}
              </div>
            </div>
          )}

          {/* History Tabs Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4 flex-wrap">
              <button
                onClick={() => setActiveHistoryTab("deposits")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                  activeHistoryTab === "deposits"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <ArrowDownCircle className="w-4 h-4" />
                <span>डिपॉजिट हिस्ट्री & रिक्वेस्ट ({deposits.length})</span>
                {pendingDeposits.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-extrabold">
                    {pendingDeposits.length} Pending
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveHistoryTab("withdrawals")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                  activeHistoryTab === "withdrawals"
                    ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <ArrowUpCircle className="w-4 h-4" />
                <span>विड्रॉल हिस्ट्री & रिक्वेस्ट ({withdrawals.length})</span>
                {pendingWithdrawals.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-extrabold">
                    {pendingWithdrawals.length} Pending
                  </span>
                )}
              </button>

              <button
                onClick={() => setActiveHistoryTab("ledger")}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer ${
                  activeHistoryTab === "ledger"
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/30"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>सम्पूर्ण ट्रांजैक्शन लेज़र ({transactions.length})</span>
              </button>
            </div>

            {/* TAB 1: DEPOSITS */}
            {activeHistoryTab === "deposits" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-200">
                    डिपॉजिट अनुरोध व संपूर्ण हिस्ट्री
                  </h4>
                  <button
                    onClick={() => setShowDepositModal(true)}
                    className="py-1.5 px-3 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-300 text-xs font-bold rounded-lg flex items-center gap-1.5"
                  >
                    <ArrowDownCircle className="w-3.5 h-3.5" />
                    <span>+ नया डिपॉजिट जोड़ें</span>
                  </button>
                </div>

                {deposits.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                    <ArrowDownCircle className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">इस यूजर का कोई डिपॉजिट रिकॉर्ड नहीं है।</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {deposits.map((dep) => {
                      const isPending = dep.status === "pending";
                      const isApproved = dep.status === "approved";
                      const isRejected = dep.status === "rejected";
                      const amt = dep.requestedAmount || dep.amount || 0;

                      return (
                        <div
                          key={dep.id}
                          className={`p-4 rounded-2xl border transition ${
                            isPending
                              ? "bg-amber-500/10 border-amber-500/40"
                              : "bg-slate-950/80 border-slate-800"
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-lg font-black font-mono text-white">
                                  +₹{amt.toLocaleString("en-IN")}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                    isApproved
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                      : isRejected
                                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                      : "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                                  }`}
                                >
                                  {dep.status.toUpperCase()}
                                </span>
                              </div>

                              <p className="text-xs text-slate-400">
                                Ref: <span className="font-mono text-slate-300">{dep.depositId || dep.id}</span>
                                {" • "}
                                {dep.requestedAt ? new Date(dep.requestedAt).toLocaleString("en-IN") : "N/A"}
                              </p>

                              {(dep.utr || dep.note) && (
                                <p className="text-[11px] text-slate-400">
                                  {dep.utr && <span className="font-mono text-slate-300 mr-2">UTR: {dep.utr}</span>}
                                  {dep.note && <span className="italic">{dep.note}</span>}
                                </p>
                              )}
                            </div>

                            {isPending ? (
                              <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                  onClick={() => handleApproveDepositItem(dep)}
                                  disabled={actionLoadingId === dep.id}
                                  className="flex-1 sm:flex-none py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer"
                                >
                                  {actionLoadingId === dep.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5" />
                                  )}
                                  <span>स्वीकार करें (Approve)</span>
                                </button>

                                <button
                                  onClick={() =>
                                    setDenialModal({
                                      type: "deposit",
                                      item: dep,
                                    })
                                  }
                                  disabled={actionLoadingId === dep.id}
                                  className="flex-1 sm:flex-none py-2 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>अस्वीकार (Deny)</span>
                                </button>
                              </div>
                            ) : (
                              <div className="text-right text-xs text-slate-400">
                                {dep.reviewedAt && (
                                  <span>Reviewed: {new Date(dep.reviewedAt).toLocaleDateString("en-IN")}</span>
                                )}
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

            {/* TAB 2: WITHDRAWALS */}
            {activeHistoryTab === "withdrawals" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-200">
                    विड्रॉल अनुरोध व संपूर्ण भुगतान हिस्ट्री
                  </h4>
                  <button
                    onClick={() => setShowWithdrawModal(true)}
                    className="py-1.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold rounded-lg flex items-center gap-1.5"
                  >
                    <ArrowUpCircle className="w-3.5 h-3.5" />
                    <span>- नया विड्रॉल करें</span>
                  </button>
                </div>

                {withdrawals.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                    <ArrowUpCircle className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">इस यूजर का कोई विड्रॉल रिकॉर्ड नहीं है।</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {withdrawals.map((wd) => {
                      const isPending = wd.status === "pending";
                      const isApproved = wd.status === "approved";
                      const isRejected = wd.status === "rejected";

                      return (
                        <div
                          key={wd.id}
                          className={`p-4 rounded-2xl border transition ${
                            isPending
                              ? "bg-amber-500/10 border-amber-500/40"
                              : "bg-slate-950/80 border-slate-800"
                          }`}
                        >
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-lg font-black font-mono text-white">
                                  ₹{wd.amount.toLocaleString("en-IN")}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                                    isApproved
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                      : isRejected
                                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                      : "bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse"
                                  }`}
                                >
                                  {wd.status.toUpperCase()}
                                </span>
                              </div>

                              <div className="flex items-center gap-2 text-xs text-slate-300 font-mono bg-slate-900 p-2 rounded-xl border border-slate-800">
                                {wd.method?.toLowerCase() === "upi" ? (
                                  <QrCode className="w-4 h-4 text-emerald-400 shrink-0" />
                                ) : (
                                  <Building className="w-4 h-4 text-blue-400 shrink-0" />
                                )}
                                <span className="font-bold text-amber-300 uppercase">
                                  [{wd.method || "UPI"}]:
                                </span>
                                <span>
                                  {wd.maskedDestination || wd.upiId || wd.accountNumber || "Direct Transfer"}
                                </span>
                              </div>

                              <p className="text-xs text-slate-400">
                                Ref: <span className="font-mono text-slate-300">{wd.withdrawalId || wd.id}</span>
                                {" • "}
                                Requested: {wd.requestedAt ? new Date(wd.requestedAt).toLocaleString("en-IN") : "N/A"}
                              </p>

                              {(wd.utr || wd.rejectionReason || wd.note) && (
                                <p className="text-[11px] text-slate-400">
                                  {wd.utr && <span className="font-mono text-emerald-400 mr-2">UTR: {wd.utr}</span>}
                                  {wd.rejectionReason && <span className="text-rose-400 mr-2">{wd.rejectionReason}</span>}
                                  {wd.note && <span className="italic">{wd.note}</span>}
                                </p>
                              )}
                            </div>

                            {isPending ? (
                              <div className="flex items-center gap-2 w-full lg:w-auto">
                                <button
                                  onClick={() => handleApproveWithdrawalItem(wd)}
                                  disabled={actionLoadingId === wd.id}
                                  className="flex-1 lg:flex-none py-2 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition cursor-pointer"
                                >
                                  {actionLoadingId === wd.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <Check className="w-3.5 h-3.5" />
                                  )}
                                  <span>स्वीकार करें (Mark Paid)</span>
                                </button>

                                <button
                                  onClick={() =>
                                    setDenialModal({
                                      type: "withdrawal",
                                      item: wd,
                                    })
                                  }
                                  disabled={actionLoadingId === wd.id}
                                  className="flex-1 lg:flex-none py-2 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                                >
                                  <X className="w-3.5 h-3.5" />
                                  <span>अस्वीकार & रिफंड (Deny)</span>
                                </button>
                              </div>
                            ) : (
                              <div className="text-right text-xs text-slate-400">
                                {wd.reviewedAt && (
                                  <span>Processed: {new Date(wd.reviewedAt).toLocaleDateString("en-IN")}</span>
                                )}
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

            {/* TAB 3: LEDGER */}
            {activeHistoryTab === "ledger" && (
              <div className="space-y-4">
                <h4 className="text-sm font-bold text-slate-200">सम्पूर्ण वित्तीय लेज़र (Transactions Ledger)</h4>

                {transactions.length === 0 ? (
                  <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-2">
                    <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                    <p className="text-xs text-slate-400">कोई लेज़र रिकॉर्ड नहीं मिला।</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {transactions.map((tx) => {
                      const isCredit = ["deposit", "game_win", "bonus", "reward", "refund"].includes(tx.type);
                      return (
                        <div key={tx.id} className="py-3 flex items-center justify-between gap-4">
                          <div className="space-y-0.5">
                            <p className="text-xs font-bold text-white">{tx.description || tx.type}</p>
                            <p className="text-[10px] text-slate-400 font-mono">
                              {tx.createdAt ? new Date(tx.createdAt).toLocaleString("en-IN") : "N/A"}
                              {" • "}
                              ID: {tx.id.slice(0, 8)}...
                            </p>
                          </div>

                          <div className="text-right">
                            <span
                              className={`text-sm font-black font-mono ${
                                isCredit ? "text-emerald-400" : "text-rose-400"
                              }`}
                            >
                              {isCredit ? "+" : "-"}₹{tx.amount.toLocaleString("en-IN")}
                            </span>
                            <p className="text-[10px] text-slate-500 uppercase font-bold">{tx.status}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: MANUAL WHATSAPP DEPOSIT */}
      {showDepositModal && selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-blue-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-blue-400">
                <ArrowDownCircle className="w-5 h-5" />
                <h3 className="text-base font-black text-white">WhatsApp डायरेक्ट डिपॉजिट (Add Cash)</h3>
              </div>
              <button onClick={() => setShowDepositModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300">
              खिलाड़ी: <strong>{selectedUser.displayName}</strong> ({selectedUser.playerId}) • मो: +91 {selectedUser.phone}
            </div>

            <form onSubmit={handleExecuteDirectDeposit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  डिपॉजिट राशि (Amount in ₹)
                </label>
                <div className="flex gap-2 mb-2 flex-wrap">
                  {[100, 200, 500, 1000, 2000, 5000].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setManualDepAmount(val.toString())}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition ${
                        manualDepAmount === val.toString()
                          ? "bg-blue-600 text-white border-blue-400"
                          : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                      }`}
                    >
                      ₹{val}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={manualDepAmount}
                  onChange={(e) => setManualDepAmount(e.target.value)}
                  required
                  min={10}
                  placeholder="Enter amount"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  UTR / GooglePay / PhonePe Reference No. (वैकल्पिक)
                </label>
                <input
                  type="text"
                  value={manualDepUtr}
                  onChange={(e) => setManualDepUtr(e.target.value)}
                  placeholder="e.g. 408219204820"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Admin Remark</label>
                <input
                  type="text"
                  value={manualDepRemark}
                  onChange={(e) => setManualDepRemark(e.target.value)}
                  placeholder="WhatsApp Screenshot Verified"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-blue-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowDepositModal(false)}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === "direct-deposit"}
                  className="py-2.5 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-black rounded-xl shadow-lg shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
                >
                  {actionLoadingId === "direct-deposit" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>डिपॉजिट क्रेडिट करें (+₹{manualDepAmount || 0})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: MANUAL WHATSAPP WITHDRAWAL */}
      {showWithdrawModal && selectedUser && wallet && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <ArrowUpCircle className="w-5 h-5" />
                <h3 className="text-base font-black text-white">WhatsApp डायरेक्ट विड्रॉल (Cashout)</h3>
              </div>
              <button onClick={() => setShowWithdrawModal(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center justify-between">
              <span>खिलाड़ी: <strong>{selectedUser.displayName}</strong></span>
              <span className="font-bold font-mono">
                उपलब्ध विंग्स: ₹{(wallet.winBalance || 0).toLocaleString("en-IN")}
              </span>
            </div>

            <form onSubmit={handleExecuteDirectWithdrawal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  विड्रॉल राशि (Amount in ₹)
                </label>
                <input
                  type="number"
                  value={manualWdAmount}
                  onChange={(e) => setManualWdAmount(e.target.value)}
                  required
                  min={10}
                  max={wallet.winBalance}
                  placeholder="Enter withdrawal amount"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-sm font-mono text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5">
                  भुगतान का माध्यम (Payment Method)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setManualWdMethod("UPI")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition ${
                      manualWdMethod === "UPI"
                        ? "bg-emerald-600 text-white border-emerald-400"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                    <span>UPI ID / VPA</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualWdMethod("Bank")}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-2 transition ${
                      manualWdMethod === "Bank"
                        ? "bg-emerald-600 text-white border-emerald-400"
                        : "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    <Building className="w-4 h-4" />
                    <span>Bank Transfer</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  {manualWdMethod === "UPI" ? "यूजर की UPI ID" : "यूजर का Bank A/C & IFSC विवरण"}
                </label>
                <input
                  type="text"
                  value={manualWdDestination}
                  onChange={(e) => setManualWdDestination(e.target.value)}
                  required
                  placeholder={manualWdMethod === "UPI" ? "e.g. mobile@paytm" : "A/C: 1234567890 | IFSC: SBIN0001234"}
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Admin Payment UTR / Ref (आपने जो भुगतान भेजा)
                </label>
                <input
                  type="text"
                  value={manualWdUtr}
                  onChange={(e) => setManualWdUtr(e.target.value)}
                  placeholder="e.g. UPI Ref 492019482910"
                  className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-white focus:outline-none focus:border-emerald-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === "direct-withdrawal"}
                  className="py-2.5 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 text-xs font-black rounded-xl shadow-lg shadow-emerald-500/20 flex items-center gap-2 cursor-pointer"
                >
                  {actionLoadingId === "direct-withdrawal" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  <span>विड्रॉल पूरा करें (-₹{manualWdAmount || 0})</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: DENIAL / REJECTION REASON CONFIRMATION */}
      {denialModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 flex items-center justify-center">
                <XCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">
                  {denialModal.type === "deposit"
                    ? "डिपॉजिट अस्वीकार करें (Deny Deposit)"
                    : "विड्रॉल अस्वीकार व रिफंड करें (Deny Withdrawal)"}
                </h3>
                <p className="text-[11px] text-slate-400">
                  {denialModal.type === "withdrawal"
                    ? "अस्वीकार करने पर राशि यूजर के विंग्स में तुरंत वापस रिफंड हो जाएगी।"
                    : "अस्वीकार करने पर यह डिपॉजिट रिजेक्ट मार्क हो जाएगा।"}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                अस्वीकार करने का कारण (Reason for Denial)
              </label>
              <textarea
                value={denialReason}
                onChange={(e) => setDenialReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:border-rose-400"
                placeholder="Enter reason..."
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDenialModal(null)}
                className="py-2 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl"
              >
                कैंसिल
              </button>
              <button
                type="button"
                onClick={() => {
                  if (denialModal.type === "deposit") {
                    handleDenyDepositConfirm();
                  } else {
                    handleDenyWithdrawalConfirm();
                  }
                }}
                className="py-2 px-5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                पुष्टि करें (Confirm Deny)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
