import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Coins, 
  Crown, 
  Zap, 
  CheckCircle2, 
  ShieldCheck, 
  Star, 
  Gift, 
  CreditCard, 
  ArrowRight,
  Sparkles,
  X,
  Loader2
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { cn, formatCurrency } from '../lib/utils';
import { toast } from 'sonner';
import { doc, updateDoc, increment, arrayUnion, collection, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  value: number;
  type: 'coins' | 'premium' | 'vip' | 'membership';
  icon: React.ReactNode;
  color: string;
  benefits?: string[];
}

const STORE_ITEMS: StoreItem[] = [
  {
    id: 'coins_100',
    name: '100 Coins',
    description: 'Basic coin pack for mystery boxes',
    price: 10,
    value: 100,
    type: 'coins',
    icon: <Coins className="w-6 h-6 text-yellow-500" />,
    color: 'from-yellow-500/20 to-orange-500/20'
  },
  {
    id: 'premium_box',
    name: 'Premium Box',
    description: 'Unlock high-reward premium boxes',
    price: 50,
    value: 1,
    type: 'premium',
    icon: <Gift className="w-6 h-6 text-purple-500" />,
    color: 'from-purple-500/20 to-pink-500/20'
  },
  {
    id: 'vip_access',
    name: 'VIP Access',
    description: 'Get exclusive VIP tasks and rewards',
    price: 99,
    value: 1,
    type: 'vip',
    icon: <ShieldCheck className="w-6 h-6 text-blue-500" />,
    color: 'from-blue-500/20 to-indigo-500/20'
  }
];

export default function StorePage() {
  const { profile } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);

  if (!profile) return null;

  const handlePurchase = async (item: StoreItem) => {
    setSelectedItem(item);
    setIsProcessing(true);

    // Simulate Razorpay/UPI Payment
    setTimeout(async () => {
      try {
        const userRef = doc(db, 'users', profile.uid);
        const transactionRef = doc(collection(db, 'transactions'));

        const updates: any = {};
        let description = '';

        if (item.type === 'coins') {
          updates.coins = increment(item.value);
          description = `Purchased ${item.value} coins`;
        } else if (item.type === 'premium') {
          updates.isPremium = true;
          description = 'Purchased Premium Box Access';
        } else if (item.type === 'vip') {
          updates.isVIP = true;
          description = 'Purchased VIP Access';
        } else if (item.type === 'membership') {
          updates.isPremium = true;
          const expiry = new Date();
          expiry.setMonth(expiry.getMonth() + 1);
          updates.premiumExpiry = expiry.toISOString();
          description = 'Purchased Monthly Premium Membership';
        }

        await updateDoc(userRef, updates);
        
        // Add transaction
        await setDoc(transactionRef, {
          userId: profile.uid,
          amount: item.price,
          currency: 'INR',
          type: 'debit',
          category: 'purchase',
          description,
          timestamp: new Date().toISOString()
        });

        toast.success('Purchase Successful!', {
          description: `You have successfully purchased ${item.name}`
        });
        setIsProcessing(false);
        setSelectedItem(null);
      } catch (error) {
        console.error('Purchase error:', error);
        toast.error('Purchase failed. Please try again.');
        setIsProcessing(false);
      }
    }, 2000);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-text-main tracking-tight">TaskDhan Store</h1>
        <p className="text-text-muted">Upgrade your experience and earn faster</p>
      </div>

      {/* Premium Membership Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white shadow-2xl overflow-hidden group"
      >
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
          <Crown className="w-48 h-48" />
        </div>
        
        <div className="relative z-10 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Crown className="w-6 h-6 text-yellow-300" />
            </div>
            <div>
              <h2 className="text-2xl font-black">Premium Membership</h2>
              <p className="text-white/70 text-sm">The ultimate TaskDhan experience</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: <Zap className="w-4 h-4" />, text: 'No Ads' },
              { icon: <Star className="w-4 h-4" />, text: 'Extra Coins' },
            ].map((benefit, i) => (
              <div key={i} className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/10">
                {benefit.icon}
                <span className="text-xs font-bold">{benefit.text}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between pt-4">
            <div>
              <p className="text-white/70 text-xs font-bold uppercase tracking-widest">Monthly Plan</p>
              <p className="text-3xl font-black">₹199<span className="text-sm font-normal opacity-70">/month</span></p>
            </div>
            <button
              onClick={() => handlePurchase({
                id: 'premium_monthly',
                name: 'Premium Membership',
                description: 'Monthly premium subscription',
                price: 199,
                value: 1,
                type: 'membership',
                icon: <Crown />,
                color: ''
              })}
              className="px-8 py-4 bg-white text-indigo-600 font-black rounded-2xl shadow-xl hover:scale-105 transition-all flex items-center gap-2"
            >
              Get Premium <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Store Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {STORE_ITEMS.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-6 rounded-[2rem] bg-bg-card border border-border-main hover:border-brand-primary transition-all group"
          >
            <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br", item.color)}>
              {item.icon}
            </div>
            <div className="space-y-2 mb-6">
              <h3 className="text-lg font-black text-text-main">{item.name}</h3>
              <p className="text-text-muted text-sm leading-relaxed">{item.description}</p>
            </div>
            <button
              onClick={() => handlePurchase(item)}
              className="w-full py-4 bg-bg-main border border-border-main hover:border-brand-primary group-hover:bg-brand-primary group-hover:text-white text-text-main font-black rounded-2xl transition-all flex items-center justify-center gap-2"
            >
              Buy for ₹{item.price}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Payment Processing Modal */}
      <AnimatePresence>
        {isProcessing && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-bg-card border border-border-main rounded-[2.5rem] p-8 text-center space-y-6 shadow-2xl"
            >
              <div className="w-20 h-20 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto">
                <Loader2 className="w-10 h-10 text-brand-primary animate-spin" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-black text-text-main">Processing Payment</h3>
                <p className="text-text-muted text-sm">Please do not close this window while we confirm your purchase of {selectedItem?.name}</p>
              </div>
              <div className="flex items-center justify-center gap-4 pt-4">
                <div className="flex items-center gap-2 text-text-muted text-xs font-bold uppercase tracking-widest">
                  <ShieldCheck className="w-4 h-4" />
                  Secure UPI
                </div>
                <div className="w-px h-4 bg-border-main" />
                <div className="flex items-center gap-2 text-text-muted text-xs font-bold uppercase tracking-widest">
                  <CreditCard className="w-4 h-4" />
                  Razorpay
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Trust Badges */}
      <div className="flex flex-wrap justify-center gap-8 pt-8 opacity-50">
        <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-default">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/UPI-Logo-vector.svg/1200px-UPI-Logo-vector.svg.png" alt="UPI" className="h-4" referrerPolicy="no-referrer" />
        </div>
        <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-default">
          <img src="https://razorpay.com/assets/razorpay-glyph.svg" alt="Razorpay" className="h-6" referrerPolicy="no-referrer" />
        </div>
        <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all cursor-default">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Paytm_Logo_%28standalone%29.svg/1200px-Paytm_Logo_%28standalone%29.svg.png" alt="Paytm" className="h-4" referrerPolicy="no-referrer" />
        </div>
      </div>
    </div>
  );
}
