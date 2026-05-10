import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  ChevronRight, 
  ChevronDown, 
  Users, 
  TrendingUp, 
  Loader2, 
  Search,
  Filter,
  ArrowUpRight,
  Network,
  Crown
} from 'lucide-react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { cn } from '../lib/utils';

interface ReferralNode {
  id: string;
  name: string;
  level: 1 | 2;
  earnings: number;
  date: string;
  referralCode: string;
  children?: ReferralNode[];
}

export default function ReferralTree() {
  const { profile } = useAuth();
  const [referrals, setReferrals] = useState<ReferralNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchReferralNetwork = async () => {
      if (!profile?.uid) return;

      try {
        setLoading(true);
        // 1. Fetch Direct Referrals (Level 1)
        // Note: Using referrerUid which we now store during registration
        const directQuery = query(
          collection(db, 'users'),
          where('referrerUid', '==', profile.uid)
        );
        const directSnap = await getDocs(directQuery);
        
        // 2. Fetch Indirect Referrals (Level 2)
        // We can fetch all Level 2 referrals in one go now!
        const indirectQuery = query(
          collection(db, 'users'),
          where('referrerUidL2', '==', profile.uid)
        );
        const indirectSnap = await getDocs(indirectQuery);
        const allIndirects = indirectSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));

        const directNodes: ReferralNode[] = directSnap.docs.map(doc => {
          const userData = doc.data();
          return {
            id: doc.id,
            name: userData.displayName || 'User',
            level: 1,
            earnings: 49,
            date: userData.createdAt ? new Date(userData.createdAt).toLocaleDateString() : 'N/A',
            referralCode: userData.referralCode,
            children: allIndirects
              .filter(i => i.referrerUid === doc.id)
              .map(i => ({
                id: i.id,
                name: i.displayName || 'User',
                level: 2,
                earnings: 10,
                date: i.createdAt ? new Date(i.createdAt).toLocaleDateString() : 'N/A',
                referralCode: i.referralCode
              }))
          };
        });

        setReferrals(directNodes);
      } catch (error) {
        console.error('Error fetching referral network:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReferralNetwork();
  }, [profile?.uid]);

  const toggleNode = (id: string) => {
    const newSet = new Set(expandedNodes);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedNodes(newSet);
  };

  const filteredReferrals = useMemo(() => {
    if (!searchQuery) return referrals;
    const query = searchQuery.toLowerCase();
    return referrals.filter(node => 
      node.name.toLowerCase().includes(query) || 
      node.children?.some(child => child.name.toLowerCase().includes(query))
    );
  }, [referrals, searchQuery]);

  const totalDirect = referrals.length;
  const totalIndirect = referrals.reduce((acc, curr) => acc + (curr.children?.length || 0), 0);
  const totalNetworkEarnings = (totalDirect * 49) + (totalIndirect * 10);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <div className="relative">
          <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
          <Network className="w-6 h-6 text-brand-primary absolute inset-0 m-auto" />
        </div>
        <div className="text-center">
          <p className="text-text-main font-bold">Mapping your network...</p>
          <p className="text-text-muted text-xs">This might take a moment</p>
        </div>
      </div>
    );
  }

  if (referrals.length === 0) {
    return (
      <div className="p-12 rounded-[2.5rem] bg-bg-card border-2 border-dashed border-border-main text-center space-y-6">
        <div className="w-20 h-20 bg-bg-main rounded-[2rem] flex items-center justify-center mx-auto shadow-inner">
          <Users className="w-10 h-10 text-text-muted" />
        </div>
        <div className="space-y-2">
          <h4 className="text-xl font-black text-text-main">Your network is empty</h4>
          <p className="text-text-muted text-sm max-w-xs mx-auto">
            Start sharing your referral link to build your team and earn passive income!
          </p>
        </div>
        <button className="px-8 py-3 bg-brand-primary text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 hover:scale-105 transition-transform">
          Invite Friends
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Network Stats Card */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Direct', value: totalDirect, color: 'text-brand-primary', bg: 'bg-brand-primary/10' },
          { label: 'Indirect', value: totalIndirect, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Earnings', value: `₹${totalNetworkEarnings}`, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        ].map((stat, i) => (
          <div key={i} className={cn("p-4 rounded-3xl border border-border-main text-center space-y-1", stat.bg)}>
            <p className="text-[10px] font-black uppercase tracking-widest text-text-muted">{stat.label}</p>
            <p className={cn("text-lg font-black", stat.color)}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Search & Filter */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
        <input
          type="text"
          placeholder="Search members..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-bg-card border border-border-main rounded-2xl focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all text-sm"
        />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-black text-text-main flex items-center gap-2">
            <Network className="w-5 h-5 text-brand-primary" />
            Network Tree
          </h3>
          <button className="text-[10px] font-bold uppercase tracking-widest text-brand-primary hover:underline">
            Expand All
          </button>
        </div>

        <div className="space-y-4">
          {/* Root Node (You) */}
          <div className="mb-8">
            <div className="p-4 rounded-[2rem] bg-brand-primary text-white shadow-xl shadow-brand-primary/20 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-sm">{profile.displayName} (You)</h4>
                  <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">{profile.referralCode}</p>
                </div>
              </div>
              <div className="text-right px-4">
                <p className="text-xl font-black">₹{(referrals.length * 49) + (referrals.reduce((acc, curr) => acc + (curr.children?.length || 0), 0) * 10)}</p>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Network Earned</p>
              </div>
            </div>
            {/* Connector Line to first level */}
            <div className="flex justify-center h-8">
              <div className="w-1 bg-brand-primary/20 rounded-full" />
            </div>
          </div>

          {filteredReferrals.map((node) => (
            <div key={node.id} className="relative">
              <motion.div
                layout
                onClick={() => node.children && node.children.length > 0 && toggleNode(node.id)}
                className={cn(
                  "relative z-10 p-5 rounded-3xl border-2 transition-all duration-300",
                  node.children && node.children.length > 0 ? "cursor-pointer" : "cursor-default",
                  expandedNodes.has(node.id) 
                    ? "bg-bg-card border-brand-primary shadow-xl shadow-brand-primary/5" 
                    : "bg-bg-card border-border-main hover:border-brand-primary/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                        <User className="w-6 h-6" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 px-1.5 h-5 rounded-full bg-brand-primary text-white text-[8px] font-black flex items-center justify-center border-2 border-bg-card uppercase tracking-tighter">
                        L1
                      </div>
                    </div>
                    <div>
                      <h4 className="text-text-main font-black text-sm">{node.name}</h4>
                      <p className="text-text-muted text-[10px] font-bold">Joined {node.date}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-emerald-500 font-black text-sm">₹{node.earnings}</p>
                      <p className="text-text-muted text-[8px] font-black uppercase tracking-widest">Direct Reward</p>
                    </div>
                    
                    {node.children && node.children.length > 0 && (
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300",
                        expandedNodes.has(node.id) ? "bg-brand-primary text-white rotate-180" : "bg-bg-main text-text-muted"
                      )}>
                        <ChevronDown className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Level 2 Preview */}
                {!expandedNodes.has(node.id) && node.children && node.children.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border-main flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {node.children.slice(0, 3).map((_, i) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-blue-500/10 border-2 border-bg-card flex items-center justify-center text-blue-500">
                          <User className="w-3 h-3" />
                        </div>
                      ))}
                    </div>
                    <p className="text-[10px] font-bold text-text-muted">
                      +{node.children.length} indirect referrals
                    </p>
                  </div>
                )}
              </motion.div>

              <AnimatePresence>
                {expandedNodes.has(node.id) && node.children && (
                  <motion.div
                    initial={{ opacity: 0, height: 0, y: -20 }}
                    animate={{ opacity: 1, height: 'auto', y: 0 }}
                    exit={{ opacity: 0, height: 0, y: -20 }}
                    className="pl-10 pt-4 space-y-3 relative"
                  >
                    {/* Visual Connector Line */}
                    <div className="absolute left-6 top-0 bottom-8 w-1 bg-gradient-to-b from-brand-primary to-blue-500/20 rounded-full" />
                    
                    {node.children.map((child, idx) => (
                      <motion.div 
                        key={child.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className="relative group"
                      >
                        {/* Horizontal Connector */}
                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-4 h-1 bg-blue-500/20 rounded-full" />
                        
                        <div className="p-4 rounded-2xl bg-bg-card/50 border border-border-main hover:border-blue-500/30 transition-all flex items-center justify-between group-hover:bg-bg-card">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                <User className="w-5 h-5" />
                              </div>
                              <div className="absolute -bottom-1 -right-1 px-1 h-4 rounded-full bg-blue-500 text-white text-[7px] font-black flex items-center justify-center border-2 border-bg-card uppercase tracking-tighter">
                                L2
                              </div>
                            </div>
                            <div>
                              <h5 className="text-text-main font-bold text-xs">{child.name}</h5>
                              <p className="text-text-muted text-[9px]">Invited by {node.name}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-blue-500 font-bold text-xs">₹{child.earnings}</p>
                            <p className="text-text-muted text-[8px] font-black uppercase tracking-widest">Bonus</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      <div className="p-6 rounded-3xl bg-bg-main border-2 border-border-main border-dashed flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
          <TrendingUp className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <p className="text-sm font-black text-text-main">Grow your network to earn more!</p>
          <p className="text-xs text-text-muted max-w-xs">
            Every time your friends invite someone, you earn a ₹10 bonus. There's no limit to how much you can earn!
          </p>
        </div>
      </div>
    </div>
  );
}
