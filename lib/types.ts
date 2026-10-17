export interface UserProfile {
  uid: string;
  playerId?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  role?: 'player' | 'Admin' | 'admin';
  accountStatus?: 'active' | 'suspended' | 'blocked';
  photoURL?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WalletData {
  uid: string;
  depositBalance: number;
  winBalance: number;
  bonusBalance: number;
  totalWithdrawn?: number;
  totalDeposited?: number;
  rewardPoints?: number;
  updatedAt?: string;
}

export interface DepositRequest {
  id: string;
  depositId?: string;
  uid: string;
  playerId?: string;
  playerName?: string;
  amount: number;
  requestedAmount?: number;
  status: 'pending' | 'approved' | 'rejected';
  utr?: string;
  paymentMethod?: string;
  receiptUrl?: string;
  whatsappOpenedAt?: string;
  requestedAt?: string;
  createdAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  note?: string;
}

export interface WithdrawalRequest {
  id: string;
  withdrawalId?: string;
  uid: string;
  playerId?: string;
  playerName?: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  method?: string;
  maskedDestination?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  holderName?: string;
  utr?: string;
  requestedAt?: string;
  createdAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  note?: string;
}

export interface TransactionRecord {
  id: string;
  uid: string;
  playerId?: string;
  type: 'deposit' | 'withdrawal' | 'bonus' | 'game_win' | 'game_entry' | 'refund';
  amount: number;
  status: 'completed' | 'failed' | 'pending' | 'rejected';
  referenceId?: string;
  utr?: string;
  timestamp: string;
  createdAt?: string;
  description?: string;
}
