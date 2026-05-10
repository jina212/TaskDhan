import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, 
  ShieldCheck, 
  Smartphone, 
  Key, 
  Eye, 
  EyeOff,
  ChevronRight,
  ArrowLeft,
  X,
  Loader2,
  Save,
  ShieldAlert
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { 
  updatePassword, 
  reauthenticateWithCredential, 
  EmailAuthProvider 
} from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../AuthContext';
import { toast } from 'sonner';

export default function SecurityPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);

  const [privacySettings, setPrivacySettings] = useState({
    hideEarnings: profile?.privacy?.hideEarnings || false,
    hideReferrals: profile?.privacy?.hideReferrals || false,
    privateProfile: profile?.privacy?.privateProfile || false,
  });

  const handlePrivacyUpdate = async () => {
    if (!profile) return;
    setSavingPrivacy(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        privacy: privacySettings
      });
      toast.success('Privacy settings updated');
      setIsPrivacyModalOpen(false);
    } catch (error) {
      console.error('Privacy update error:', error);
      toast.error('Failed to update privacy settings');
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user || !user.email) {
      toast.error('User not found or email not set');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      // Re-authenticate user first
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await updatePassword(user, newPassword);
      
      toast.success('Password updated successfully');
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Password change error:', error);
      if (error.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect');
      } else {
        toast.error('Failed to update password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const securityItems = [
    { 
      title: 'Change Password', 
      description: 'Update your account password regularly', 
      icon: Key,
      action: () => setIsPasswordModalOpen(true) 
    },
    { 
      title: 'Two-Factor Authentication', 
      description: 'Add an extra layer of security', 
      icon: Smartphone,
      status: 'Disabled',
      action: () => {} 
    },
    { 
      title: 'Login Activity', 
      description: 'Monitor your active sessions', 
      icon: Eye,
      action: () => {} 
    },
    { 
      title: 'Account Privacy', 
      description: 'Manage your data and visibility', 
      icon: ShieldCheck,
      action: () => setIsPrivacyModalOpen(true) 
    }
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-bg-card border border-border-main text-text-muted hover:text-text-main transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-text-main">Security Settings</h1>
      </div>

      <div className="p-6 rounded-[2rem] bg-brand-primary/10 border border-brand-primary/20 flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl bg-brand-primary flex items-center justify-center text-white">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h3 className="font-bold text-text-main">Account Security Score</h3>
          <p className="text-text-muted text-sm">Your account is 65% secure. Complete setup to reach 100%.</p>
        </div>
      </div>

      <div className="space-y-3">
        {securityItems.map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group p-4 rounded-2xl bg-bg-card border border-border-main hover:border-brand-primary/50 transition-all cursor-pointer"
            onClick={item.action}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-bg-main flex items-center justify-center text-text-muted group-hover:text-brand-primary transition-colors">
                  <item.icon className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-text-main">{item.title}</h4>
                  <p className="text-text-muted text-xs">{item.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {item.status && (
                  <span className="px-2 py-1 bg-red-500/10 text-red-500 text-[10px] font-bold rounded-md uppercase">
                    {item.status}
                  </span>
                )}
                <ChevronRight className="w-5 h-5 text-text-muted group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="p-6 rounded-3xl bg-bg-card border border-border-main mt-8">
        <h3 className="font-bold text-text-main mb-4">Security Tips</h3>
        <ul className="space-y-3">
          {[
            'Use a strong, unique password for your account.',
            'Never share your login credentials with anyone.',
            'Enable 2FA for maximum protection.',
            'Regularly check your login activity for suspicious sessions.'
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-3 text-sm text-text-muted">
              <div className="w-1.5 h-1.5 rounded-full bg-brand-primary mt-1.5 shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      </div>

      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="w-full max-w-md bg-bg-card border border-border-main rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <Key className="w-40 h-40" />
              </div>

              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                      <Lock className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black text-text-main">Change Password</h3>
                  </div>
                  <button 
                    onClick={() => setIsPasswordModalOpen(false)}
                    className="p-2 rounded-xl bg-bg-main border border-border-main text-text-muted hover:text-text-main transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest leading-relaxed">
                    For your security, you must enter your current password to make changes.
                  </p>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black text-text-muted uppercase tracking-widest ml-1">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-4 bg-bg-main border border-border-main rounded-2xl text-text-main text-sm focus:outline-none focus:border-brand-primary transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-text-muted uppercase tracking-widest ml-1">New Password</label>
                    <div className="relative">
                      <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-4 bg-bg-main border border-border-main rounded-2xl text-text-main text-sm focus:outline-none focus:border-brand-primary transition-colors"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords(!showPasswords)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main transition-colors"
                      >
                        {showPasswords ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-text-muted uppercase tracking-widest ml-1">Confirm New Password</label>
                    <div className="relative">
                      <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type={showPasswords ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full pl-12 pr-12 py-4 bg-bg-main border border-border-main rounded-2xl text-text-main text-sm focus:outline-none focus:border-brand-primary transition-colors"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-brand-primary hover:bg-brand-secondary disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-brand-primary/20 transition-all duration-300 flex items-center justify-center gap-2 mt-4"
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Update Password
                      </>
                    )}
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isPrivacyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, y: 100, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.9 }}
              className="w-full max-w-md bg-bg-card border border-border-main rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden"
            >
              <div className="relative z-10 space-y-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h3 className="text-xl font-black text-text-main">Account Privacy</h3>
                  </div>
                  <button 
                    onClick={() => setIsPrivacyModalOpen(false)}
                    className="p-2 rounded-xl bg-bg-main border border-border-main text-text-muted hover:text-text-main transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="space-y-4">
                  {[
                    { id: 'hideEarnings', label: 'Hide Earnings', desc: 'Hide your earnings from your profile' },
                    { id: 'hideReferrals', label: 'Hide Referrals', desc: 'Hide your referral count from others' },
                    { id: 'privateProfile', label: 'Private Profile', desc: 'Only you can see your detailed profile' },
                  ].map((setting) => (
                    <div key={setting.id} className="flex items-center justify-between p-4 rounded-2xl bg-bg-main/50 border border-border-main">
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold text-text-main">{setting.label}</p>
                        <p className="text-[10px] text-text-muted uppercase tracking-widest">{setting.desc}</p>
                      </div>
                      <button
                        onClick={() => setPrivacySettings(prev => ({ 
                          ...prev, 
                          [setting.id]: !prev[setting.id as keyof typeof prev] 
                        }))}
                        className={`w-12 h-6 rounded-full transition-colors relative ${
                          privacySettings[setting.id as keyof typeof privacySettings] ? 'bg-brand-primary' : 'bg-bg-card border border-border-main'
                        }`}
                      >
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${
                          privacySettings[setting.id as keyof typeof privacySettings] ? 'left-7' : 'left-1 bg-text-muted'
                        }`} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handlePrivacyUpdate}
                  disabled={savingPrivacy}
                  className="w-full py-4 bg-brand-primary hover:bg-brand-secondary disabled:opacity-50 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-brand-primary/20 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {savingPrivacy ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Privacy Settings
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
