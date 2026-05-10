import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LogOut, Loader2, Trophy } from 'lucide-react';
import { auth } from '../firebase';
import { toast } from 'sonner';

export default function LogoutPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const performLogout = async () => {
      try {
        // Small delay for visual effect
        await new Promise(resolve => setTimeout(resolve, 1500));
        await auth.signOut();
        toast.success('Logged out successfully');
        navigate('/login');
      } catch (error) {
        console.error('Logout error:', error);
        toast.error('Logout failed');
        navigate('/dashboard');
      }
    };

    performLogout();
  }, [navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-12 rounded-[3rem] bg-bg-card border border-border-main shadow-2xl relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-primary/10 blur-[100px] rounded-full" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-brand-primary/10 blur-[100px] rounded-full" />

        <div className="relative z-10 space-y-6">
          <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto shadow-lg shadow-red-500/5">
            <LogOut className="text-red-500 w-10 h-10" />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-3xl font-black text-text-main tracking-tight">Logging Out...</h2>
            <p className="text-text-muted font-medium">We're safely signing you out of your account.</p>
          </div>

          <div className="flex flex-col items-center gap-4 pt-4">
            <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
            <div className="flex items-center gap-2 px-4 py-2 bg-bg-main rounded-full border border-border-main">
              <Trophy className="w-4 h-4 text-brand-primary" />
              <span className="text-xs font-bold text-text-main uppercase tracking-widest">TaskDhan Secure</span>
            </div>
          </div>
        </div>
      </motion.div>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 text-text-muted text-sm font-medium"
      >
        Thank you for using TaskDhan. See you soon! 👋
      </motion.p>
    </div>
  );
}
