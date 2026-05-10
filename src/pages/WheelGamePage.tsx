import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronLeft, 
  Wallet, 
  Volume2, 
  VolumeX, 
  Info, 
  Users, 
  History as HistoryIcon,
  Zap,
  TrendingUp,
  Loader2,
  Trophy,
  X,
  ShieldCheck,
  AlertCircle,
  RotateCcw as RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { doc, updateDoc, increment, arrayUnion, serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import { Transaction } from '../types';

// Constants
const COLORS = {
  BLUE: '#0EA5E9',
  RED: '#EF4444',
  YELLOW: '#EAB308',
  BG: '#020617',
  CARD_BLUE: 'from-sky-500/20 to-sky-900/40',
  CARD_RED: 'from-rose-500/20 to-rose-900/40',
  CARD_YELLOW: 'from-amber-500/20 to-amber-900/40'
};

const CHIPS = [10, 100, 500, 2000, 5000];

// Wheel Segments (Matches image: mix of Blue and Yellow with rare Red)
// 12 segments: 5 Blue, 6 Yellow, 1 Red
const WHEEL_SEGMENTS = [
  { color: COLORS.BLUE, type: 'BLUE', multiplier: 2 },
  { color: COLORS.YELLOW, type: 'YELLOW', multiplier: 2 },
  { color: COLORS.BLUE, type: 'BLUE', multiplier: 2 },
  { color: COLORS.YELLOW, type: 'YELLOW', multiplier: 2 },
  { color: COLORS.RED, type: 'RED', multiplier: 8 },
  { color: COLORS.BLUE, type: 'BLUE', multiplier: 2 },
  { color: COLORS.YELLOW, type: 'YELLOW', multiplier: 2 },
  { color: COLORS.BLUE, type: 'BLUE', multiplier: 2 },
  { color: COLORS.YELLOW, type: 'YELLOW', multiplier: 2 },
  { color: COLORS.BLUE, type: 'BLUE', multiplier: 2 },
  { color: COLORS.YELLOW, type: 'YELLOW', multiplier: 2 },
  { color: COLORS.YELLOW, type: 'YELLOW', multiplier: 2 },
];

export default function WheelGamePage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  
  const [balance, setBalance] = useState<number>(profile?.balance || 0);
  const [selectedChip, setSelectedChip] = useState(10);
  const [bets, setBets] = useState<{ BLUE: number; RED: number; YELLOW: number }>({ BLUE: 0, RED: 0, YELLOW: 0 });
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [countdown, setCountdown] = useState(15);
  const [history, setHistory] = useState<string[]>(['BLUE', 'YELLOW', 'BLUE', 'RED', 'YELLOW', 'YELLOW', 'BLUE', 'BLUE', 'YELLOW', 'RED', 'BLUE']);
  const [isMuted, setIsMuted] = useState(false);
  const [profitAlert, setProfitAlert] = useState('Profit withdrawal 500 INR');
  const [showRules, setShowRules] = useState(false);
  const [lastGameResult, setLastGameResult] = useState<{
    winner: string;
    winnings: number;
    index: number;
    rotationDelta: number;
  } | null>(null);
  const [isReplaying, setIsReplaying] = useState(false);
  
  const wheelRef = useRef<HTMLDivElement>(null);

  // Sync balance with profile
  useEffect(() => {
    if (profile?.balance !== undefined) {
      setBalance(profile.balance);
    }
  }, [profile?.balance]);

  // Game Loop: Countdown
  useEffect(() => {
    if (countdown > 0 && !isSpinning) {
      const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isSpinning) {
      handleSpin();
    }
  }, [countdown, isSpinning]);

  const handlePlaceBet = (type: 'BLUE' | 'RED' | 'YELLOW') => {
    if (isSpinning) return;
    if (balance < selectedChip) {
      toast.error('Insufficient balance');
      return;
    }
    
    setBets(prev => ({ ...prev, [type]: prev[type] + selectedChip }));
    setBalance(prev => prev - selectedChip);
  };

  const handleClearBets = () => {
    if (isSpinning) return;
    setBalance(prev => prev + totalBet);
    setBets({ BLUE: 0, RED: 0, YELLOW: 0 });
  };

  const handleDoubleBets = () => {
    if (isSpinning) return;
    if (totalBet === 0) return;
    if (balance < totalBet) {
      toast.error('Insufficient balance to double');
      return;
    }
    setBalance(prev => prev - totalBet);
    setBets(prev => ({
      BLUE: (prev.BLUE as number) * 2,
      RED: (prev.RED as number) * 2,
      YELLOW: (prev.YELLOW as number) * 2,
    }));
  };

  const totalBet = (Object.values(bets) as number[]).reduce((a: number, b: number) => a + b, 0);

  const handleSpin = async () => {
    if (isSpinning || isReplaying) return;
    setIsSpinning(true);

    // Randomize winning segment
    const segmentCount = WHEEL_SEGMENTS.length;
    const winningIndex = Math.floor(Math.random() * segmentCount);
    const segmentAngle = 360 / segmentCount;
    
    // Calculate new rotation: Multiple spins (5+) then target segment
    const extraSpins = (5 + Math.random() * 5) * 360;
    const rotationDelta = extraSpins + (360 - winningIndex * segmentAngle);
    const targetRotation = rotation + rotationDelta;
    
    setRotation(targetRotation);

    // Wait for animation
    setTimeout(async () => {
      setIsSpinning(false);
      setCountdown(15);
      
      const winner = WHEEL_SEGMENTS[winningIndex];
      setHistory(prev => [winner.type, ...prev.slice(0, 14)]);

      // Calculate Winnings
      let totalWinnings = 0;
      if (bets.BLUE > 0 && winner.type === 'BLUE') totalWinnings += bets.BLUE * 2;
      if (bets.RED > 0 && winner.type === 'RED') totalWinnings += bets.RED * 8;
      if (bets.YELLOW > 0 && winner.type === 'YELLOW') totalWinnings += bets.YELLOW * 2;

      // Save for replay
      setLastGameResult({
        winner: winner.type,
        winnings: totalWinnings,
        index: winningIndex,
        rotationDelta: rotationDelta
      });

      if (user && totalBet > 0) {
        try {
          const netChange = totalWinnings - totalBet;
          const userRef = doc(db, 'users', user.uid);
          
          if (totalWinnings > 0) {
            // Winner path
            toast.success(`You won ₹${totalWinnings}!`, {
              icon: <Trophy className="w-5 h-5 text-yellow-500" />,
              duration: 5000
            });

            await updateDoc(userRef, {
              balance: increment(netChange),
              totalEarnings: increment(totalWinnings - totalBet),
              todayEarnings: increment(totalWinnings - totalBet)
            });

            // Record transaction
            await addDoc(collection(db, 'transactions'), {
              userId: user.uid,
              amount: totalWinnings,
              currency: 'INR',
              type: 'credit',
              category: 'spin',
              description: `Won ₹${totalWinnings} in Color Wheel (${winner.type} x${winner.multiplier})`,
              timestamp: new Date().toISOString()
            });
          } else {
            // Loser path
            toast.error('Better luck next time!');
            await updateDoc(userRef, {
              balance: increment(-totalBet)
            });
          }
        } catch (error) {
          console.error('Error updating game results:', error);
          toast.error('Failed to update balance');
        }
      }

      setBets({ BLUE: 0, RED: 0, YELLOW: 0 });
    }, 4500); // 4.5s spin duration
  };

  const handleReplay = () => {
    if (isSpinning || isReplaying || !lastGameResult) return;
    setIsReplaying(true);
    
    // Animate again
    const targetRotation = rotation + lastGameResult.rotationDelta;
    setRotation(targetRotation);

    setTimeout(() => {
      setIsReplaying(false);
      
      // Show result again
      const icon = lastGameResult.winnings > 0 ? <Trophy className="w-5 h-5 text-yellow-500" /> : <AlertCircle className="w-5 h-5 text-rose-500" />;
      const message = lastGameResult.winnings > 0 ? `REPLAY: You won ₹${lastGameResult.winnings}!` : 'REPLAY: Better luck next time!';
      
      if (lastGameResult.winnings > 0) {
        toast.success(message, { icon, duration: 3000 });
      } else {
        toast.error(message, { icon, duration: 3000 });
      }
    }, 4500);
  };

  return (
    <div className="min-h-screen bg-bg-main text-white flex flex-col items-center select-none overflow-hidden pb-10">
      {/* Header */}
      <div className="w-full max-w-lg px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ChevronLeft className="w-7 h-7" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
            <Wallet className="w-4 h-4 text-emerald-400" />
            <span className="font-black text-lg">₹{balance.toLocaleString()}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 rounded-full text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-rose-500/20">
            <TrendingUp className="w-4 h-4" />
            Deposit
          </button>
          <button onClick={() => setIsMuted(!isMuted)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            {isMuted ? <VolumeX className="w-5 h-5 text-white/40" /> : <Volume2 className="w-5 h-5 text-white" />}
          </button>
          <button 
            onClick={() => setShowRules(true)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-white/40"
          >
            <Info className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Announcement Bar */}
      <div className="w-full bg-white/5 border-y border-white/10 py-1.5 overflow-hidden">
        <motion.div 
          animate={{ x: [400, -400] }}
          transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
          className="whitespace-nowrap text-[10px] font-black uppercase text-brand-primary tracking-[0.3em]"
        >
          {profitAlert} • AI WINNER REWARDED 5000 INR • {profitAlert}
        </motion.div>
      </div>

      {/* Multiplier/Stats Area */}
      <div className="w-full max-w-lg px-6 mt-4 flex items-center justify-between opacity-50">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Live Draw
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
            <Users className="w-4 h-4" />
            375 Participants
          </div>
      </div>

      {/* The Wheel Container */}
      <div className="relative w-full max-w-md aspect-square flex items-center justify-center p-8 mt-4 group">
        {/* Glow Effects */}
        <div className="absolute inset-4 rounded-full bg-brand-primary/20 blur-[60px] animate-pulse" />
        <div className="absolute inset-10 rounded-full border-2 border-brand-primary/20 animate-spin-slow ring-4 ring-brand-primary/5" />
        
        {/* Wheel Base */}
        <motion.div 
          animate={{ rotate: rotation }}
          transition={{ duration: 4.5, ease: [0.32, 0.01, 0.1, 1] }}
          className="relative w-full h-full rounded-full border-8 border-bg-card shadow-2xl shadow-brand-primary/20 overflow-hidden group-hover:scale-[1.02] transition-transform duration-700"
          style={{ background: COLORS.BG }}
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {WHEEL_SEGMENTS.map((seg, i) => {
              const count = WHEEL_SEGMENTS.length;
              const angle = 360 / count;
              const startAngle = i * angle;
              const endAngle = (i + 1) * angle;

              // SVG Circle Sector Path
              const x1 = 50 + 50 * Math.cos((Math.PI * (startAngle - 90)) / 180);
              const y1 = 50 + 50 * Math.sin((Math.PI * (startAngle - 90)) / 180);
              const x2 = 50 + 50 * Math.cos((Math.PI * (endAngle - 90)) / 180);
              const y2 = 50 + 50 * Math.sin((Math.PI * (endAngle - 90)) / 180);

              const pathData = `M 50 50 L ${x1} ${y1} A 50 50 0 0 1 ${x2} ${y2} Z`;

              return (
                <path 
                  key={i} 
                  d={pathData} 
                  fill={seg.color} 
                  className="stroke-[#020617] stroke-[0.5] transition-colors"
                />
              );
            })}
          </svg>
        </motion.div>

        {/* Center Hub */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full bg-bg-card border-4 border-white/10 shadow-[0_0_40px_rgba(30,190,210,0.4)] flex flex-col items-center justify-center z-10">
          <div className="absolute inset-0 rounded-full border border-white/20 animate-spin-slow" />
          <span className="text-4xl font-black text-brand-primary tracking-tighter drop-shadow-[0_0_10px_rgba(30,190,210,0.8)]">
            {isSpinning ? <Loader2 className="w-10 h-10 animate-spin" /> : countdown}
          </span>
          <span className="text-[10px] font-black uppercase text-white/60 tracking-widest mt-1">Draw Time</span>
        </div>

        {/* Pointer */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center">
            <div className="w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[25px] border-t-amber-500 drop-shadow-xl" />
            <div className="w-2 h-2 rounded-full bg-white animate-ping absolute top-0" />
        </div>
      </div>

      {/* History Line */}
      <div className="w-full max-w-lg px-6 mt-8">
        <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-white/40" />
            <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Recent Trends</span>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide no-scrollbar">
          {history.map((type, i) => (
            <motion.div 
              key={i}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className={cn(
                "w-4 h-4 rounded-full flex-shrink-0 border-2 border-white/10",
                type === 'BLUE' ? 'bg-sky-500' : type === 'RED' ? 'bg-rose-500' : 'bg-amber-500'
              )}
            />
          ))}
          <div className="px-3 py-1 rounded-md bg-white/5 border border-white/10 text-[8px] font-black uppercase tracking-widest text-brand-primary h-fit">New</div>
          
          <AnimatePresence>
            {lastGameResult && (
              <motion.button 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                onClick={handleReplay}
                disabled={isSpinning || isReplaying}
                className="flex-shrink-0 flex items-center gap-2 px-3 py-1 rounded-md bg-brand-primary/20 border border-brand-primary/40 text-[8px] font-black uppercase tracking-widest text-brand-primary h-fit hover:bg-brand-primary/30 transition-all disabled:opacity-50"
              >
                <RefreshCw className="w-3 h-3" />
                Replay Last
              </motion.button>
            )}
          </AnimatePresence>

          <button className="flex-shrink-0 p-1.5 rounded-lg bg-white/5 border border-white/10">
            <HistoryIcon className="w-3 h-3 text-white/40" />
          </button>
        </div>
      </div>

      {/* Bet Summary */}
      <div className="w-full max-w-lg px-6 mt-4">
        <div className="p-5 rounded-[2.5rem] bg-white/5 border border-white/10 flex items-center justify-between shadow-2xl relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          
          <div className="flex gap-6 relative z-10">
            <div className="flex flex-col">
              <span className="text-[8px] font-black uppercase text-sky-400 tracking-[0.2em] mb-1">Blue</span>
              <span className={cn("text-base font-black transition-all", bets.BLUE > 0 ? "text-white" : "text-white/20")}>
                ₹{bets.BLUE}
              </span>
            </div>
            <div className="flex flex-col border-l border-white/5 pl-6">
              <span className="text-[8px] font-black uppercase text-rose-400 tracking-[0.2em] mb-1">Red</span>
              <span className={cn("text-base font-black transition-all", bets.RED > 0 ? "text-white" : "text-white/20")}>
                ₹{bets.RED}
              </span>
            </div>
            <div className="flex flex-col border-l border-white/5 pl-6">
              <span className="text-[8px] font-black uppercase text-amber-400 tracking-[0.2em] mb-1">Yellow</span>
              <span className={cn("text-base font-black transition-all", bets.YELLOW > 0 ? "text-white" : "text-white/20")}>
                ₹{bets.YELLOW}
              </span>
            </div>
          </div>

          <div className="flex flex-col items-end relative z-10">
            <span className="text-[8px] font-black uppercase text-white/40 tracking-[0.2em] mb-1">Total Bet</span>
            <div className="flex items-baseline gap-1">
              <span className="text-[10px] font-black text-emerald-400/60 uppercase">₹</span>
              <span className="text-2xl font-black text-emerald-400 tabular-nums tracking-tighter">
                {totalBet}
              </span>
            </div>
          </div>

          {/* Progress Indicator if any bet placed */}
          {totalBet > 0 && (
             <motion.div 
               layoutId="active-bet-indicator"
               className="absolute bottom-0 left-0 h-1 bg-emerald-500/30"
               initial={{ width: 0 }}
               animate={{ width: '100%' }}
               transition={{ duration: 15, ease: "linear" }}
             />
          )}
        </div>
      </div>

      {/* Betting Areas */}
      <div className="w-full max-w-lg px-4 mt-4 grid grid-cols-3 gap-3">
        {['BLUE', 'RED', 'YELLOW'].map((type) => {
          const isRed = type === 'RED';
          const multiplier = isRed ? 'x8' : 'x2';
          const cardColor = type === 'BLUE' ? COLORS.CARD_BLUE : type === 'RED' ? COLORS.CARD_RED : COLORS.CARD_YELLOW;
          const textColor = type === 'BLUE' ? 'text-sky-300' : type === 'RED' ? 'text-rose-300' : 'text-amber-300';
          
          return (
            <motion.button
              key={type}
              whileTap={{ scale: 0.95 }}
              onClick={() => handlePlaceBet(type as any)}
              disabled={isSpinning}
              className={cn(
                "relative group flex flex-col items-center justify-between p-6 rounded-[2rem] border-2 border-white/5 overflow-hidden transition-all duration-300 bg-gradient-to-b h-40",
                cardColor,
                bets[type as keyof typeof bets] > 0 ? "border-white/20 shadow-lg ring-2 ring-white/10" : "hover:border-white/10"
              )}
            >
              <AnimatePresence>
                {bets[type as keyof typeof bets] > 0 && (
                  <motion.div 
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="absolute top-2 px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-md border border-white/40 text-[10px] font-black z-10"
                  >
                    ₹{bets[type as keyof typeof bets]}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="flex flex-col items-center gap-1 mt-auto mb-auto">
                <span className={cn("text-xl font-black tracking-tight", textColor)}>{type}</span>
                <span className="text-3xl font-black opacity-30">{multiplier}</span>
              </div>
              
              <span className="text-[8px] font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
                TAP TO BET
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Betting Controls (Clear/Double) */}
      <div className="w-full max-w-lg px-6 mt-4 flex gap-3">
        <button
          onClick={handleClearBets}
          disabled={isSpinning || Object.values(bets).every(b => b === 0)}
          className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 transition-colors disabled:opacity-20"
        >
          Clear
        </button>
        <button
          onClick={handleDoubleBets}
          disabled={isSpinning || Object.values(bets).every(b => b === 0)}
          className="flex-1 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 transition-colors disabled:opacity-20"
        >
          2x Double
        </button>
      </div>

      {/* Chips Selection */}
      <div className="w-full max-w-lg px-6 mt-8 mb-8">
        <div className="flex justify-between items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
          {CHIPS.map((val) => {
            const colors = [
              'bg-emerald-500 shadow-emerald-500/50',
              'bg-rose-500 shadow-rose-500/50',
              'bg-amber-500 shadow-amber-500/50',
              'bg-purple-500 shadow-purple-500/50',
              'bg-slate-700 shadow-slate-500/50'
            ];
            const colorIdx = CHIPS.indexOf(val) % colors.length;
            const isSelected = selectedChip === val;

            return (
              <motion.button
                key={val}
                whileHover={{ y: -5 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedChip(val)}
                className={cn(
                  "relative w-14 h-14 rounded-full border-4 flex items-center justify-center transition-all duration-300",
                  isSelected ? "border-white scale-110 shadow-2xl z-20" : "border-white/10 opacity-60 grayscale hover:grayscale-0",
                  colors[colorIdx]
                )}
              >
                <div className="absolute inset-1 rounded-full border-2 border-dashed border-white/30 animate-spin-slow" />
                <span className="text-xs font-black text-white">{val}</span>
                {isSelected && (
                   <motion.div layoutId="chip-glow" className="absolute -inset-2 rounded-full bg-white/20 blur-xl z-[-1]" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* History Tab Button */}
      <div className="w-full max-w-lg px-4">
          <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 hover:bg-white/10 transition-colors">
            <div className="w-8 h-1 bg-white/20 rounded-full" />
            <span className="text-xs font-black uppercase tracking-[0.3em] text-white/60">Game History</span>
          </button>
      </div>

      {/* Rules Modal */}
      <AnimatePresence>
        {showRules && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
              onClick={() => setShowRules(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-[#020617] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/20 flex items-center justify-center text-brand-primary">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">Game Rules</h3>
                  </div>
                  <button 
                    onClick={() => setShowRules(false)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6 text-white/40" />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-3xl bg-white/5 border border-white/5 space-y-3">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">How to Play</h4>
                    <ul className="space-y-2">
                        {[
                            'Select your chip amount from the bottom bar.',
                            'Place your bet on Blue, Red, or Yellow.',
                            'Wait for the 15-second countdown to end.',
                            'The wheel spins, and rewards are distributed instantly!'
                        ].map((item, i) => (
                            <li key={i} className="flex gap-3 text-xs font-medium text-white/70">
                                <span className="text-brand-primary font-black">{i + 1}.</span>
                                {item}
                            </li>
                        ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { type: 'BLUE', mult: '2x', color: 'text-sky-400', bg: 'bg-sky-400/10' },
                      { type: 'RED', mult: '8x', color: 'text-rose-400', bg: 'bg-rose-400/10' },
                      { type: 'YELLOW', mult: '2x', color: 'text-amber-400', bg: 'bg-amber-400/10' },
                    ].map((item) => (
                      <div key={item.type} className={cn("p-3 rounded-2xl border border-white/5 flex flex-col items-center gap-1", item.bg)}>
                          <span className={cn("text-[10px] font-black", item.color)}>{item.type}</span>
                          <span className="text-xl font-black text-white">{item.mult}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 rounded-3xl bg-rose-500/10 border border-rose-500/20 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase text-rose-500 tracking-widest">Betting Limits</p>
                        <p className="text-xs font-medium text-rose-200/70">Minimum bet is ₹10. Maximum bet per draw is ₹50,000.</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowRules(false)}
                  className="w-full py-4 bg-white text-bg-main font-black rounded-2xl hover:bg-gray-200 transition-colors uppercase tracking-widest text-sm"
                >
                  I Understand
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
