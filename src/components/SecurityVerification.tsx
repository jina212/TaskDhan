import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';

interface SecurityVerificationProps {
  onVerify: (isValid: boolean) => void;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export default function SecurityVerification({ onVerify, isOpen, onClose, title = "Security Verification" }: SecurityVerificationProps) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const generatePuzzle = () => {
    setNum1(Math.floor(Math.random() * 10) + 1);
    setNum2(Math.floor(Math.random() * 10) + 1);
    setUserAnswer('');
    setStatus('idle');
  };

  useEffect(() => {
    if (isOpen) {
      generatePuzzle();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const answer = parseInt(userAnswer);
    if (answer === num1 + num2) {
      setStatus('success');
      setTimeout(() => {
        onVerify(true);
        onClose();
      }, 1000);
    } else {
      setStatus('error');
      setTimeout(() => setStatus('idle'), 2000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-sm bg-bg-card border border-border-main rounded-[2rem] p-8 shadow-2xl"
          >
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-brand-primary/10 flex items-center justify-center mx-auto text-brand-primary">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-text-main">{title}</h3>
                <p className="text-text-muted text-sm">Please solve this puzzle to continue</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6 pt-4">
                <div className="flex items-center justify-center gap-4 text-3xl font-black text-text-main">
                  <span className="w-12 h-12 rounded-xl bg-bg-main border border-border-main flex items-center justify-center">{num1}</span>
                  <span className="text-brand-primary">+</span>
                  <span className="w-12 h-12 rounded-xl bg-bg-main border border-border-main flex items-center justify-center">{num2}</span>
                  <span className="text-brand-primary">=</span>
                  <input
                    type="number"
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    placeholder="?"
                    className={cn(
                      "w-16 h-16 rounded-xl bg-bg-main border-2 text-center focus:outline-none transition-all",
                      status === 'idle' && "border-border-main focus:border-brand-primary",
                      status === 'success' && "border-emerald-500 text-emerald-500",
                      status === 'error' && "border-red-500 text-red-500 animate-shake"
                    )}
                    autoFocus
                    required
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={generatePuzzle}
                    className="p-4 rounded-xl bg-bg-main border border-border-main text-text-muted hover:text-text-main transition-colors"
                  >
                    <RefreshCw className="w-5 h-5" />
                  </button>
                  <button
                    type="submit"
                    className={cn(
                      "flex-1 py-4 font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-2",
                      status === 'success' 
                        ? "bg-emerald-500 text-white" 
                        : "bg-brand-primary hover:bg-brand-secondary text-white shadow-lg shadow-brand-primary/20"
                    )}
                  >
                    {status === 'success' ? (
                      <><CheckCircle2 className="w-5 h-5" /> Verified</>
                    ) : status === 'error' ? (
                      <><AlertCircle className="w-5 h-5" /> Try Again</>
                    ) : (
                      "Verify"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
