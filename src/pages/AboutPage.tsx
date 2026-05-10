import React from 'react';
import { motion } from 'framer-motion';
import { Info, ShieldCheck, Mail, Smartphone, MapPin, ChevronRight, Target, Users, Zap, Award, PlayCircle, Trophy } from 'lucide-react';
import { useSettings } from '../hooks/useSettings';

export default function AboutPage() {
  const { settings } = useSettings();
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-16 py-12 px-4">
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-6"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-black uppercase tracking-widest">
          <Info className="w-4 h-4" />
          Who We Are
        </div>
        <h1 className="text-5xl md:text-6xl font-black text-text-main tracking-tight">
          Empowering the <span className="text-brand-primary">Digital Economy</span>
        </h1>
        <p className="text-text-muted text-lg max-w-2xl mx-auto leading-relaxed">
          TaskDhan is India's most trusted micro-tasking platform, helping millions earn extra income by completing simple daily tasks.
        </p>
      </motion.div>

      {/* Mission Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <div className="w-16 h-16 rounded-[2rem] bg-brand-primary/10 flex items-center justify-center text-brand-primary">
            <Target className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-black text-text-main tracking-tight">Our Mission</h2>
          <p className="text-text-muted text-lg leading-relaxed">
            Founded in 2024, our mission is to provide a transparent, secure, and accessible platform for everyone to monetize their spare time. We believe that small tasks can lead to significant financial freedom.
          </p>
          <div className="flex flex-wrap gap-4">
            <div className="px-6 py-3 rounded-2xl bg-bg-card border border-border-main text-center flex-1 min-w-[140px]">
              <p className="text-2xl font-black text-brand-primary">1M+</p>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Active Users</p>
            </div>
            <div className="px-6 py-3 rounded-2xl bg-bg-card border border-border-main text-center flex-1 min-w-[140px]">
              <p className="text-2xl font-black text-brand-primary">₹5Cr+</p>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest">Paid Out</p>
            </div>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative aspect-square md:aspect-auto md:h-[400px] rounded-[3rem] bg-gradient-to-br from-brand-primary/20 to-indigo-500/20 border border-brand-primary/10 overflow-hidden group"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-48 h-48 rounded-[3rem] bg-white/10 backdrop-blur-3xl animate-pulse" />
          </div>
          <motion.div 
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <Trophy className="w-32 h-32 text-brand-primary drop-shadow-[0_0_20px_rgba(255,215,0,0.3)]" />
          </motion.div>
        </motion.div>
      </div>

      {/* Core Values */}
      <div className="space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-black text-text-main tracking-tight">Why TaskDhan?</h2>
          <p className="text-text-muted max-w-xl mx-auto">We've built a platform focused on three core pillars: Trust, Speed, and Growth.</p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            { 
              icon: ShieldCheck, 
              title: 'Total Transparency', 
              desc: 'Every rupee earned is tracked and visible in your real-time ledger.',
              color: 'text-emerald-500',
              bg: 'bg-emerald-500/10'
            },
            { 
              icon: Zap, 
              title: 'Fast Withdrawals', 
              desc: 'Withdraw your earnings instantly to UPI or Paytm with 24/7 processing.',
              color: 'text-indigo-500',
              bg: 'bg-indigo-500/10'
            },
            { 
              icon: Award, 
              title: 'Verified Tasks', 
              desc: 'All sponsorships and quizzes are manualy verified for safety and quality.',
              color: 'text-amber-500',
              bg: 'bg-amber-500/10'
            }
          ].map((val, i) => (
            <motion.div 
              key={i}
              variants={item}
              className="p-8 rounded-[2.5rem] bg-bg-card border border-border-main hover:border-brand-primary/30 transition-all group"
            >
              <div className={`w-14 h-14 rounded-3xl ${val.bg} ${val.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <val.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black text-text-main mb-3">{val.title}</h3>
              <p className="text-text-muted text-sm leading-relaxed">{val.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Tutorial Section */}
      {settings?.ytVideoLink && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-10 rounded-[3.5rem] bg-gradient-to-br from-bg-card to-brand-primary/5 border border-border-main relative overflow-hidden"
        >
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-10">
            <div className="space-y-6 text-center md:text-left">
              <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 mx-auto md:mx-0">
                <PlayCircle className="w-8 h-8" />
              </div>
              <div className="space-y-3">
                <h2 className="text-3xl font-black text-text-main tracking-tight">How it Works?</h2>
                <p className="text-text-muted leading-relaxed max-w-md">
                  Watch our complete video tutorial to understand how to complete tasks, participate in quizzes, and withdraw your earnings safely.
                </p>
              </div>
              <a 
                href={settings.ytVideoLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-600/20 hover:scale-105 active:scale-95 transition-all"
              >
                <PlayCircle className="w-5 h-5" />
                WATCH TUTORIAL
              </a>
            </div>
            
            <div className="w-full md:w-1/2 aspect-video bg-bg-main rounded-3xl border-4 border-border-main shadow-2xl flex items-center justify-center group cursor-pointer relative">
               <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors z-10 rounded-[1.25rem]" />
               <img src="https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg" alt="Tutorial" className="w-full h-full object-cover rounded-[1.25rem] opacity-50 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" />
               <div className="absolute z-20 w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform">
                 <PlayCircle className="w-8 h-8" />
               </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Footer Info */}
      <div className="p-8 rounded-[3rem] bg-bg-card border border-border-main flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="flex -space-x-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="w-12 h-12 rounded-full border-4 border-bg-card bg-bg-main flex items-center justify-center text-text-muted font-bold text-xs">
                U{i}
              </div>
            ))}
          </div>
          <div>
            <p className="text-text-main font-black">Join over 10k users today</p>
            <p className="text-text-muted text-xs font-bold uppercase tracking-widest">Start earning ₹500+ daily</p>
          </div>
        </div>
        <button className="px-8 py-4 bg-brand-primary text-white font-black rounded-2xl shadow-xl shadow-brand-primary/20 hover:scale-105 active:scale-95 transition-all">
          Get Started Now
        </button>
      </div>
    </div>
  );
}
