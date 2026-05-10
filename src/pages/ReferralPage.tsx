import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Copy, Share2, Gift, Zap, ChevronRight, Trophy, Network, TrendingUp } from 'lucide-react';
import { useAuth } from '../AuthContext';
import { toast } from 'sonner';
import { cn } from '../lib/utils';
import ReferralTree from '../components/ReferralTree';
import { collection, query, where, getDocs, getCountFromServer } from 'firebase/firestore';
import { db } from '../firebase';

export default function ReferralPage() {
  const { profile } = useAuth();
  const [directCount, setDirectCount] = useState(0);
  const [indirectCount, setIndirectCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCounts = async () => {
      if (!profile?.uid) return;
      try {
        const directQ = query(collection(db, 'users'), where('referrerUid', '==', profile.uid));
        const indirectQ = query(collection(db, 'users'), where('referrerUidL2', '==', profile.uid));
        
        const [directSnapshot, indirectSnapshot] = await Promise.all([
          getCountFromServer(directQ),
          getCountFromServer(indirectQ)
        ]);

        setDirectCount(directSnapshot.data().count);
        setIndirectCount(indirectSnapshot.data().count);
      } catch (error) {
        console.error('Error fetching referral counts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCounts();
  }, [profile?.uid]);

  if (!profile) return null;

  const referralLink = `${window.location.origin}/r/${profile.referralCode}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    toast.success('Referral link copied to clipboard!');
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join TaskDhan',
          text: 'Earn real money by completing simple tasks! Join using my referral link and get started.',
          url: referralLink,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyToClipboard();
    }
  };

  const handleWhatsAppShare = () => {
    const text = `Hey! Join TaskDhan and earn real money by completing simple tasks. Use my referral link to get started: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleTelegramShare = () => {
    const text = `Hey! Join TaskDhan and earn real money by completing simple tasks. Use my referral link to get started: ${referralLink}`;
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-black text-text-main tracking-tight">Refer & Earn</h1>
        <p className="text-text-muted font-medium">Invite your friends and grow your network income</p>
      </div>

      {/* Referral Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 rounded-[2.5rem] bg-bg-card border-2 border-border-main shadow-xl relative overflow-hidden group"
        >
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Users className="w-24 h-24" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">Direct Referrals</p>
              <h4 className="text-3xl font-black text-text-main tracking-tight">{loading ? '...' : directCount}</h4>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-6 rounded-[2.5rem] bg-bg-card border-2 border-border-main shadow-xl relative overflow-hidden group"
        >
          <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Network className="w-24 h-24" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">Indirect Referrals</p>
              <h4 className="text-3xl font-black text-text-main tracking-tight">{loading ? '...' : indirectCount}</h4>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-6 rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-xl shadow-emerald-500/20 relative overflow-hidden group"
        >
          <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <TrendingUp className="w-24 h-24" />
          </div>
          <div className="relative z-10 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white border border-white/20 shadow-inner">
              <Gift className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">Total Referral Earnings</p>
              <h4 className="text-3xl font-black tracking-tight flex items-baseline gap-1">
                ₹{profile.referralEarnings}
              </h4>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Referral Link & Sharing Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-xl font-black text-text-main tracking-tight">Share Your Link</h3>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">Live Rewards</span>
          </div>
        </div>
        
        <div className="p-6 bg-bg-card border-2 border-border-main rounded-[2.5rem] space-y-6 shadow-xl shadow-bg-main/50">
          {/* Referral Code UI */}
          <div className="space-y-3">
             <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-2">Your Referral Code</p>
             <div className="flex items-center gap-3 p-4 bg-bg-main rounded-[1.5rem] border-2 border-border-main transition-all">
               <div className="flex-1 text-xl font-black text-brand-primary tracking-widest pl-2">
                 {profile.referralCode}
               </div>
               <button
                 onClick={() => {
                   navigator.clipboard.writeText(profile.referralCode);
                   toast.success('Referral code copied!');
                 }}
                 className="flex items-center gap-2 px-5 py-3 bg-bg-card border border-border-main text-text-main text-xs font-black rounded-xl hover:bg-bg-main transition-all active:scale-95 whitespace-nowrap"
               >
                 <Copy className="w-4 h-4 text-brand-primary" />
                 COPY CODE
               </button>
             </div>
          </div>

          {/* Copy Link UI */}
          <div className="space-y-3">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-2">Referral Link</p>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary to-emerald-500 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000"></div>
              <div className="relative flex items-center gap-3 p-4 bg-bg-main rounded-[1.5rem] border-2 border-border-main group-hover:border-brand-primary/30 transition-all">
                <div className="flex-1 text-sm font-black text-text-main truncate tracking-tight pr-2">
                  {referralLink}
                </div>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center gap-2 px-5 py-3 bg-brand-primary text-white text-xs font-black rounded-xl hover:bg-brand-secondary transition-all active:scale-95 whitespace-nowrap shadow-lg shadow-brand-primary/20"
                >
                  <Copy className="w-4 h-4" />
                  COPY
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] text-center">Quick Share With Friends</p>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleWhatsAppShare}
                className="flex flex-col items-center justify-center gap-2 py-6 bg-[#25D366] text-white rounded-[2rem] shadow-xl shadow-[#25D366]/20 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <svg className="w-8 h-8 fill-current relative z-10" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.72.937 3.659 1.432 5.631 1.433h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span className="text-xs font-black uppercase tracking-widest relative z-10">WhatsApp</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleTelegramShare}
                className="flex flex-col items-center justify-center gap-2 py-6 bg-[#0088cc] text-white rounded-[2rem] shadow-xl shadow-[#0088cc]/20 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <svg className="w-8 h-8 fill-current relative z-10" viewBox="0 0 24 24">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18.717-.962 4.084-1.362 5.441-.168.575-.337.768-.526.786-.412.039-.724-.271-1.123-.533-.624-.41-1.123-.665-2.124-1.323-1.157-.761-.407-1.18.252-1.865.173-.18 3.178-2.913 3.236-3.161.007-.032.014-.15-.056-.212s-.173-.041-.247-.024c-.105.024-1.782 1.132-5.044 3.328-.478.328-.912.489-1.302.479-.429-.011-1.254-.244-1.867-.443-.752-.244-1.349-.373-1.297-.788.027-.216.325-.436.894-.659 3.501-1.524 5.836-2.529 7.006-3.014 3.333-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.464.139.121.098.154.23.167.323.013.093.003.272-.014.407z"/>
                </svg>
                <span className="text-xs font-black uppercase tracking-widest relative z-10">Telegram</span>
              </motion.button>
            </div>

            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-3 py-5 bg-bg-main border-2 border-border-main hover:border-brand-primary/50 text-text-main font-black rounded-[1.5rem] transition-all shadow-sm active:scale-95"
            >
              <Share2 className="w-5 h-5 text-brand-primary" />
              MORE OPTIONS
            </button>
          </div>
        </div>
      </div>

      {/* Referral Tree Section */}
      <ReferralTree />

      {/* How it works */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-text-main">How it works</h3>
        <div className="space-y-3">
          {[
            { step: '01', title: 'Share Link', desc: 'Send your unique referral link to your friends.' },
            { step: '02', title: 'Friend Joins', desc: 'Your friend registers on TaskDhan using your link.' },
            { step: '03', title: 'Earn Reward', desc: 'You get ₹49 instantly in your referral wallet.' },
          ].map((item, i) => (
            <div key={i} className="p-4 rounded-2xl bg-bg-card border border-border-main flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                {item.step}
              </div>
              <div>
                <h4 className="text-text-main font-bold text-sm">{item.title}</h4>
                <p className="text-text-muted text-xs">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
