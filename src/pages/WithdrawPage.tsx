import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  CreditCard, 
  Smartphone, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  ChevronRight,
  ShieldCheck,
  Wallet,
  Zap,
  Check
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { toast } from 'sonner';
import { cn, formatCurrency } from '../lib/utils';
import SecurityVerification from '../components/SecurityVerification';

export default function WithdrawPage() {
  const { profile, user } = useAuth();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'UPI' | 'Paytm'>('UPI');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  if (!profile) return null;

  const quickAmounts = [200, 500, 1000, 2000, 5000];

  const handleStartWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      setIsVerifying(true);
    } else {
      handleWithdraw(e);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    const withdrawAmount = parseFloat(amount);

    if (withdrawAmount < 200) {
      toast.error('Minimum withdrawal amount is ₹200');
      return;
    }

    if (withdrawAmount > profile.balance) {
      toast.error('Insufficient balance');
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'withdrawals'), {
        userId: user?.uid,
        amount: withdrawAmount,
        method,
        details,
        status: 'pending',
        requestedAt: new Date().toISOString()
      });

      toast.success('Withdrawal request submitted successfully!');
      setAmount('');
      setDetails('');
      setIsVerified(false);
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      toast.error('Failed to submit withdrawal request.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-text-main">Withdraw Funds</h1>
        <p className="text-text-muted">Minimum withdrawal amount is ₹200</p>
      </div>

      {/* Balance Card */}
      <div className="p-6 rounded-3xl bg-bg-card border border-border-main flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center">
            <Wallet className="text-brand-primary w-6 h-6" />
          </div>
          <div>
            <p className="text-text-muted text-xs">Available Balance</p>
            <p className="text-xl font-bold text-text-main">{formatCurrency(profile.balance)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-text-muted text-[10px] font-bold uppercase tracking-widest">Status</p>
          <p className="text-brand-primary text-xs font-bold">Verified Account</p>
        </div>
      </div>

      <form onSubmit={handleStartWithdraw} className="space-y-6">
        {/* Amount Input */}
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-black text-text-muted uppercase tracking-widest text-[10px]">Withdrawal Amount</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl font-black text-brand-primary">₹</span>
              <input
                type="number"
                placeholder="Min ₹200"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-6 bg-bg-card border-2 border-border-main rounded-[2rem] text-3xl font-black text-text-main focus:outline-none focus:border-brand-primary transition-all shadow-sm"
                min="200"
                required
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {quickAmounts.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => setAmount(q.toString())}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-black transition-all border",
                  amount === q.toString()
                    ? "bg-brand-primary text-white border-brand-primary shadow-lg shadow-brand-primary/20"
                    : "bg-bg-card border-border-main text-text-muted hover:border-brand-primary/30"
                )}
              >
                ₹{q}
              </button>
            ))}
          </div>
        </div>

        {/* Method Selection */}
        <div className="space-y-3">
          <label className="text-sm font-black text-text-muted uppercase tracking-widest text-[10px]">Payment Method</label>
          <div className="grid grid-cols-2 gap-4">
            {[
              { id: 'UPI', label: 'UPI Transfer', icon: Zap, sub: 'Fast & Secure', color: 'blue' },
              { id: 'Paytm', label: 'Paytm Wallet', icon: Wallet, sub: 'Instant Credit', color: 'indigo' },
            ].map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id as any)}
                className={cn(
                  "relative p-6 rounded-[2rem] border-2 transition-all group overflow-hidden text-left",
                  method === m.id 
                    ? "border-brand-primary bg-brand-primary/5 shadow-xl shadow-brand-primary/5" 
                    : "border-border-main bg-bg-card hover:border-brand-primary/30"
                )}
              >
                {method === m.id && (
                  <div className="absolute top-4 right-4 w-6 h-6 bg-brand-primary rounded-full flex items-center justify-center text-white">
                    <Check className="w-3.5 h-3.5 stroke-[4]" />
                  </div>
                )}
                
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110",
                  method === m.id ? "bg-brand-primary text-white" : "bg-bg-main text-text-muted"
                )}>
                  <m.icon className="w-6 h-6" />
                </div>
                
                <div className="space-y-1">
                  <p className={cn(
                    "font-black tracking-tight",
                    method === m.id ? "text-text-main" : "text-text-muted"
                  )}>{m.label}</p>
                  <p className="text-[10px] font-bold text-text-muted opacity-60 uppercase tracking-tighter">{m.sub}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Details Input */}
        <div className="space-y-2">
          <label className="text-sm font-black text-text-muted uppercase tracking-widest text-[10px]">
            {method === 'UPI' ? 'Recipient UPI ID' : 'Paytm Account Number'}
          </label>
          <div className="relative group">
            <input
              type="text"
              placeholder={method === 'UPI' ? 'example@upi' : 'Enter 10-digit number'}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              className="w-full px-6 py-5 bg-bg-card border-2 border-border-main rounded-2xl text-text-main font-bold placeholder:text-text-muted/40 focus:outline-none focus:border-brand-primary transition-all shadow-sm"
              required
            />
            {details && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-brand-primary/10">
                <CheckCircle2 className="w-4 h-4 text-brand-primary" />
              </div>
            )}
          </div>
        </div>

        {/* Info Box */}
        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-500 shrink-0" />
          <p className="text-xs text-blue-400 leading-relaxed">
            Withdrawal requests are usually processed within 24-48 hours. Please ensure your payment details are correct.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !amount || !details}
          className="w-full py-6 bg-brand-primary hover:bg-brand-secondary disabled:opacity-50 text-white font-black text-lg rounded-[2rem] shadow-2xl shadow-brand-primary/40 transition-all duration-300 flex items-center justify-center gap-3 active:scale-95"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : (
            <>
              <ShieldCheck className="w-6 h-6" />
              {isVerified ? 'Confirm Withdrawal' : 'Verify & Withdraw'}
            </>
          )}
        </button>
      </form>

      <SecurityVerification 
        isOpen={isVerifying} 
        onClose={() => setIsVerifying(false)} 
        onVerify={(valid) => {
          if (valid) {
            setIsVerified(true);
            toast.success('Verification successful! You can now request withdrawal.');
          }
        }}
      />
    </div>
  );
}
