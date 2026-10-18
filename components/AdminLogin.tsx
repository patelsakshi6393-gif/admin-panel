"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  LogIn,
  KeyRound,
  UserCheck,
} from "lucide-react";
import { auth, db } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

interface AdminLoginProps {
  onLoginSuccess: (emailOrId: string) => void;
}

export function sanitizePhone(phone: string): string {
  const cleaned = phone.replace(/[^\d]/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("91")) {
    return cleaned.slice(2);
  }
  if (cleaned.length === 11 && cleaned.startsWith("0")) {
    return cleaned.slice(1);
  }
  return cleaned;
}

export function AdminLogin({ onLoginSuccess }: AdminLoginProps) {
  const [adminId, setAdminId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const rawId = adminId.trim();
    const rawPass = password.trim();

    if (!rawId || !rawPass) {
      setErrorMessage("Please enter both your Admin ID and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    const cleanPhone = sanitizePhone(rawId);
    const isMasterAdminId = cleanPhone === "9118431155" || rawId.toLowerCase() === "9118431155@rummyadda.app";
    const isMasterAdmin = isMasterAdminId && rawPass === "Imran91184";

    // Candidate emails for Firebase Auth
    const candidateEmails: string[] = [];
    if (rawId.includes("@")) {
      candidateEmails.push(rawId.toLowerCase());
    } else if (cleanPhone.length >= 10) {
      candidateEmails.push(`${cleanPhone}@rummyadda.app`);
      candidateEmails.push(`${cleanPhone}@phone.rummyadda.in`);
    } else {
      candidateEmails.push(rawId);
    }

    try {
      let loggedInUser = null;
      let lastError: unknown = null;

      // 1. Try signing in with candidate emails
      for (const emailAttempt of candidateEmails) {
        try {
          const cred = await signInWithEmailAndPassword(auth, emailAttempt, rawPass);
          loggedInUser = cred.user;
          break;
        } catch (err) {
          lastError = err;
        }
      }

      // 2. If master admin credentials and not found yet, auto-provision
      if (!loggedInUser && isMasterAdmin) {
        try {
          const cred = await createUserWithEmailAndPassword(auth, "9118431155@rummyadda.app", "Imran91184");
          loggedInUser = cred.user;
        } catch (createErr: unknown) {
          console.warn("Auto-provision attempt note:", createErr);
          try {
            const cred = await signInWithEmailAndPassword(auth, "9118431155@rummyadda.app", "Imran91184");
            loggedInUser = cred.user;
          } catch (retryErr) {
            lastError = retryErr;
          }
        }
      }

      if (!loggedInUser) {
        throw lastError || new Error("Invalid Admin ID or Password. Please verify your credentials.");
      }

      // 3. Verify Authorization
      const user = loggedInUser;
      const userEmail = (user.email || "").toLowerCase();
      const authorizedEmails = [
        "9118431155@rummyadda.app",
        "9118431155@phone.rummyadda.in",
        "admin@rummyadda.com",
        "supportalkabrain@gmail.com",
        "vermashreyansh580@gmail.com",
      ];

      let isAllowed =
        authorizedEmails.includes(userEmail) ||
        userEmail.startsWith("9118431155@") ||
        isMasterAdmin;

      if (!isAllowed) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const role = (data.role || "").toLowerCase();
            if (role === "admin" || data.phone === "9118431155") {
              isAllowed = true;
            }
          }
        } catch {
          isAllowed = true;
        }
      }

      if (!isAllowed) {
        await auth.signOut();
        setErrorMessage("Unauthorized account! This panel is reserved exclusively for the authorized Admin (ID: 9118431155).");
        setIsLoading(false);
        return;
      }

      // Ensure role is recorded in Firestore
      try {
        await setDoc(
          doc(db, "users", user.uid),
          {
            uid: user.uid,
            phone: cleanPhone.length === 10 ? cleanPhone : "9118431155",
            email: user.email || `${cleanPhone}@rummyadda.app`,
            displayName: "Admin (Imran)",
            role: "admin",
            accountStatus: "active",
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      } catch (errDoc) {
        console.warn("User doc update note:", errDoc);
      }

      const displayIdentifier = user.email?.startsWith("9118431155") ? "Admin (9118431155)" : (user.email || "9118431155");
      onLoginSuccess(displayIdentifier);
    } catch (err: unknown) {
      console.error("Login failed:", err);
      let msg = "Login failed! Please check your Admin ID and password.";
      if (err instanceof Error) {
        if (err.message.includes("invalid-credential") || err.message.includes("wrong-password")) {
          msg = "Invalid password or Admin ID. Please verify your credentials.";
        } else if (err.message.includes("user-not-found")) {
          msg = "Admin account not found. Please verify your Admin ID.";
        } else if (err.message.includes("too-many-requests")) {
          msg = "Too many failed attempts. Please wait a moment and try again.";
        } else {
          msg = err.message;
        }
      }
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-600 flex items-center justify-center mx-auto shadow-xl shadow-rose-950/40">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 text-xs font-semibold uppercase tracking-wider mb-1">
              <Lock className="w-3 h-3" />
              <span>Restricted Access (Authorized Admin Only)</span>
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              RUMMY ADDA
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Secure Administration Portal • Admin ID: <span className="text-amber-400 font-bold">9118431155</span>
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
            <span className="leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              Admin ID
            </label>
            <div className="relative">
              <input
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="9118431155"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition font-medium"
              />
              <UserCheck className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 block">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full pl-10 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 transition font-mono"
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="p-1 text-slate-500 hover:text-slate-300 absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-rose-600 to-indigo-600 hover:from-amber-400 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-rose-950/40 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verifying credentials...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Sign In to Admin Panel</span>
              </>
            )}
          </button>
        </form>

        <div className="text-center text-[11px] text-slate-500 space-y-1">
          <p>Protected by 256-bit Firebase Authentication security.</p>
          <p>Authorized Admin ID: <span className="text-slate-400 font-mono">9118431155</span></p>
        </div>
      </div>
    </div>
  );
}
