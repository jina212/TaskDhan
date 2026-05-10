import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, X, Trophy, Loader2 } from 'lucide-react';
import { doc, updateDoc, increment, addDoc, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { useSettings } from '../hooks/useSettings';

export default function SpinWheel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { profile, user } = useAuth();
  const { settings } = useSettings();
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<number | null>(null);

  if (!profile || !user) return null;

  const minReward = settings?.minSpinReward || 1;
  const maxReward = settings?.maxSpinReward || 10;
  
  // Create a pseudo-random list of rewards between min and max for the wheel display
  const wheelRewards = [
    minReward,
    Math.floor(minReward + (maxReward - minReward) * 0.2),
    Math.floor(minReward + (maxReward - minReward) * 0.5),
    minReward,
    maxReward,
    Math.floor(minReward + (maxReward - minReward) * 0.3),
    Math.floor(minReward + (maxReward - minReward) * 0.7),
    minReward
  ];

  const handleSpin = async () => {
    if (profile.spinsLeft <= 0) {
      toast.error('No spins left today!');
      return;
    }

    setIsSpinning(true);
    setResult(null);

    // Random rotation (at least 5 full turns + random segment)
    const extraRotation = Math.floor(Math.random() * 360);
    const totalRotation = rotation + (360 * 5) + extraRotation;
    setRotation(totalRotation);

    // Calculate result based on rotation
    const segmentSize = 360 / wheelRewards.length;
    const finalAngle = extraRotation % 360;
    const rewardIndex = Math.floor((360 - finalAngle) / segmentSize) % wheelRewards.length;
    const rewardAmount = wheelRewards[rewardIndex];

    setTimeout(async () => {
      setIsSpinning(false);
      setResult(rewardAmount);

      try {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          balance: increment(rewardAmount),
          totalEarnings: increment(rewardAmount),
          todayEarnings: increment(rewardAmount),
          spinsLeft: increment(-1)
        });

        await addDoc(collection(db, 'transactions'), {
          userId: user.uid,
          amount: rewardAmount,
          type: 'credit',
          category: 'spin',
          description: `Spin Wheel Reward: ₹${rewardAmount}`,
          timestamp: new Date().toISOString()
        });

        toast.success(`Congratulations! You won ₹${rewardAmount}`);
      } catch (error) {
        console.error('Spin error:', error);
        toast.error('Failed to save reward');
      }
    }, 4000);
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

            <h2 className="text-2xl font-bold text-white mb-2">Spin & Win</h2>
            <p className="text-slate-400 mb-8">You have {profile.spinsLeft} spins left today</p>

            {/* The Wheel */}
            <div className="relative w-64 h-64 mx-auto mb-8">
              {/* Pointer */}
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 w-8 h-8 text-yellow-500">
                <div className="w-0 h-0 border-l-[16px] border-l-transparent border-r-[16px] border-r-transparent border-t-[24px] border-t-yellow-500 mx-auto" />
              </div>

              <motion.div
                animate={{ rotate: rotation }}
                transition={{ duration: 4, ease: [0.45, 0.05, 0.55, 0.95] }}
                className="w-full h-full rounded-full border-8 border-slate-800 relative overflow-hidden bg-slate-900 shadow-2xl"
              >
                {wheelRewards.map((reward, i) => (
                  <div
                    key={i}
                    className="absolute top-0 left-1/2 w-1/2 h-1/2 origin-bottom-left flex items-center justify-center"
                    style={{ 
                      transform: `rotate(${i * (360 / wheelRewards.length)}deg)`,
                      backgroundColor: i % 2 === 0 ? '#22C55E' : '#1E293B',
                      borderRight: '1px solid rgba(255,255,255,0.1)'
                    }}
                  >
                    <span className="text-white font-bold text-sm -rotate-45 translate-x-4 -translate-y-4">₹{reward}</span>
                  </div>
                ))}
              </motion.div>
              
              {/* Center Cap */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-xl flex items-center justify-center z-20">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <Trophy className="text-white w-4 h-4" />
                </div>
              </div>
            </div>

            <button
              onClick={handleSpin}
              disabled={isSpinning || profile.spinsLeft <= 0}
              className="w-full py-4 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-green-500/20 transition-all duration-300 flex items-center justify-center gap-2"
            >
              {isSpinning ? <Loader2 className="w-5 h-5 animate-spin" /> : <><RefreshCw className="w-5 h-5" /> Spin Now</>}
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
