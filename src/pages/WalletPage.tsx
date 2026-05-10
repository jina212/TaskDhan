import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  ChevronRight, 
  CreditCard, 
  Zap,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trophy,
  Users,
  Gift,
  X,
  Calendar,
  ShoppingBag,
  PlayCircle,
  Network,
  Download,
  ExternalLink,
  ShieldCheck,
  Receipt
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, where, orderBy, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'sonner';
import { useAuth } from '../AuthContext';
import { Transaction } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { AnimatePresence } from 'framer-motion';

export default function WalletPage() {
  const { profile, user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchTransactions = async () => {
      try {
        const q = query(
          collection(db, 'transactions'),
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(10)
        );
        const snapshot = await getDocs(q);
        const txs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        setTransactions(txs);
        
        // Mock data if empty
        if (txs.length === 0) {
          setTransactions([
            { id: '1', userId: user.uid, amount: 5, type: 'credit', category: 'bonus', description: 'Daily Check-in Bonus', timestamp: new Date().toISOString() },
            { id: '2', userId: user.uid, amount: 49, type: 'credit', category: 'referral', description: 'Referral Bonus (User: IB5O3F)', timestamp: new Date(Date.now() - 3600000).toISOString() },
            { id: '3', userId: user.uid, amount: 25, type: 'credit', category: 'mystery_box', description: 'Mystery Box Reward', timestamp: new Date(Date.now() - 7200000).toISOString() },
            { id: '4', userId: user.uid, amount: 10, type: 'credit', category: 'task', description: 'App Install Reward', timestamp: new Date(Date.now() - 86400000).toISOString() },
            { id: '5', userId: user.uid, amount: 200, type: 'debit', category: 'withdrawal', description: 'Withdrawal to UPI', timestamp: new Date(Date.now() - 172800000).toISOString() },
          ]);
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [user]);

  if (!profile) return null;

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'task': return Trophy;
      case 'referral': return Users;
      case 'bonus': return Gift;
      case 'withdrawal': return CreditCard;
      case 'mystery_box': return Gift;
      case 'spin': return Zap;
      case 'purchase': return ShoppingBag;
      case 'ad_reward': return PlayCircle;
      case 'affiliate': return Network;
      default: return History;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'task': return 'text-blue-500 bg-blue-500/10';
      case 'referral': return 'text-purple-500 bg-purple-500/10';
      case 'bonus': return 'text-emerald-500 bg-emerald-500/10';
      case 'withdrawal': return 'text-red-500 bg-red-500/10';
      case 'mystery_box': return 'text-brand-primary bg-brand-primary/10';
      case 'spin': return 'text-amber-500 bg-amber-500/10';
      case 'purchase': return 'text-orange-500 bg-orange-500/10';
      case 'ad_reward': return 'text-rose-500 bg-rose-500/10';
      case 'affiliate': return 'text-cyan-500 bg-cyan-500/10';
      default: return 'text-text-muted bg-bg-main';
    }
  };

  return (
    <div className="space-y-8">
      {/* Wallet Card ... (rest of the card code) */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-8 rounded-[2.5rem] bg-bg-card border border-border-main relative overflow-hidden"
      >
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-primary/10 blur-[80px] rounded-full" />
        
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-brand-primary flex items-center justify-center shadow-lg shadow-brand-primary/20">
            <Wallet className="text-white w-8 h-8" />
          </div>
          <div>
            <p className="text-text-muted text-sm font-medium">Available Balance</p>
            <h2 className="text-4xl font-black text-text-main mt-1">{formatCurrency(profile.balance)}</h2>
          </div>
          
          <div className="flex gap-4 w-full pt-4">
            <Link
              to="/withdraw"
              className="flex-1 py-4 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <ArrowUpRight className="w-5 h-5" />
              Withdraw
            </Link>
            <Link
              to="/store"
              className="flex-1 py-4 bg-bg-main hover:bg-border-main text-text-main font-bold rounded-2xl transition-all duration-300 flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              Recharge
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Transaction History */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
            <History className="w-5 h-5 text-brand-primary" />
            Recent Transactions
          </h3>
        </div>

        <div className="space-y-3">
          {transactions.map((tx, i) => {
            const Icon = getCategoryIcon(tx.category);
            const colorClass = getCategoryColor(tx.category);
            
            return (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedTx(tx)}
                className="p-4 rounded-2xl bg-bg-card border border-border-main flex items-center justify-between hover:border-brand-primary/50 cursor-pointer transition-all active:scale-[0.98]"
              >
                <div className="flex items-center gap-4">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", colorClass)}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-text-main font-bold text-sm">{tx.description}</h4>
                    <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">
                      {new Date(tx.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} • {tx.category}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-base font-black tracking-tight",
                    tx.type === 'credit' ? "text-brand-primary" : "text-red-500"
                  )}>
                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount}
                  </p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5 text-emerald-500" />
                    <span className="text-[9px] text-text-muted font-bold uppercase tracking-wider">Completed</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {selectedTx && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedTx(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-bg-card border border-border-main rounded-[2.5rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)]"
            >
              {/* Premium Background Pattern */}
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-brand-primary/10 to-transparent pointer-events-none" />
              
              <div className="p-8 relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg", getCategoryColor(selectedTx.category))}>
                    {React.createElement(getCategoryIcon(selectedTx.category), { className: "w-7 h-7" })}
                  </div>
                  <button 
                    onClick={() => setSelectedTx(null)}
                    className="p-3 rounded-full bg-bg-main/50 backdrop-blur-md text-text-muted hover:text-text-main hover:bg-bg-main transition-all duration-300 border border-border-main/50"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-center space-y-2 mb-8">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border", getCategoryColor(selectedTx.category).replace('bg-', 'border-').replace('/10', '/30'))}>
                      {selectedTx.category}
                    </span>
                  </div>
                  <h2 className={cn(
                    "text-5xl font-black tracking-tighter",
                    selectedTx.type === 'credit' ? "text-brand-primary" : "text-red-500"
                  )}>
                    {selectedTx.type === 'credit' ? '+' : '-'}₹{selectedTx.amount}
                  </h2>
                  <p className="text-text-main font-bold text-lg leading-tight">{selectedTx.description}</p>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 rounded-2xl bg-bg-main border border-border-main">
                      <div className="flex items-center gap-2 text-text-muted mb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Date</span>
                      </div>
                      <p className="text-sm font-bold text-text-main">
                        {new Date(selectedTx.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-bg-main border border-border-main">
                      <div className="flex items-center gap-2 text-text-muted mb-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-black uppercase tracking-wider">Time</span>
                      </div>
                      <p className="text-sm font-bold text-text-main">
                        {new Date(selectedTx.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-bg-main border border-border-main space-y-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-text-muted">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span className="text-xs font-bold uppercase tracking-wider text-[10px]">Status</span>
                      </div>
                      <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black">
                        COMPLETED
                      </div>
                    </div>
                    
                    <div className="pt-4 border-t border-dashed border-border-main">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2 text-text-muted">
                          <Receipt className="w-4 h-4" />
                          <span className="text-xs font-bold uppercase tracking-wider text-[10px]">Transaction ID</span>
                        </div>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(selectedTx.id);
                            toast.success('Transaction ID copied!');
                          }}
                          className="text-brand-primary p-1 hover:bg-brand-primary/10 rounded-md transition-colors"
                        >
                          <ArrowDownLeft className="w-4 h-4 rotate-[135deg]" />
                        </button>
                      </div>
                      <p className="text-[11px] font-mono text-text-muted truncate bg-bg-card p-2 rounded-lg border border-border-main/50">
                        {selectedTx.id}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 py-4 bg-bg-main border border-border-main hover:bg-border-main text-text-main text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2">
                      <ExternalLink className="w-4 h-4 text-text-muted" />
                      Get Help
                    </button>
                    <button 
                      onClick={() => setSelectedTx(null)}
                      className="flex-1 py-4 bg-brand-primary text-white text-sm font-bold rounded-2xl shadow-lg shadow-brand-primary/20 transition-all hover:scale-[1.02]"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
