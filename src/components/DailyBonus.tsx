import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, X, CheckCircle2, Loader2, Zap } from 'lucide-react';
import { doc, updateDoc, increment, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useSettings } from '../hooks/useSettings';

export default function DailyBonus({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { profile, user } = useAuth();
  const { settings } = useSettings();
  const [loading, setLoading] = useState(false);

  if (!profile || !user) return null;

  const lastCheckInDate = profile.lastCheckIn ? new Date(profile.lastCheckIn).toDateString() : null;
  const today = new Date().toDateString();
  const canClaim = lastCheckInDate !== today;
  const bonusAmount = settings?.dailyBonusAmount || 5;

  const handleClaim = async () => {
    if (!canClaim) {
      toast.error('Already claimed today!');
      return;
    }

    setLoading(true);
    try {
      const reward = bonusAmount;
      const userRef = doc(db, 'users', user.uid);
      
      await updateDoc(userRef, {
        balance: increment(reward),
        totalEarnings: increment(reward),
        todayEarnings: increment(reward),
        lastCheckIn: new Date().toISOString(),
        streak: increment(1)
      });

      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        amount: reward,
        type: 'credit',
        category: 'bonus',
        description: 'Daily Check-in Bonus',
        timestamp: new Date().toISOString()
      });

      toast.success(`₹${reward} Daily Bonus claimed!`);
      onClose();
    } catch (error) {
      console.error('Bonus error:', error);
      toast.error('Failed to claim bonus');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-[#1E293B] border border-slate-800 rounded-[2.5rem] overflow-hidden shadow-2xl p-8 text-center"
          >
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-20 h-20 bg-green-500 rounded-3xl flex items-center justify-center shadow-lg shadow-green-500/20 mx-auto mb-6">
              <Gift className="text-white w-10 h-10" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">Daily Bonus</h2>
            <p className="text-slate-400 mb-8">Check in every day to maintain your streak and earn rewards!</p>

            <div className="grid grid-cols-7 gap-2 mb-8">
              {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                <div key={day} className="space-y-2">
                  <div className={cn(
                    "aspect-square rounded-xl flex items-center justify-center text-xs font-bold border transition-all",
                    day <= profile.streak 
                      ? "bg-green-500 border-green-400 text-white" 
                      : "bg-slate-800 border-slate-700 text-slate-500"
                  )}>
                    {day <= profile.streak ? <CheckCircle2 className="w-4 h-4" /> : `₹${Math.floor(bonusAmount / 5 * day)}`}
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">Day {day}</p>
                </div>
              ))}
            </div>

            <button
              onClick={handleClaim}
              disabled={loading || !canClaim}
              className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-green-500/20 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (canClaim ? <><Zap className="w-5 h-5" /> Claim ₹{bonusAmount} Reward</> : 'Already Claimed')}
            </button>
            
            {!canClaim && (
              <p className="mt-4 text-xs text-slate-500">Come back tomorrow for your next reward!</p>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
