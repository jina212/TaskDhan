import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  TrendingUp, 
  Users, 
  Trophy, 
  ChevronRight, 
  ArrowUpRight, 
  Gift, 
  Zap,
  PlayCircle,
  Download,
  FileText,
  User,
  RefreshCw,
  Bell,
  Coins,
  Crown,
  Sparkles,
  Loader2,
  Brain,
  Timer,
  XCircle
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { formatCurrency, cn } from '../lib/utils';
import SpinWheel from '../components/SpinWheel';
import DailyBonus from '../components/DailyBonus';
import { toast } from 'sonner';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

import { useSettings } from '../hooks/useSettings';

export default function Dashboard() {
  const { profile } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [isSpinOpen, setIsSpinOpen] = useState(false);
  const [isBonusOpen, setIsBonusOpen] = useState(false);
  const [isWatchingAd, setIsWatchingAd] = useState(false);

  if (!profile) return null;

  const stats = [
    { label: 'Wallet Balance', value: formatCurrency(profile.balance), icon: Wallet, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
    { label: 'Today Earnings', value: formatCurrency(profile.todayEarnings), icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10' },
    { label: 'Total Earnings', value: formatCurrency(profile.totalEarnings), icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Task Coins', value: profile.coins || 0, icon: Coins, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  const handleWatchAd = async () => {
    if (isWatchingAd) return;
    
    const maxAds = settings?.maxAdsPerDay || 20;
    if ((profile.adsWatchedToday || 0) >= maxAds) {
      toast.error('Daily Limit Reached', {
        description: `You have already watched ${maxAds} ads today. Come back tomorrow!`
      });
      return;
    }
    
    setIsWatchingAd(true);
    toast.info('Loading Rewarded Video...', { duration: 2000 });

    // Simulate ad watching
    setTimeout(async () => {
      try {
        const reward = settings?.adVideoReward || 10;
        const userRef = doc(db, 'users', profile.uid);
        await updateDoc(userRef, {
          coins: increment(reward),
          adsWatchedToday: increment(1)
        });
        toast.success('Ad Completed!', {
          description: `You earned ${reward} coins!`
        });
      } catch (error) {
        console.error('Ad reward error:', error);
      } finally {
        setIsWatchingAd(false);
      }
    }, 5000);
  };

  return (
    <div className="space-y-8">
      {/* Announcement Banner */}
      {settings?.announcement && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-brand-primary/10 border border-brand-primary/20 flex items-center gap-3 relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-brand-primary/5 to-transparent animate-shimmer" />
          <div className="w-10 h-10 rounded-xl bg-brand-primary flex items-center justify-center flex-shrink-0 animate-pulse-subtle">
            <Bell className="text-white w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-0.5">Notice</p>
            <p className="text-xs font-bold text-text-main line-clamp-2 leading-relaxed italic">"{settings.announcement}"</p>
          </div>
          <button 
            className="p-2 hover:bg-bg-card rounded-lg text-text-muted transition-colors"
            onClick={(e) => {
              const target = e.currentTarget.parentElement;
              if (target) target.style.display = 'none';
            }}
          >
            <XCircle className="w-4 h-4" />
          </button>
        </motion.div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-text-main">Hello, {profile.displayName.split(' ')[0]}!</h1>
            {profile.isPremium && (
              <div className="px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-[10px] font-black rounded-md uppercase tracking-wider flex items-center gap-1">
                <Crown className="w-3 h-3" />
                Premium
              </div>
            )}
          </div>
          <p className="text-text-muted text-sm">Ready to earn some Dhan today?</p>
        </div>
        <div className="flex items-center gap-3">
          <Link 
            to="/profile"
            className="w-12 h-12 rounded-2xl bg-bg-card border border-border-main flex items-center justify-center overflow-hidden hover:border-brand-primary transition-all group"
          >
            {profile.photoURL ? (
              <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            ) : (
              <User className="w-6 h-6 text-text-muted" />
            )}
          </Link>
          <Link 
            to="/store"
            className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 hover:scale-105 transition-all"
          >
            <Crown className="w-6 h-6" />
          </Link>
          <button 
            onClick={() => navigate('/notifications')}
            className="w-12 h-12 rounded-2xl bg-bg-card border border-border-main flex items-center justify-center text-text-muted hover:text-brand-primary transition-all duration-300 relative"
          >
            <Bell className="w-6 h-6" />
            <div className="absolute top-3 right-3 w-2 h-2 bg-red-500 rounded-full border-2 border-bg-card" />
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-4 rounded-3xl bg-bg-card border border-border-main shadow-sm"
          >
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", stat.bg)}>
              <stat.icon className={cn("w-5 h-5", stat.color)} />
            </div>
            <p className="text-text-muted text-xs font-medium mb-1">{stat.label}</p>
            <p className="text-xl font-bold text-text-main">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Spin and Win Featured Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        onClick={() => navigate('/wheel-game')}
        className="p-8 rounded-[3.5rem] bg-gradient-to-br from-bg-card via-bg-card to-brand-primary/10 border-2 border-brand-primary/20 shadow-2xl relative overflow-hidden cursor-pointer group"
      >
        <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform duration-700">
           <RefreshCw className="w-48 h-48 text-brand-primary animate-spin-slow" />
        </div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-brand-primary/10 rounded-full blur-3xl" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-4 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3">
              <div className="px-4 py-1.5 bg-brand-primary/10 border border-brand-primary/20 rounded-full">
                 <span className="text-[10px] font-black uppercase text-brand-primary tracking-[0.2em]">New Game Live</span>
              </div>
              {profile.spinsLeft > 0 && (
                <div className="px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <span className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em]">{profile.spinsLeft} Spins Left</span>
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <h2 className="text-4xl font-black text-text-main tracking-tighter">Color Wheel <span className="text-brand-primary">Jackpot</span></h2>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <p className="text-2xl font-black text-yellow-500 tracking-tight">Win up to ₹{settings?.maxSpinReward || 5000}</p>
              </div>
            </div>
            
            <p className="text-text-muted text-sm max-w-sm leading-relaxed">Bet on Blue, Red or Yellow and win up to 8x rewards instantly. Multi-player live draws every 15 seconds!</p>
            
            <div className="flex items-center justify-center md:justify-start gap-4">
               <div className="flex -space-x-2">
                  {[1,2,3,4].map(i => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-bg-card bg-bg-main flex items-center justify-center overflow-hidden">
                       <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 15}`} alt="User" />
                    </div>
                  ))}
               </div>
               <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">+500 People Playing</p>
            </div>
          </div>
          <div className="relative">
            <div className="absolute inset-0 bg-brand-primary/20 blur-2xl rounded-full scale-150 animate-pulse-subtle" />
            <div className="w-28 h-28 rounded-full bg-brand-primary flex flex-col items-center justify-center text-white shadow-2xl shadow-brand-primary/40 group-hover:scale-110 transition-all border-4 border-white/20">
               <PlayCircle className="w-12 h-12 mb-1" />
               <span className="text-[10px] font-black uppercase tracking-widest">Spin Now</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Watch Ads & Earn Section */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-6 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <PlayCircle className="w-32 h-32" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <h3 className="text-xl font-black">Watch Ads & Earn Coins</h3>
            </div>
            <p className="text-white/70 text-sm">Watch a short video and get {settings?.adVideoReward || 10} coins instantly!</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={handleWatchAd}
              disabled={isWatchingAd}
              className="px-8 py-4 bg-white text-blue-600 font-black rounded-2xl shadow-xl hover:scale-105 transition-all disabled:opacity-50 disabled:scale-100 flex items-center gap-2"
            >
              {isWatchingAd ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Watching...</>
              ) : (
                <><PlayCircle className="w-5 h-5" /> Watch Now</>
              )}
            </button>
            <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
              Watched Today: {profile.adsWatchedToday || 0} / {settings?.maxAdsPerDay || 20}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Quiz & Earn Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
            <Brain className="text-brand-primary w-6 h-6" />
            Quiz & Earn
          </h2>
          <Link to="/quiz" className="text-brand-primary text-sm font-medium hover:underline">Play Now</Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/quiz')}
          className="p-6 rounded-[2.5rem] bg-gradient-to-br from-purple-600 to-indigo-700 text-white shadow-xl relative overflow-hidden cursor-pointer group"
        >
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Brain className="w-32 h-32" />
          </div>
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-4">
              <div className="space-y-1">
                <h3 className="text-xl font-black">GK & Cricket Quizzes</h3>
                <p className="text-white/70 text-sm">Solve questions & earn real cash!</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <Timer className="w-4 h-4" />
                  <span className="text-xs font-bold">Fast Paced</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Trophy className="w-4 h-4" />
                  <span className="text-xs font-bold">Leaderboard</span>
                </div>
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform">
              <ChevronRight className="w-8 h-8" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Daily Bonus & Spin */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => setIsBonusOpen(true)}
          className="p-6 rounded-3xl bg-gradient-to-br from-brand-primary/20 to-emerald-500/5 border border-brand-primary/20 flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20">
              <Gift className="text-white w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-main">Daily Bonus</h3>
              <p className="text-brand-primary/80 text-sm">Claim your ₹5 reward</p>
            </div>
          </div>
          <ChevronRight className="text-brand-primary w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/mystery-box')}
          className="p-6 rounded-3xl bg-gradient-to-br from-purple-500/20 to-pink-500/5 border border-purple-500/20 flex items-center justify-between group cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Gift className="text-white w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-main">Mystery Box</h3>
              <p className="text-purple-500/80 text-sm">Win up to ₹1000 now!</p>
            </div>
          </div>
          <ChevronRight className="text-purple-500 w-6 h-6 group-hover:translate-x-1 transition-transform" />
        </motion.div>
      </div>

      {/* Modals */}
      <SpinWheel isOpen={isSpinOpen} onClose={() => setIsSpinOpen(false)} />
      <DailyBonus isOpen={isBonusOpen} onClose={() => setIsBonusOpen(false)} />

      {/* Quick Tasks */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-text-main">Quick Tasks</h2>
          <Link to="/tasks" className="text-brand-primary text-sm font-medium hover:underline">View All</Link>
        </div>
        <div className="space-y-3">
          {[
            { title: 'Watch Video Ad', reward: 2, icon: PlayCircle, type: 'Video', color: 'text-blue-500', bg: 'bg-blue-500/10' },
            { title: 'Install PhonePe', reward: 10, icon: Download, type: 'App', color: 'text-purple-500', bg: 'bg-purple-500/10' },
            { title: 'Fill Feedback Form', reward: 5, icon: FileText, type: 'Form', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          ].map((task, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="p-4 rounded-2xl bg-bg-card border border-border-main flex items-center justify-between hover:border-text-muted transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", task.bg)}>
                  <task.icon className={cn("w-6 h-6", task.color)} />
                </div>
                <div>
                  <h4 className="text-text-main font-bold">{task.title}</h4>
                  <p className="text-text-muted text-xs">{task.type} Task</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-brand-primary font-bold">+₹{task.reward}</p>
                <button className="text-[10px] px-2 py-1 bg-brand-primary/10 text-brand-primary rounded-lg mt-1 font-bold uppercase tracking-wider">Start</button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
