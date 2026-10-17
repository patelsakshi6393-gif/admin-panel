import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { UserProfile, WalletData, DepositRequest, WithdrawalRequest, TransactionRecord } from "./types";

/**
 * Safely parse amount from various gaming Firestore field names
 */
export function parseAmount(data: Record<string, unknown> | undefined): number {
  if (!data) return 0;
  const raw =
    data.requestedAmount ??
    data.amount ??
    data.depositAmount ??
    data.amt ??
    data.value ??
    data.chips ??
    data.coins ??
    data.cash ??
    data.money ??
    data.paymentAmount ??
    0;

  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const cleaned = raw.replace(/[₹,\s]/g, "");
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  }
  return 0;
}

/**
 * Real-time listener for all users in Firestore
 */
export function listenToUsers(
  onData: (users: UserProfile[]) => void,
  onError?: (err: Error) => void
) {
  if (!auth.currentUser) {
    return () => {};
  }
  const usersRef = collection(db, "users");
  return onSnapshot(
    usersRef,
    (snapshot) => {
      const users: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        users.push({
          uid: docSnap.id,
          playerId: data.playerId || `RA-${docSnap.id.slice(0, 6).toUpperCase()}`,
          displayName: data.displayName || "Unknown Player",
          email: data.email || "",
          phone: data.phone || "",
          role: data.role || "player",
          accountStatus: data.accountStatus || "active",
          photoURL: data.photoURL || "",
          createdAt: data.createdAt || "",
          updatedAt: data.updatedAt || "",
        });
      });
      users.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
      onData(users);
    },
    (error) => {
      console.warn("Users listener notice:", error.message);
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time listener for a specific player's wallet
 */
export function listenToWallet(
  uid: string,
  onData: (wallet: WalletData) => void,
  onError?: (err: Error) => void
) {
  if (!auth.currentUser) {
    return () => {};
  }
  const walletRef = doc(db, "wallets", uid);
  return onSnapshot(
    walletRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onData({
          uid,
          depositBalance: parseAmount({ amount: data.depositBalance }),
          winBalance: parseAmount({ amount: data.winBalance }),
          bonusBalance: parseAmount({ amount: data.bonusBalance }),
          totalWithdrawn: parseAmount({ amount: data.totalWithdrawn }),
          totalDeposited: parseAmount({ amount: data.totalDeposited }),
          rewardPoints: Number(data.rewardPoints || 0),
          updatedAt: data.updatedAt || "",
        });
      } else {
        onData({
          uid,
          depositBalance: 0,
          winBalance: 0,
          bonusBalance: 0,
          totalWithdrawn: 0,
          totalDeposited: 0,
          rewardPoints: 0,
        });
      }
    },
    (error) => {
      console.warn("Wallet listener notice:", error.message);
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time listener for a player's deposits
 */
export function listenToPlayerDeposits(
  uid: string,
  onData: (deposits: DepositRequest[]) => void,
  onError?: (err: Error) => void
) {
  if (!auth.currentUser) {
    return () => {};
  }
  const depositsRef = collection(db, "deposits");
  const q = query(depositsRef, where("uid", "==", uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const deposits: DepositRequest[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const amt = parseAmount(data);
        deposits.push({
          id: docSnap.id,
          depositId: data.depositId || docSnap.id,
          uid: data.uid,
          playerId: data.playerId,
          playerName: data.playerName,
          amount: amt,
          requestedAmount: amt,
          status: data.status || "pending",
          utr: data.utr || "",
          paymentMethod: data.method || data.paymentMethod || "UPI",
          receiptUrl: data.receiptUrl || "",
          whatsappOpenedAt: data.whatsappOpenedAt || "",
          requestedAt: data.createdAt || data.requestedAt || "",
          reviewedAt: data.reviewedAt || "",
          reviewedBy: data.reviewedBy || "",
          note: data.note || "",
        });
      });
      deposits.sort((a, b) => (b.requestedAt || "").localeCompare(a.requestedAt || ""));
      onData(deposits);
    },
    (error) => {
      console.warn("Player deposits listener error:", error.message);
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time listener for all deposits across the platform
 */
export function listenToAllDeposits(
  onData: (deposits: DepositRequest[]) => void,
  onError?: (err: Error) => void
) {
  if (!auth.currentUser) {
    return () => {};
  }
  const depositsRef = collection(db, "deposits");
  return onSnapshot(
    depositsRef,
    (snapshot) => {
      const deposits: DepositRequest[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const amt = parseAmount(data);
        deposits.push({
          id: docSnap.id,
          depositId: data.depositId || docSnap.id,
          uid: data.uid,
          playerId: data.playerId,
          playerName: data.playerName,
          amount: amt,
          requestedAmount: amt,
          status: data.status || "pending",
          utr: data.utr || "",
          paymentMethod: data.method || data.paymentMethod || "UPI",
          receiptUrl: data.receiptUrl || "",
          whatsappOpenedAt: data.whatsappOpenedAt || "",
          requestedAt: data.createdAt || data.requestedAt || "",
          reviewedAt: data.reviewedAt || "",
          reviewedBy: data.reviewedBy || "",
          note: data.note || "",
        });
      });
      deposits.sort((a, b) => (b.requestedAt || "").localeCompare(a.requestedAt || ""));
      onData(deposits);
    },
    (error) => {
      console.warn("All deposits listener notice:", error.message);
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time listener for a player's withdrawals
 */
export function listenToPlayerWithdrawals(
  uid: string,
  onData: (withdrawals: WithdrawalRequest[]) => void,
  onError?: (err: Error) => void
) {
  if (!auth.currentUser) {
    return () => {};
  }
  const withdrawalsRef = collection(db, "withdrawals");
  const q = query(withdrawalsRef, where("uid", "==", uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const withdrawals: WithdrawalRequest[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const amt = parseAmount(data);
        withdrawals.push({
          id: docSnap.id,
          withdrawalId: data.withdrawalId || docSnap.id,
          uid: data.uid,
          playerId: data.playerId,
          playerName: data.playerName,
          amount: amt,
          status: data.status || "pending",
          method: data.method || "UPI",
          maskedDestination: data.maskedDestination || data.upiId || data.accountNumber || "",
          bankName: data.bankName || "",
          accountNumber: data.accountNumber || "",
          ifscCode: data.ifscCode || "",
          upiId: data.upiId || data.maskedDestination || "",
          holderName: data.holderName || "",
          utr: data.utr || "",
          requestedAt: data.createdAt || data.requestedAt || "",
          reviewedAt: data.reviewedAt || "",
          reviewedBy: data.reviewedBy || "",
          rejectionReason: data.rejectionReason || "",
          note: data.note || "",
        });
      });
      withdrawals.sort((a, b) => (b.requestedAt || "").localeCompare(a.requestedAt || ""));
      onData(withdrawals);
    },
    (error) => {
      console.warn("Player withdrawals listener error:", error.message);
      if (onError) onError(error);
    }
  );
}

/**
 * Real-time listener for all withdrawals across the platform
 */
export function listenToAllWithdrawals(
  onData: (withdrawals: WithdrawalRequest[]) => void,
  onError?: (err: Error) => void
) {
  if (!auth.currentUser) {
    return () => {};
  }
  const withdrawalsRef = collection(db, "withdrawals");
  return onSnapshot(
    withdrawalsRef,
    (snapshot) => {
      const withdrawals: WithdrawalRequest[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const amt = parseAmount(data);
        withdrawals.push({
          id: docSnap.id,
          withdrawalId: data.withdrawalId || docSnap.id,
          uid: data.uid,
          playerId: data.playerId,
          playerName: data.playerName,
          amount: amt,
          status: data.status || "pending",
          method: data.method || "UPI",
          maskedDestination: data.maskedDestination || data.upiId || data.accountNumber || "",
          bankName: data.bankName || "",
          accountNumber: data.accountNumber || "",
          ifscCode: data.ifscCode || "",
          upiId: data.upiId || data.maskedDestination || "",
          holderName: data.holderName || "",
          utr: data.utr || "",
          requestedAt: data.createdAt || data.requestedAt || "",
          reviewedAt: data.reviewedAt || "",
          reviewedBy: data.reviewedBy || "",
          rejectionReason: data.rejectionReason || "",
          note: data.note || "",
        });
      });
      withdrawals.sort((a, b) => (b.requestedAt || "").localeCompare(a.requestedAt || ""));
      onData(withdrawals);
    },
    (error) => {
      console.warn("All withdrawals listener notice:", error.message);
      if (onError) onError(error);
    }
  );
}

/**
 * Approve Deposit Request:
 * 1. Sets deposit status to 'approved'
 * 2. Credits player's wallet deposit balance with the accurate requestedAmount
 * 3. Appends transaction to ledger
 */
export async function approveDeposit(
  depositId: string,
  uid: string,
  amount: number,
  adminEmail: string,
  utrNote?: string
) {
  const depositRef = doc(db, "deposits", depositId);
  const walletRef = doc(db, "wallets", uid);
  const now = new Date().toISOString();

  // If amount was passed as 0 or undefined, read the actual requestedAmount from doc
  let actualAmount = amount;
  if (!actualAmount || actualAmount <= 0) {
    const depSnap = await getDoc(depositRef);
    if (depSnap.exists()) {
      actualAmount = parseAmount(depSnap.data() as Record<string, unknown>);
    }
  }

  // Update deposit document
  await updateDoc(depositRef, {
    status: "approved",
    amount: actualAmount,
    reviewedAt: now,
    reviewedBy: adminEmail,
    note: utrNote || "Approved by Admin",
  });

  // Update wallet deposit balance
  const walletSnap = await getDoc(walletRef);
  if (walletSnap.exists()) {
    const current = walletSnap.data();
    await updateDoc(walletRef, {
      depositBalance: (Number(current.depositBalance) || 0) + actualAmount,
      totalDeposited: (Number(current.totalDeposited) || 0) + actualAmount,
      updatedAt: now,
    });
  } else {
    await setDoc(walletRef, {
      uid,
      depositBalance: actualAmount,
      winBalance: 0,
      bonusBalance: 0,
      totalDeposited: actualAmount,
      totalWithdrawn: 0,
      updatedAt: now,
    });
  }

  // Create transaction log
  const txId = `tx_dep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  await setDoc(doc(db, "transactions", txId), {
    id: txId,
    uid,
    type: "deposit",
    amount: actualAmount,
    status: "completed",
    referenceId: depositId,
    timestamp: now,
    createdAt: now,
    description: `Deposit approved: ₹${actualAmount} (Admin: ${adminEmail})`,
  });

  return { success: true, txId, amount: actualAmount };
}

/**
 * Deny Deposit Request:
 * 1. Sets deposit status to 'rejected'
 * 2. Records rejection reason
 */
export async function denyDeposit(
  depositId: string,
  uid: string,
  adminEmail: string,
  reason: string
) {
  const depositRef = doc(db, "deposits", depositId);
  const now = new Date().toISOString();

  await updateDoc(depositRef, {
    status: "rejected",
    reviewedAt: now,
    reviewedBy: adminEmail,
    note: reason || "Denied by Admin",
  });

  return { success: true };
}

/**
 * Approve Withdrawal Request:
 * 1. Sets status to 'approved'
 * 2. Records transfer UTR
 * 3. Appends transaction to ledger
 */
export async function approveWithdrawal(
  withdrawalId: string,
  uid: string,
  amount: number,
  adminEmail: string,
  utr: string
) {
  const withdrawalRef = doc(db, "withdrawals", withdrawalId);
  const walletRef = doc(db, "wallets", uid);
  const now = new Date().toISOString();

  let actualAmount = amount;
  if (!actualAmount || actualAmount <= 0) {
    const wthSnap = await getDoc(withdrawalRef);
    if (wthSnap.exists()) {
      actualAmount = parseAmount(wthSnap.data() as Record<string, unknown>);
    }
  }

  await updateDoc(withdrawalRef, {
    status: "approved",
    utr: utr || "PROCESSED",
    reviewedAt: now,
    reviewedBy: adminEmail,
    note: `Payout confirmed. UTR: ${utr}`,
  });

  // Update total withdrawn in wallet
  const walletSnap = await getDoc(walletRef);
  if (walletSnap.exists()) {
    const current = walletSnap.data();
    await updateDoc(walletRef, {
      totalWithdrawn: (Number(current.totalWithdrawn) || 0) + actualAmount,
      updatedAt: now,
    });
  }

  // Create transaction log
  const txId = `tx_wth_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  await setDoc(doc(db, "transactions", txId), {
    id: txId,
    uid,
    type: "withdrawal",
    amount: actualAmount,
    status: "completed",
    referenceId: withdrawalId,
    utr,
    timestamp: now,
    createdAt: now,
    description: `Withdrawal approved: ₹${actualAmount} (UTR: ${utr})`,
  });

  return { success: true, txId };
}

/**
 * Deny Withdrawal Request:
 * 1. Sets status to 'rejected'
 * 2. Restores wallet winning balance
 */
export async function denyWithdrawal(
  withdrawalId: string,
  uid: string,
  amount: number,
  adminEmail: string,
  reason: string,
  refundBalance = true
) {
  const withdrawalRef = doc(db, "withdrawals", withdrawalId);
  const walletRef = doc(db, "wallets", uid);
  const now = new Date().toISOString();

  let actualAmount = amount;
  if (!actualAmount || actualAmount <= 0) {
    const wthSnap = await getDoc(withdrawalRef);
    if (wthSnap.exists()) {
      actualAmount = parseAmount(wthSnap.data() as Record<string, unknown>);
    }
  }

  await updateDoc(withdrawalRef, {
    status: "rejected",
    rejectionReason: reason || "Rejected by Admin",
    reviewedAt: now,
    reviewedBy: adminEmail,
  });

  if (refundBalance && actualAmount > 0) {
    const walletSnap = await getDoc(walletRef);
    if (walletSnap.exists()) {
      const current = walletSnap.data();
      await updateDoc(walletRef, {
        winBalance: (Number(current.winBalance) || 0) + actualAmount,
        updatedAt: now,
      });
    }
  }

  return { success: true };
}

/**
 * Admin direct wallet balance adjustment (Credit / Debit)
 */
export async function adjustWalletBalance(
  uid: string,
  deltaDeposit: number,
  deltaWin: number,
  deltaBonus: number,
  adminEmail: string,
  reason: string
) {
  const walletRef = doc(db, "wallets", uid);
  const now = new Date().toISOString();
  const walletSnap = await getDoc(walletRef);

  let updatedDep = 0;
  let updatedWin = 0;
  let updatedBon = 0;

  if (walletSnap.exists()) {
    const current = walletSnap.data();
    updatedDep = Math.max(0, (Number(current.depositBalance) || 0) + deltaDeposit);
    updatedWin = Math.max(0, (Number(current.winBalance) || 0) + deltaWin);
    updatedBon = Math.max(0, (Number(current.bonusBalance) || 0) + deltaBonus);

    await updateDoc(walletRef, {
      depositBalance: updatedDep,
      winBalance: updatedWin,
      bonusBalance: updatedBon,
      updatedAt: now,
    });
  } else {
    updatedDep = Math.max(0, deltaDeposit);
    updatedWin = Math.max(0, deltaWin);
    updatedBon = Math.max(0, deltaBonus);

    await setDoc(walletRef, {
      uid,
      depositBalance: updatedDep,
      winBalance: updatedWin,
      bonusBalance: updatedBon,
      totalDeposited: Math.max(0, deltaDeposit),
      totalWithdrawn: 0,
      updatedAt: now,
    });
  }

  const txId = `tx_adj_${Date.now()}`;
  await setDoc(doc(db, "transactions", txId), {
    id: txId,
    uid,
    type: deltaDeposit >= 0 ? "deposit" : "withdrawal",
    amount: Math.abs(deltaDeposit || deltaWin || deltaBonus),
    status: "completed",
    timestamp: now,
    createdAt: now,
    description: `Manual adjustment by ${adminEmail}: ${reason}`,
  });

  return { success: true, updatedDep, updatedWin, updatedBon };
}

/**
 * Create a new deposit request (supports both amount and requestedAmount)
 */
export async function createDepositRequest(
  uid: string,
  playerId: string,
  playerName: string,
  amount: number,
  paymentMethod = "UPI",
  utr = ""
) {
  const id = `dep_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  await setDoc(doc(db, "deposits", id), {
    id,
    depositId: id,
    uid,
    playerId,
    playerName,
    amount,
    requestedAmount: amount,
    status: "pending",
    method: paymentMethod,
    paymentMethod,
    utr,
    createdAt: now,
    requestedAt: now,
  });

  return id;
}

/**
 * Create a new withdrawal request
 */
export async function createWithdrawalRequest(
  uid: string,
  playerId: string,
  playerName: string,
  amount: number,
  payoutDetails: {
    upiId?: string;
    bankName?: string;
    accountNumber?: string;
    ifscCode?: string;
    holderName?: string;
  }
) {
  const id = `wdr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  await setDoc(doc(db, "withdrawals", id), {
    id,
    withdrawalId: id,
    uid,
    playerId,
    playerName,
    amount,
    status: "pending",
    method: "UPI",
    maskedDestination: payoutDetails.upiId || payoutDetails.accountNumber || "",
    upiId: payoutDetails.upiId || "",
    bankName: payoutDetails.bankName || "",
    accountNumber: payoutDetails.accountNumber || "",
    ifscCode: payoutDetails.ifscCode || "",
    holderName: payoutDetails.holderName || playerName,
    createdAt: now,
    requestedAt: now,
  });

  return id;
}

/**
 * Permanently delete a withdrawal request document from Firestore
 */
export async function deleteWithdrawal(withdrawalId: string) {
  const docRef = doc(db, "withdrawals", withdrawalId);
  await deleteDoc(docRef);
  return { success: true };
}

/**
 * Permanently delete a deposit request document from Firestore
 */
export async function deleteDeposit(depositId: string) {
  const docRef = doc(db, "deposits", depositId);
  await deleteDoc(docRef);
  return { success: true };
}
