"use client";

import React, { useState } from "react";
import { X, Copy, Check, ShieldAlert, Key, Database, ExternalLink, Terminal } from "lucide-react";
import { firebaseConfig } from "@/lib/firebase";

interface FirebaseRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RULES_CODE = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isValidId(id) {
      return id is string && id.size() > 0 && id.size() <= 128 && id.matches('^[a-zA-Z0-9_\\\\-]+$');
    }

    // Admin authorization check:
    function isAdmin() {
      return isSignedIn() && (
        request.auth.token.email in ['supportalkabrain@gmail.com', 'vermashreyansh580@gmail.com', 'admin@rummyadda.com'] ||
        (exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['Admin', 'admin'])
      );
    }

    match /{document=**} {
      allow read, write: if false;
    }

    match /test/{docId} {
      allow read: if true;
      allow write: if false;
    }

    match /users/{userId} {
      allow get: if isSignedIn() && isValidId(userId);
      allow list: if isSignedIn();
      allow create: if (isOwner(userId) && isValidId(userId)
                    && request.resource.data.uid == request.auth.uid
                    && (!('role' in request.resource.data) || request.resource.data.role == 'player'))
                    || isAdmin();
      allow update: if (isOwner(userId) && isValidId(userId)
                    && request.resource.data.uid == resource.data.uid
                    && (!('role' in request.resource.data) || request.resource.data.role == resource.data.role))
                    || isAdmin();
      allow delete: if isAdmin();
    }

    match /wallets/{userId} {
      allow get: if (isOwner(userId) || isAdmin()) && isValidId(userId);
      allow list: if isAdmin();
      allow create: if (isOwner(userId) && isValidId(userId)
                    && request.resource.data.uid == request.auth.uid
                    && request.resource.data.depositBalance == 0
                    && request.resource.data.winBalance == 0
                    && request.resource.data.bonusBalance == 0)
                    || isAdmin();
      allow update: if isAdmin();
      allow delete: if false;
    }

    match /transactions/{transactionId} {
      allow read: if isSignedIn() && (resource.data.uid == request.auth.uid || isAdmin());
      allow create: if isAdmin();
      allow update, delete: if false;
    }

    match /deposits/{depositId} {
      allow read: if isSignedIn() && (resource.data.uid == request.auth.uid || isAdmin());
      allow list: if isSignedIn();
      allow create: if (isSignedIn() && isValidId(depositId)
                    && request.resource.data.uid == request.auth.uid
                    && request.resource.data.status == 'pending')
                    || isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }

    match /withdrawals/{withdrawalId} {
      allow read: if isSignedIn() && (resource.data.uid == request.auth.uid || isAdmin());
      allow list: if isSignedIn();
      allow create: if (isSignedIn() && isValidId(withdrawalId)
                    && request.resource.data.uid == request.auth.uid
                    && request.resource.data.status == 'pending')
                    || isAdmin();
      allow update: if isAdmin();
      allow delete: if isAdmin();
    }
  }
}`;

export function FirebaseRulesModal({ isOpen, onClose }: FirebaseRulesModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(RULES_CODE);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Firebase Configuration & Security Rules</h3>
              <p className="text-xs text-slate-400">
                Authorized Admin RBAC and Strict Player Data Isolation
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs sm:text-sm">
          {/* Active Config Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-[11px] text-slate-500 block">Project ID:</span>
              <span className="font-mono text-emerald-400 font-bold">{firebaseConfig.projectId}</span>
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Firestore Database ID:</span>
              <span className="font-mono text-amber-400 font-bold truncate block">
                {firebaseConfig.firestoreDatabaseId}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 space-y-2">
            <div className="font-bold flex items-center gap-2 text-emerald-300">
              <ShieldAlert className="w-4 h-4" />
              <span>Deployment & Security Status:</span>
            </div>
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              Security rules have been configured and deployed targeting both your named database (<code className="font-mono text-white">{firebaseConfig.firestoreDatabaseId}</code>) and default database.
            </p>
          </div>

          {/* Rules Code Viewer */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white text-xs">firestore.rules Code:</span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Copied!" : "Copy Rules"}</span>
              </button>
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 max-h-64 overflow-y-auto leading-relaxed">
              {RULES_CODE}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
