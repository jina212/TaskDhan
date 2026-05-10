import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Trophy, ArrowRight, ShieldCheck, Zap, Users, Gift } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="space-y-6 max-w-3xl"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-sm font-medium">
          <Zap className="w-4 h-4" />
          <span>Roz Task, Roz Income</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-text-main tracking-tight leading-tight">
          Earn Money by <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary to-brand-secondary">Completing Tasks</span>
        </h1>

        <p className="text-text-muted text-lg md:text-xl max-w-2xl mx-auto">
          Join TaskDhan, India's most trusted micro-task platform. Complete simple tasks, refer friends, and withdraw your earnings instantly.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
          <Link
            to="/login"
            className="w-full sm:w-auto px-8 py-4 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 transition-all duration-300 flex items-center justify-center gap-2 group"
          >
            Get Started Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link
            to="/about"
            className="w-full sm:w-auto px-8 py-4 bg-bg-card hover:bg-bg-card/80 text-text-main font-bold rounded-2xl transition-all duration-300 border border-border-main"
          >
            How it Works
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 w-full max-w-6xl"
      >
        {[
          { icon: ShieldCheck, title: '100% Secure', desc: 'Verified tasks and secure payments via UPI/Paytm.' },
          { icon: Users, title: 'Refer & Earn', desc: 'Earn ₹49 for every friend who joins TaskDhan.' },
          { icon: Gift, title: 'Daily Bonuses', desc: 'Get rewards just for checking in every day.' },
        ].map((feature, i) => (
          <div key={i} className="p-8 rounded-3xl bg-bg-card/50 border border-border-main text-left hover:border-brand-primary/30 transition-colors group">
            <div className="w-12 h-12 rounded-xl bg-brand-primary/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <feature.icon className="text-brand-primary w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-text-main mb-2">{feature.title}</h3>
            <p className="text-text-muted">{feature.desc}</p>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
