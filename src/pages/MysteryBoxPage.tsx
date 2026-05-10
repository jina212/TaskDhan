import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Gift, 
  Zap, 
  PlayCircle, 
  TrendingUp, 
  ChevronRight, 
  Lock, 
  Loader2,
  Trophy,
  Star,
  Sparkles,
  Coins,
  AlertCircle,
  TrendingDown,
  Fingerprint,
  RotateCcw
} from 'lucide-react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, increment, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { MysteryBox, BoxOpening } from '../types';
import { cn, formatCurrency, handleFirestoreError, OperationType } from '../lib/utils';
import { toast } from 'sonner';
import { auth } from '../firebase';
import confetti from 'canvas-confetti';
import { useSettings } from '../hooks/useSettings';

const STATIC_BOXES: MysteryBox[] = [
  {
    id: 'free-daily',
    name: 'Daily Free Box',
    type: 'free',
    price: 0,
    minReward: 1,
    maxReward: 10,
    icon: '🎁',
    color: 'from-emerald-500 to-teal-600'
  },
  {
    id: 'ad-unlock',
    name: 'Ad Unlock Box',
    type: 'ad',
    price: 0,
    minReward: 5,
    maxReward: 50,
    icon: '📺',
    color: 'from-blue-500 to-indigo-600'
  },
  {
    id: 'paid-basic',
    name: 'Basic Paid Box',
    type: 'paid',
    price: 20,
    minReward: 5,
    maxReward: 100,
    icon: '💰',
    color: 'from-yellow-500 to-orange-600'
  },
  {
    id: 'paid-premium',
    name: 'Premium Super Box',
    type: 'paid',
    price: 100,
    minReward: 50,
    maxReward: 1000,
    icon: '🧨',
    color: 'from-purple-500 to-pink-600'
  }
];

const REWARD_PROBABILITIES = [
  { threshold: 0.40, multiplier: 0.2 }, // 40% chance for low reward
  { threshold: 0.65, multiplier: 0.4 }, // 25% chance for mid-low reward
  { threshold: 0.80, multiplier: 0.6 }, // 15% chance for mid reward
  { threshold: 0.90, multiplier: 0.8 }, // 10% chance for mid-high reward
  { threshold: 0.97, multiplier: 1.2 }, // 7% chance for high reward
  { threshold: 1.00, multiplier: 2.0 }, // 3% chance for jackpot
];

