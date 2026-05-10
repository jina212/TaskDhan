import React, { useState } from 'react';
import { Mail, Smartphone, MapPin, Send, Loader2, MessageSquare, Clock, Globe, Send as Telegram } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useSettings } from '../hooks/useSettings';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const { settings } = useSettings();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success('Message sent successfully! We will get back to you soon.');
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-16 py-12 px-4">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs font-black uppercase tracking-widest">
          <MessageSquare className="w-4 h-4" />
          Support Center
        </div>
        <h1 className="text-5xl font-black text-text-main tracking-tight">How can we <span className="text-brand-primary">help?</span></h1>
        <p className="text-text-muted max-w-xl mx-auto">Have questions or feedback? Our team is dedicated to providing you with the best experience possible.</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Contact Info Card */}
        <div className="lg:col-span-5 space-y-8">
          <div className="p-10 rounded-[3rem] bg-bg-card border border-border-main space-y-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-brand-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-brand-primary/10 transition-colors" />
            
            <div className="space-y-6 relative">
              <h2 className="text-3xl font-black text-text-main tracking-tight">Contact Information</h2>
              <p className="text-text-muted leading-relaxed">
                Reach out to us through any of these channels. We are available weekdays 9:00 - 18:00.
              </p>
            </div>

            <div className="space-y-6 relative">
              {[
                { icon: Mail, label: 'Email Support', value: 'support@taskdhan.com', sub: 'Best for general inquiries' },
                { icon: Smartphone, label: 'Phone Line', value: '+91 98765 43210', sub: 'Talk to our experts' },
                { icon: MapPin, label: 'Global Office', value: 'HSR Layout, Bangalore, India', sub: 'Visit us in person' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-5 p-4 rounded-3xl bg-bg-main/50 border border-border-main/50 hover:border-brand-primary/30 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0">
                    <item.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-text-main font-black">{item.value}</p>
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mt-1 opacity-60">
                      {item.label} • <span className="text-brand-primary">{item.sub}</span>
                    </p>
                  </div>
                </div>
              ))}
              
              {settings?.supportTelegram && (
                <a 
                  href={settings.supportTelegram} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-start gap-5 p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white shrink-0">
                    <Telegram className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-text-main font-black">Join Telegram Support</p>
                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mt-1">
                      Live Chat • <span className="text-text-muted">Community Support</span>
                    </p>
                  </div>
                </a>
              )}
            </div>

            <div className="flex items-center gap-4 pt-6 border-t border-border-main">
              <div className="flex items-center gap-2 text-[10px] font-black text-brand-primary uppercase tracking-widest">
                <Clock className="w-3.5 h-3.5" />
                Response Time: ~2 Hours
              </div>
              <div className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                <Globe className="w-3.5 h-3.5" />
                Available: Worldwide
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form Card */}
        <div className="lg:col-span-7">
          <form 
            onSubmit={handleSubmit} 
            className="p-10 rounded-[3rem] bg-bg-card border border-border-main space-y-8 shadow-2xl relative overflow-hidden"
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g., John Doe"
                  className="w-full px-6 py-5 bg-bg-main border-2 border-border-main rounded-[1.5rem] text-text-main font-bold placeholder:text-text-muted/30 focus:outline-none focus:border-brand-primary transition-all shadow-sm"
                  required
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Email Address</label>
                <input
                  type="email"
                  placeholder="e.g., john@example.com"
                  className="w-full px-6 py-5 bg-bg-main border-2 border-border-main rounded-[1.5rem] text-text-main font-bold placeholder:text-text-muted/30 focus:outline-none focus:border-brand-primary transition-all shadow-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Subject</label>
              <select className="w-full px-6 py-5 bg-bg-main border-2 border-border-main rounded-[1.5rem] text-text-main font-bold focus:outline-none focus:border-brand-primary transition-all shadow-sm">
                <option>General Support</option>
                <option>Withdrawal Issue</option>
                <option>Account Security</option>
                <option>Bug Report</option>
                <option>Business Collaboration</option>
              </select>
            </div>

            <div className="space-y-3">
              <label className="text-[10px] font-black text-text-muted uppercase tracking-widest ml-1">Your Message</label>
              <textarea
                placeholder="Briefly describe how we can assist you..."
                className="w-full px-6 py-5 bg-bg-main border-2 border-border-main rounded-[1.5rem] text-text-main font-bold placeholder:text-text-muted/30 focus:outline-none focus:border-brand-primary transition-all shadow-sm min-h-[160px] resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-6 bg-brand-primary hover:bg-brand-secondary disabled:opacity-50 text-white font-black text-lg rounded-[2rem] shadow-2xl shadow-brand-primary/40 transition-all duration-300 flex items-center justify-center gap-3 active:scale-95 group"
            >
              {loading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
                  Send Message
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
