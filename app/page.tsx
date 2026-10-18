"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Users,
  ArrowDownCircle,
  ArrowUpCircle,
  ShieldCheck,
  Search,
  Wallet,
  Key,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
  Clock,
  Layers,
  Activity,
  LogOut,
  Lock,
} from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { TotalUsersSection } from "@/components/TotalUsersSection";
import { DepositSection } from "@/components/DepositSection";
import { WithdrawalSection } from "@/components/WithdrawalSection";
import { PlayerProfileModal } from "@/components/PlayerProfileModal";
import { FirebaseRulesModal } from "@/components/FirebaseRulesModal";
import { AdminLogin } from "@/components/AdminLogin";
import { MaintenanceNotice } from "@/components/MaintenanceNotice";
import { WhatsAppDeskSection } from "@/components/WhatsAppDeskSection";
import { MessageSquare } from "lucide-react";
import { UserProfile, DepositRequest, WithdrawalRequest } from "@/lib/types";
import {
  listenToUsers,
  listenToAllDeposits,
  listenToAllWithdrawals,
  approveDeposit,
  denyDeposit,
  approveWithdrawal,
  denyWithdrawal,
  deleteWithdrawal,
} from "@/lib/firebaseService";
import { auth, db, firebaseConfig } from "@/lib/firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

type ActiveTab = "whatsapp" | "deposits" | "withdrawals" | "users" | "rules";