export default function MysteryBoxPage() {
  const { user, profile } = useAuth();
  const { settings } = useSettings();
  
  const boxes = STATIC_BOXES.map(box => {
    if (box.id === 'free-daily') {
      return { ...box, maxReward: settings?.mysteryBoxFreeMax || box.maxReward };
    }
    if (box.type === 'paid') {
      return { 
        ...box, 
        maxReward: settings?.mysteryBoxPaidMax || box.maxReward,
        price: settings?.mysteryBoxPaidPrice || box.price
      };
    }
    return box;
  });

  const [openingBox, setOpeningBox] = useState<MysteryBox | null>(null);
  const [isOpening, setIsOpening] = useState(false);
  const [reward, setReward] = useState<number | null>(null);
  const [recentWinners, setRecentWinners] = useState<BoxOpening[]>([]);
  const [userHistory, setUserHistory] = useState<BoxOpening[]>([]);
  const [boxesOpenedToday, setBoxesOpenedToday] = useState(0);

  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [adProgress, setAdProgress] = useState(0);

  useEffect(() => {
    if (!user) return;

    const init = async () => {
      // Fetch recent winners
      const q = query(collection(db, 'boxOpenings'), orderBy('timestamp', 'desc'), limit(5));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const winners = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BoxOpening));
        setRecentWinners(winners);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'boxOpenings', auth);
      });

      // Check daily limit
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      const qToday = query(
        collection(db, 'boxOpenings'), 
        where('userId', '==', user.uid),
        where('timestamp', '>=', startOfToday.toISOString())
      );
    
      getDocs(qToday).then(snapshot => {
        setBoxesOpenedToday(snapshot.size);
      });

      // Fetch user specific history
      const qUser = query(
        collection(db, 'boxOpenings'),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(10)
      );
      const unsubUser = onSnapshot(qUser, (snapshot) => {
        const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BoxOpening));
        setUserHistory(history);
      });

      return () => {
        unsubscribe();
        unsubUser();
      };
    };

    const cleanupPromise = init();
    return () => {
      cleanupPromise.then(cleanup => cleanup && cleanup());
    };
  }, [user]);

  const calculateReward = (box: MysteryBox) => {
    const winProb = settings?.winProbability || 50;
    // Shift randomness based on win probability (0-100)
    // Higher winProb makes it more likely to get higher multipliers
    const roll = Math.random() * (winProb / 100);
    const random = 1 - roll; // Inverse so higher roll gives lower random, which fits the thresholds?
    // Actually, let's just use the winProb to bias the roll
    const biasedRandom = Math.pow(Math.random(), winProb / 50); // winProb 50 = power 1, winProb 100 = power 2
    // If biasedRandom is larger, more likely to hit higher thresholds?
    // Thresholds: low=0.4, higher=1.0. 
    // Higher power makes values smaller (random is 0-1).
    // Let's use: random = Math.pow(Math.random(), 50 / winProb)
    const normalizedRandom = Math.pow(Math.random(), 50 / Math.max(1, winProb));
    
    const prob = REWARD_PROBABILITIES.find(p => normalizedRandom <= p.threshold) || REWARD_PROBABILITIES[0];
    
    const range = box.maxReward - box.minReward;
    const baseReward = box.minReward + (range * prob.multiplier * Math.random());
    return Math.floor(baseReward);
  };

  const handleOpenBox = async (box: MysteryBox) => {
    if (!user || !profile) return;

    // Check balance for paid boxes
    if (box.type === 'paid' && profile.balance < box.price) {
      toast.error('Insufficient balance!');
      return;
    }

    // Check daily limit (max 5 boxes total for anti-cheat)
    if (boxesOpenedToday >= 10) {
      toast.error('Daily limit reached! Come back tomorrow.');
      return;
    }

    // Check free box limit
    if (box.type === 'free' && profile.lastBoxOpenDate === new Date().toISOString().split('T')[0]) {
      toast.error('You already opened your free box today!');
      return;
    }

    setOpeningBox(box);
    setReward(null);

    // Handle Ad Box specifically
    if (box.type === 'ad') {
      setIsWatchingAd(true);
      setAdProgress(0);
      
      // Simulate ad watching for 5 seconds
      const duration = 5000;
      const interval = 100;
      const steps = duration / interval;
      
      for (let i = 0; i <= steps; i++) {
        await new Promise(resolve => setTimeout(resolve, interval));
        setAdProgress((i / steps) * 100);
      }
      
      setIsWatchingAd(false);
    }

    setIsOpening(true);

    // Simulate animation delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const winAmount = calculateReward(box);
    
    try {
      const timestamp = new Date().toISOString();
      
      // 1. Record the opening
      await addDoc(collection(db, 'boxOpenings'), {
        userId: user.uid,
        boxId: box.id,
        boxType: box.type,
        amount: winAmount,
        timestamp
      });

      // 2. Update user balance and stats
      const userRef = doc(db, 'users', user.uid);
      const updates: any = {
        balance: increment(winAmount - (box.type === 'paid' ? box.price : 0)),
        totalEarnings: increment(winAmount),
        todayEarnings: increment(winAmount),
      };

      if (box.type === 'free') {
        updates.lastBoxOpenDate = timestamp.split('T')[0];
      }

      await updateDoc(userRef, updates);

      // 3. Create transaction record
      await addDoc(collection(db, 'transactions'), {
        userId: user.uid,
        amount: winAmount,
        type: 'credit',
        category: 'mystery_box',
        description: `Won ₹${winAmount} from ${box.name}`,
        timestamp
      });

      if (box.type === 'paid') {
        await addDoc(collection(db, 'transactions'), {
          userId: user.uid,
          amount: box.price,
          type: 'debit',
          category: 'mystery_box',
          description: `Opened ${box.name}`,
          timestamp
        });
      }

      setReward(winAmount);
      setIsOpening(false);
      setBoxesOpenedToday(prev => prev + 1);

      if (winAmount >= box.maxReward * 0.5) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#3b82f6', '#f59e0b']
        });
      }

    } catch (error) {
      console.error('Error opening box:', error);
      toast.error('Something went wrong. Please try again.');
      setOpeningBox(null);
      setIsOpening(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-text-main tracking-tight">Mystery Box</h1>
          <p className="text-text-muted text-sm mt-1">Try your luck and win big rewards!</p>
        </div>
        <div className="flex flex-col items-end">
          <div className="px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-brand-primary text-xs font-bold flex items-center gap-1">
            <Zap className="w-3 h-3" />
            <span>{10 - boxesOpenedToday} Left</span>
          </div>
        </div>
      </div>

      {/* Live Winners Ticker */}
      <div className="bg-bg-card border border-border-main rounded-2xl p-3 overflow-hidden">
        <div className="flex items-center gap-4 animate-marquee whitespace-nowrap w-full">
          <span className="text-xs font-black text-brand-primary flex items-center gap-1 uppercase tracking-widest bg-brand-primary/5 px-3 py-1 rounded-full border border-brand-primary/10">
            <Sparkles className="w-3.5 h-3.5" /> Live Winners
          </span>
          <div className="flex items-center gap-4">
            {[...recentWinners, ...recentWinners, ...recentWinners].map((win, i) => (
              <span key={`${win.id}-${i}`} className="text-xs text-text-muted flex items-center gap-2 font-medium">
                User <span className="text-text-main font-bold">***{win.userId?.slice(-4) || 'AUTH'}</span> won <span className="text-emerald-500 font-black">₹{win.amount}</span>
                <span className="text-border-main mx-2 opacity-50">•</span>
              </span>
            ))}
            {recentWinners.length === 0 && (
              <span className="text-xs text-text-muted italic">Waiting for winners...</span>
            )}
          </div>
        </div>
      </div>

      {/* Boxes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {boxes.map((box) => {
          const isLocked = box.type === 'free' && profile?.lastBoxOpenDate === new Date().toISOString().split('T')[0];
          
          return (
            <motion.div
              key={box.id}
              whileHover={{ y: -5 }}
              className={cn(
                "relative p-6 rounded-[2.5rem] border-2 transition-all overflow-hidden group",
                isLocked ? "bg-bg-card/50 border-border-main opacity-75" : "bg-bg-card border-border-main hover:border-brand-primary shadow-xl shadow-black/5"
              )}
            >
              {/* Background Glow */}
              <div className={cn("absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 bg-gradient-to-br", box.color)} />
              
              <div className="relative z-10 flex items-start justify-between mb-6">
                <div className={cn("w-16 h-16 rounded-3xl flex items-center justify-center text-4xl shadow-inner bg-gradient-to-br", box.color)}>
                  {box.icon}
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-1">{box.type} Box</p>
                  <p className={cn(
                    "text-2xl font-black",
                    box.type === 'ad' ? "text-brand-primary" : "text-text-main"
                  )}>
                    {box.price === 0 ? (box.type === 'ad' ? 'WATCH AD' : 'FREE') : `₹${box.price}`}
                  </p>
                </div>
              </div>

              <div className="relative z-10 mb-8">
                <h3 className="text-xl font-bold text-text-main mb-2">{box.name}</h3>
                <div className="flex items-center gap-2 text-text-muted text-sm">
                  <Trophy className="w-4 h-4 text-yellow-500" />
                  <span>Win up to <span className="text-emerald-500 font-bold">₹{box.maxReward}</span></span>
                </div>
                {box.type === 'ad' && (
                  <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-brand-primary uppercase tracking-wider bg-brand-primary/10 w-fit px-2 py-1 rounded-lg">
                    <PlayCircle className="w-3 h-3" />
                    High Reward Video
                  </div>
                )}
              </div>

              <button
                disabled={isLocked || isOpening}
                onClick={() => handleOpenBox(box)}
                className={cn(
                  "relative z-10 w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2",
                  isLocked 
                    ? "bg-bg-main text-text-muted cursor-not-allowed" 
                    : "bg-brand-primary text-white hover:bg-brand-secondary shadow-lg shadow-brand-primary/20"
                )}
              >
                {isLocked ? (
                  <><Lock className="w-4 h-4" /> Opened Today</>
                ) : (
                  <>
                    {box.type === 'ad' ? 'Watch & Open' : 'Open Box'} 
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Psychology Trick */}
              {!isLocked && (
                <p className="mt-4 text-center text-[10px] font-bold text-brand-primary/60 uppercase tracking-tighter">
                  🔥 {Math.floor(Math.random() * 50 + 10)} users opened this in last hour
                </p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Opening Animation Overlay */}
      <AnimatePresence>
        {openingBox && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="relative flex flex-col items-center text-center w-full max-w-sm"
            >
              {isWatchingAd ? (
                <div className="space-y-8 w-full">
                  <div className="relative w-32 h-32 mx-auto">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-4 border-brand-primary/20 border-t-brand-primary"
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-4xl">
                      📺
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h2 className="text-2xl font-black text-white uppercase tracking-widest">Watching Ad</h2>
                      <p className="text-white/60 text-sm">Please wait while the ad completes...</p>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-brand-primary"
                        initial={{ width: 0 }}
                        animate={{ width: `${adProgress}%` }}
                      />
                    </div>
                    <p className="text-brand-primary font-bold text-xs uppercase tracking-widest">
                      {Math.ceil((100 - adProgress) / 20)}s remaining
                    </p>
                  </div>
                </div>
              ) : isOpening ? (
                <div className="space-y-8">
                  <motion.div
                    animate={{ 
                      rotate: [0, -15, 15, -15, 15, 0],
                      y: [0, -10, 0, -10, 0],
                      scale: [1, 1.1, 1, 1.1, 1]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 0.4,
                      ease: "easeInOut"
                    }}
                    className="text-9xl filter drop-shadow-[0_0_50px_rgba(255,255,255,0.4)]"
                  >
                    {openingBox.icon}
                  </motion.div>
                  <div className="space-y-2">
                    <motion.h2 
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1 }}
                      className="text-2xl font-black text-white uppercase tracking-widest"
                    >
                      Opening Box...
                    </motion.h2>
                    <p className="text-white/60 text-sm">Good luck! Big wins are possible!</p>
                  </div>
                </div>
              ) : reward !== null ? (
                <motion.div
                  initial={{ y: 100, opacity: 0, scale: 0.5 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ type: "spring", damping: 12, stiffness: 100 }}
                  className="space-y-8"
                >
                  <div className="relative">
                    <motion.div
                      animate={{ 
                        scale: [1, 2, 1.5], 
                        rotate: [0, 180, 360],
                        opacity: [0.3, 0.6, 0.3]
                      }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute inset-0 bg-brand-primary blur-[100px]"
                    />
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2, type: "spring" }}
                      className="relative text-9xl mb-4 drop-shadow-2xl"
                    >
                      🎉
                    </motion.div>
                  </div>
                  
                  <div className="space-y-2">
                    <motion.h2 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="text-2xl font-bold text-white/80"
                    >
                      Congratulations!
                    </motion.h2>
                    <motion.div 
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.6, type: "spring", bounce: 0.6 }}
                      className="text-7xl font-black text-brand-primary drop-shadow-[0_0_20px_rgba(16,185,129,0.5)]"
                    >
                      ₹{reward}
                    </motion.div>
                    <motion.p 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.8 }}
                      className="text-white/60"
                    >
                      Reward added to your wallet
                    </motion.p>
                  </div>

                  <motion.button
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
                    onClick={() => setOpeningBox(null)}
                    className="mt-8 px-12 py-4 bg-white text-black font-black rounded-2xl hover:scale-105 active:scale-95 transition-all uppercase tracking-widest text-sm shadow-xl"
                  >
                    Collect Reward
                  </motion.button>
                </motion.div>
              ) : null}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Info Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 rounded-[2rem] bg-bg-card border border-border-main space-y-6">
          <div className="flex items-center gap-3 text-brand-primary">
            <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black tracking-tight">How it works</h3>
          </div>
          <ul className="space-y-4">
            {[
              "Open boxes to win random cash rewards up to ₹1000.",
              "Free boxes refresh every 24 hours automatically.",
              "Paid boxes have higher win probabilities & bigger jackpots.",
              "Daily limit of 10 boxes per user for platform security."
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-text-muted leading-relaxed">
                <div className="w-5 h-5 rounded-full bg-brand-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                </div>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* User History */}
        <div className="p-8 rounded-[2rem] bg-bg-card border border-border-main flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 text-brand-primary">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black tracking-tight">Your History</h3>
            </div>
            <div className="text-[10px] font-black text-text-muted uppercase tracking-widest whitespace-nowrap bg-bg-main px-2 py-1 rounded-lg border border-border-main">
              Last 10 Opens
            </div>
          </div>
          
          <div className="space-y-3 flex-1">
            {userHistory.length > 0 ? (
              userHistory.map((entry, i) => (
                <div key={entry.id} className="flex items-center justify-between p-3 rounded-2xl bg-bg-main/50 border border-border-main/50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-bg-card border border-border-main flex items-center justify-center text-xl">
                      {STATIC_BOXES.find(b => b.id === entry.boxId)?.icon || '🎁'}
                    </div>
                    <div>
                      <p className="text-xs font-black text-text-main line-clamp-1">
                        {STATIC_BOXES.find(b => b.id === entry.boxId)?.name || 'Mystery Box'}
                      </p>
                      <p className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-500">+₹{entry.amount}</p>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-tighter">Credit</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center opacity-50">
                <Gift className="w-12 h-12 mb-3 text-text-muted" />
                <p className="text-sm font-bold text-text-muted">No history yet</p>
                <p className="text-[10px] uppercase tracking-widest">Start opening boxes to win!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
