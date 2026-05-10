export interface UserProfile {
  uid: string;
  displayName: string;
  photoURL?: string;
  phoneNumber: string;
  balance: number;
  coins: number;
  isPremium: boolean;
  premiumExpiry?: string;
  isVIP: boolean;
  todayEarnings: number;
  totalEarnings: number;
  referralEarnings: number;
  referralCode: string;
  referredBy?: string;
  referralCount: number;
  lastCheckIn?: string;
  streak: number;
  spinsLeft: number;
  lastSpinDate?: string;
  lastBoxOpenDate?: string;
  boxesOpenedToday?: number;
  adsWatchedToday?: number;
  role: 'user' | 'admin';
  isBanned?: boolean;
  privacy?: {
    hideEarnings?: boolean;
    hideReferrals?: boolean;
    privateProfile?: boolean;
  };
  createdAt: string;
}

export interface AppSettings {
  isAppLive: boolean;
  maintenanceMode: boolean;
  dailyBonusAmount: number;
  maxSpinReward: number;
  minSpinReward: number;
  mysteryBoxFreeMax: number;
  mysteryBoxPaidMax: number;
  mysteryBoxPaidPrice: number;
  winProbability: number; // 0 to 100
  taskRewardMultiplier: number;
  adMobEnabled: boolean;
  adVideoReward: number;
  maxAdsPerDay: number;
  ytVideoLink: string;
  announcement: string;
  supportTelegram: string;
  minWithdrawal: number;
  referralReward: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  type: 'video' | 'download' | 'form';
  difficulty: 'easy' | 'medium' | 'hard';
  duration: number;
  sponsored: boolean;
  active: boolean;
  createdAt: string;
}

export interface TaskSubmission {
  id: string;
  userId: string;
  taskId: string;
  taskType: string;
  proof: string;
  status: 'pending' | 'approved' | 'rejected';
  reward: number;
  submittedAt: string;
  reviewedAt?: string;
}

export interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  method: 'UPI' | 'Paytm';
  details: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: string;
  processedAt?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  currency: 'INR' | 'COINS';
  type: 'credit' | 'debit';
  category: 'task' | 'referral' | 'bonus' | 'spin' | 'withdrawal' | 'mystery_box' | 'purchase' | 'ad_reward' | 'affiliate';
  description: string;
  timestamp: string;
}

export interface MysteryBox {
  id: string;
  name: string;
  type: 'free' | 'paid' | 'ad';
  price: number;
  minReward: number;
  maxReward: number;
  icon: string;
  color: string;
}

export interface BoxOpening {
  id: string;
  userId: string;
  boxId: string;
  boxType: string;
  amount: number;
  timestamp: string;
}

export interface Quiz {
  id: string;
  title: string;
  category: 'GK' | 'Cricket';
  entryFee: number;
  reward: number;
  questions: {
    question: string;
    options: string[];
    correctAnswer: number;
  }[];
  duration: number; // in seconds
}

export interface QuizAttempt {
  id: string;
  userId: string;
  quizId: string;
  score: number;
  totalQuestions: number;
  rewardEarned: number;
  timestamp: string;
}