export default function AdminDashboardPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("whatsapp");

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentAdminEmail, setCurrentAdminEmail] = useState<string>("");

  // Real-time Firestore State
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [allDeposits, setAllDeposits] = useState<DepositRequest[]>([]);
  const [allWithdrawals, setAllWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Player Profile Modal
  const [selectedPlayerForModal, setSelectedPlayerForModal] = useState<UserProfile | null>(null);
  const [modalInitialTab, setModalInitialTab] = useState<"deposit" | "withdrawal" | "wallet">("deposit");

  // Rules Modal
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);

  // Global Action Feedback Toast
  const [toastMessage, setToastMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Subscribe to real-time collections
  const setupListeners = useCallback(() => {
    // 1. Real-time Users
    const unsubUsers = listenToUsers(
      (data) => {
        setUsers(data);
        setIsLoadingUsers(false);
      },
      (err) => {
        console.warn("Users listener notice:", err.message);
        setConnectionError("Failed to load users from database: " + err.message);
        setIsLoadingUsers(false);
      }
    );

    // 2. Real-time Deposits
    const unsubDeposits = listenToAllDeposits(
      (data) => {
        setAllDeposits(data);
      },
      (err) => {
        console.warn("Deposits listener note:", err.message);
      }
    );

    // 3. Real-time Withdrawals
    const unsubWithdrawals = listenToAllWithdrawals(
      (data) => {
        setAllWithdrawals(data);
      },
      (err) => {
        console.warn("Withdrawals listener note:", err.message);
      }
    );

    return () => {
      unsubUsers();
      unsubDeposits();
      unsubWithdrawals();
    };
  }, []);

  // Monitor Auth Status - Only authorized Admin can enter
  useEffect(() => {
    let cleanupListeners: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const userEmail = (user.email || "").toLowerCase();
        const authorizedEmails = [
          "admin@rummyadda.com",
          "supportalkabrain@gmail.com",
          "vermashreyansh580@gmail.com",
        ];

        let isAuthorized = authorizedEmails.includes(userEmail);

        if (!isAuthorized) {
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists()) {
              const role = (userDoc.data().role || "").toLowerCase();
              if (role === "admin") {
                isAuthorized = true;
              }
            }
          } catch {
            isAuthorized = false;
          }
        }

        if (isAuthorized) {
          setCurrentAdminEmail(user.email || "Admin");
          setIsAuthenticated(true);
          setIsCheckingAuth(false);
          if (cleanupListeners) cleanupListeners();
          cleanupListeners = setupListeners();
        } else {
          // Unrecognized user, sign out
          await signOut(auth);
          setIsAuthenticated(false);
          setIsCheckingAuth(false);
        }
      } else {
        setIsAuthenticated(false);
        setIsCheckingAuth(false);
        if (cleanupListeners) {
          cleanupListeners();
          cleanupListeners = null;
        }
      }
    });

    return () => {
      unsubAuth();
      if (cleanupListeners) cleanupListeners();
    };
  }, [setupListeners]);

  // Handle Logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      setIsAuthenticated(false);
      setCurrentAdminEmail("");
      setUsers([]);
      setAllDeposits([]);
      setAllWithdrawals([]);
    } catch (e) {
      console.error("Logout error:", e);
    }
  };

  // Open player modal with specific tab
  const handleOpenPlayerModal = (player: UserProfile, tab: "deposit" | "withdrawal" | "wallet" = "deposit") => {
    setSelectedPlayerForModal(player);
    setModalInitialTab(tab);
  };

  // Direct Approve Deposit
  const handleDirectApproveDeposit = async (dep: DepositRequest) => {
    try {
      const targetAmount = dep.requestedAmount || dep.amount || 0;
      await approveDeposit(dep.id, dep.uid, targetAmount, currentAdminEmail, dep.utr || "Approved");
      setToastMessage({
        type: "success",
        text: `Deposit of ₹${targetAmount.toLocaleString("en-IN")} approved successfully! Wallet credited.`,
      });
    } catch (e: unknown) {
      setToastMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to approve deposit",
      });
    }
  };

  // Direct Deny Deposit
  const handleDirectDenyDeposit = async (dep: DepositRequest) => {
    const reason = prompt("Enter reason for rejection:", "Payment verification failed / invalid UTR");
    if (reason === null) return;
    try {
      await denyDeposit(dep.id, dep.uid, currentAdminEmail, reason);
      setToastMessage({
        type: "success",
        text: `Deposit of ₹${dep.requestedAmount || dep.amount} denied.`,
      });
    } catch (e: unknown) {
      setToastMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to deny deposit",
      });
    }
  };

  // Direct Approve Withdrawal Prompt
  const handleDirectApproveWithdrawal = async (wth: WithdrawalRequest) => {
    const utr = prompt("Enter Bank Transfer Reference / UTR Number:", `UTR${Date.now()}`);
    if (utr === null) return;
    try {
      await approveWithdrawal(wth.id, wth.uid, wth.amount, currentAdminEmail, utr);
      setToastMessage({
        type: "success",
        text: `Withdrawal of ₹${wth.amount} approved and processed! (UTR: ${utr})`,
      });
    } catch (e: unknown) {
      setToastMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to approve withdrawal",
      });
    }
  };

  // Direct Deny Withdrawal Prompt
  const handleDirectDenyWithdrawal = async (wth: WithdrawalRequest) => {
    const reason = prompt("Enter reason for rejection:", "Incorrect bank or UPI details");
    if (reason === null) return;
    try {
      await denyWithdrawal(wth.id, wth.uid, wth.amount, currentAdminEmail, reason, true);
      setToastMessage({
        type: "success",
        text: `Withdrawal of ₹${wth.amount} denied. Amount refunded back to player balance.`,
      });
    } catch (e: unknown) {
      setToastMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to deny withdrawal",
      });
    }
  };

  // Direct Delete Withdrawal
  const handleDeleteWithdrawal = async (wth: WithdrawalRequest) => {
    const confirmed = confirm(`Are you sure you want to permanently delete withdrawal request (${wth.id}) for ₹${wth.amount}?`);
    if (!confirmed) return;
    try {
      await deleteWithdrawal(wth.id);
      setToastMessage({
        type: "success",
        text: `Withdrawal request (${wth.id}) deleted permanently.`,
      });
    } catch (e: unknown) {
      setToastMessage({
        type: "error",
        text: e instanceof Error ? e.message : "Failed to delete withdrawal",
      });
    }
  };

  // 1. Initial Loading State
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-rose-600 flex items-center justify-center shadow-xl animate-pulse mb-4">
          <Lock className="w-6 h-6 text-white" />
        </div>
        <p className="text-sm font-semibold tracking-wide">Verifying secure admin session...</p>
        <span className="text-xs text-slate-500 mt-1">Rummy Adda Control Portal</span>
      </div>
    );
  }

  // 2. If Not Authenticated, Show Protected Login Screen (Only 1 Admin Allowed)
  if (!isAuthenticated) {
    return (
      <AdminLogin
        onLoginSuccess={(email) => {
          setCurrentAdminEmail(email);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  // 3. Authenticated Admin Dashboard
  const pendingDepositsCount = allDeposits.filter((d) => d.status === "pending").length;
  const pendingWithdrawalsCount = allWithdrawals.filter((w) => w.status === "pending").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Navbar with Logout */}
      <Navbar
        currentAdminEmail={currentAdminEmail}
        totalUsersCount={users.length}
        onRefresh={setupListeners}
        onOpenRulesModal={() => setIsRulesModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Monthly Maintenance Warning Banner */}
      <MaintenanceNotice />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-800">
          {/* Tab 0: WhatsApp Desk (Spotlight / Direct Mobile Search) */}
          <button
            onClick={() => setActiveTab("whatsapp")}
            className={`flex items-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition whitespace-nowrap ${
              activeTab === "whatsapp"
                ? "bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/50"
                : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>WhatsApp Desk (मोबाइल नंबर सर्च)</span>
          </button>

          {/* Tab 1: Deposit Section */}
          <button
            onClick={() => setActiveTab("deposits")}
            className={`flex items-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition whitespace-nowrap ${
              activeTab === "deposits"
                ? "bg-blue-600 text-white shadow-lg shadow-blue-950/50"
                : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80"
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" />
            <span>Deposit Section</span>
            {pendingDepositsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500 text-slate-950 animate-pulse">
                {pendingDepositsCount} Pending
              </span>
            )}
          </button>

          {/* Tab 2: Withdrawal Section */}
          <button
            onClick={() => setActiveTab("withdrawals")}
            className={`flex items-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition whitespace-nowrap ${
              activeTab === "withdrawals"
                ? "bg-amber-600 text-white shadow-lg shadow-amber-950/50"
                : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80"
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" />
            <span>Withdrawal Section</span>
            {pendingWithdrawalsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-400 text-slate-950 animate-pulse">
                {pendingWithdrawalsCount} Pending
              </span>
            )}
          </button>

          {/* Tab 3: Total Users */}
          <button
            onClick={() => setActiveTab("users")}
            className={`flex items-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition whitespace-nowrap ${
              activeTab === "users"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-950/50"
                : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Total Users</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                activeTab === "users" ? "bg-indigo-800 text-indigo-100" : "bg-slate-800 text-slate-300"
              }`}
            >
              {users.length}
            </span>
          </button>

          {/* Tab 4: Firebase Config & Rules */}
          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="flex items-center gap-2 py-3 px-4 rounded-xl font-medium text-xs sm:text-sm bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800/80 transition whitespace-nowrap"
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>Firebase Rules</span>
          </button>
        </div>

        {/* Global Toast */}
        {toastMessage && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between font-medium text-xs sm:text-sm animate-fade-in ${
              toastMessage.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/40 text-emerald-300"
                : "bg-rose-500/10 border border-rose-500/40 text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {toastMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-slate-400 hover:text-white px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Connection Notice banner if needed */}
        {connectionError && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
            <span>{connectionError}</span>
            <button
              onClick={setupListeners}
              className="px-3 py-1 bg-amber-500 text-slate-950 rounded font-bold hover:bg-amber-400"
            >
              Retry
            </button>
          </div>
        )}

        {/* TAB 0: WHATSAPP DESK SECTION */}
        {activeTab === "whatsapp" && (
          <WhatsAppDeskSection
            users={users}
            adminEmail={currentAdminEmail}
            onShowToast={(type, message) => setToastMessage({ type, text: message })}
          />
        )}

        {/* TAB 1: DEPOSIT SECTION */}
        {activeTab === "deposits" && (
          <DepositSection
            users={users}
            allDeposits={allDeposits}
            onOpenPlayerModal={handleOpenPlayerModal}
            onApproveDeposit={handleDirectApproveDeposit}
            onDenyDeposit={handleDirectDenyDeposit}
            adminEmail={currentAdminEmail}
          />
        )}

        {/* TAB 2: WITHDRAWAL SECTION */}
        {activeTab === "withdrawals" && (
          <WithdrawalSection
            users={users}
            allWithdrawals={allWithdrawals}
            onOpenPlayerModal={handleOpenPlayerModal}
            onApproveWithdrawalPrompt={handleDirectApproveWithdrawal}
            onDenyWithdrawalPrompt={handleDirectDenyWithdrawal}
            onDeleteWithdrawal={handleDeleteWithdrawal}
            adminEmail={currentAdminEmail}
          />
        )}

        {/* TAB 3: TOTAL USERS SECTION */}
        {activeTab === "users" && (
          <TotalUsersSection
            users={users}
            onOpenPlayerModal={handleOpenPlayerModal}
          />
        )}
      </main>

      {/* Core Player Profile Modal with Deposit & Withdrawal options */}
      {selectedPlayerForModal && (
        <PlayerProfileModal
          player={selectedPlayerForModal}
          initialTab={modalInitialTab}
          onClose={() => setSelectedPlayerForModal(null)}
          adminEmail={currentAdminEmail}
          onRefresh={setupListeners}
        />
      )}

      {/* Firebase Rules Viewer Modal */}
      <FirebaseRulesModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-900/60 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Rummy Adda Secure Admin Console ({currentAdminEmail})</span>
          </div>
          <div>
            100% Real-Time Firestore Sync • Database ID:{" "}
            <span className="font-mono text-slate-400">
              {firebaseConfig.firestoreDatabaseId.slice(0, 18)}...
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
