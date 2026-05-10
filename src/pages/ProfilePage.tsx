import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, 
  Smartphone, 
  Mail, 
  ShieldCheck, 
  ChevronRight, 
  LogOut, 
  Edit2, 
  Bell, 
  HelpCircle, 
  Info,
  Lock,
  ExternalLink,
  Save,
  X,
  Loader2,
  Camera,
  Upload,
  Crown,
  CheckCircle2,
  Copy,
  Zap,
  ArrowUpRight,
  TrendingUp,
  Award,
  Trophy,
  Receipt
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth';
import { useAuth } from '../AuthContext';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

export default function ProfilePage() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!profile) return null;

  const membershipTier = profile.totalEarnings >= 5000 ? 'Platinum' : profile.totalEarnings >= 1000 ? 'Gold' : 'Standard';
  const tierColor = membershipTier === 'Platinum' ? 'text-blue-400' : membershipTier === 'Gold' ? 'text-amber-400' : 'text-slate-400';
  const tierBg = membershipTier === 'Platinum' ? 'bg-blue-400/10' : membershipTier === 'Gold' ? 'bg-amber-400/10' : 'bg-slate-400/10';

  const copyReferral = () => {
    navigator.clipboard.writeText(profile.referralCode);
    toast.success('Referral code copied!');
  };

  const handleLogout = () => {
    navigate('/logout');
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!displayName.trim()) {
      toast.error('Display name cannot be empty');
      return;
    }

    setSaving(true);
    try {
      // Update Auth Profile
      await updateProfile(user, { displayName: displayName.trim() });

      // Update Firestore Profile
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName.trim()
      });
      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size should be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(storage, `profiles/${user.uid}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      
      // Update Auth Profile
      await updateProfile(user, { photoURL: downloadURL });

      // Update Firestore Profile
      await updateDoc(doc(db, 'users', user.uid), {
        photoURL: downloadURL
      });
      
      toast.success('Profile picture updated!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const menuItems = [
    { label: 'Edit Profile', icon: Edit2, onClick: () => setIsEditing(true) },
    { label: 'Notifications', icon: Bell, path: '/notifications' },
    { label: 'Security', icon: Lock, path: '/security' },
    { label: 'Help & Support', icon: HelpCircle, path: '/contact' },
    { label: 'About Us', icon: Info, path: '/about' },
    { label: 'Privacy Policy', icon: ShieldCheck, path: '/privacy' },
  ];

  return (
    <div className="space-y-8">
      <AnimatePresence mode="wait">
        {!isEditing ? (
          <motion.div
            key="view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Profile Hero Card */}
            <div className="relative p-8 rounded-[2.5rem] bg-bg-card border border-border-main overflow-hidden shadow-2xl">
              {/* Abstract decorative elements */}
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-brand-primary/5 blur-[100px] rounded-full" />
              <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-500/5 blur-[100px] rounded-full" />
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="relative group mb-6">
                  <div className="w-28 h-28 rounded-[2.5rem] bg-bg-main border-2 border-brand-primary p-1 shadow-2xl">
                    <div className="w-full h-full rounded-[2rem] overflow-hidden relative bg-bg-card flex items-center justify-center">
                      {uploading ? (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
                          <Loader2 className="w-8 h-8 text-white animate-spin" />
                        </div>
                      ) : null}
                      {profile.photoURL ? (
                        <img 
                          src={profile.photoURL} 
                          alt={profile.displayName} 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <User className="text-text-muted w-14 h-14" />
                      )}
                      
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-300"
                      >
                        <Camera className="w-8 h-8 text-white" />
                      </button>
                    </div>
                  </div>
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*"
                  />

                  {/* Level Badge */}
                  <div className={cn(
                    "absolute -bottom-2 -right-2 px-3 py-1 rounded-full text-[10px] font-black border-2 border-bg-card shadow-lg flex items-center gap-1",
                    tierBg, tierColor
                  )}>
                    <Trophy className="w-2.5 h-2.5" />
                    {membershipTier}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <h2 className="text-3xl font-black text-text-main tracking-tight">{profile.displayName}</h2>
                    <ShieldCheck className="w-5 h-5 text-brand-primary fill-brand-primary/10" />
                  </div>
                  <p className="text-text-muted text-sm font-bold opacity-70">
                    ID: {profile.uid.slice(0, 8).toUpperCase()} • VIP Member
                  </p>
                </div>

                <div className="flex items-center gap-2 mt-4 px-4 py-1.5 bg-bg-main border border-border-main rounded-full">
                  <p className="text-[10px] font-black text-text-muted uppercase tracking-widest px-2 border-r border-border-main">Code</p>
                  <p className="text-xs font-black text-brand-primary tracking-widest px-1">{profile.referralCode}</p>
                  <button 
                    onClick={copyReferral}
                    className="p-1.5 hover:bg-brand-primary/10 rounded-full transition-colors"
                  >
                    <Copy className="w-3 h-3 text-text-muted" />
                  </button>
                </div>
              </div>
            </div>

            {/* Account Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 rounded-3xl bg-bg-card border border-border-main space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Total Earnings</p>
                    <p className="text-xl font-black text-text-main">₹{profile.totalEarnings.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border-main">
                  <p className="text-[10px] font-bold text-text-muted">Today</p>
                  <p className="text-sm font-black text-emerald-500">+₹{profile.todayEarnings}</p>
                </div>
              </div>

              <div className="p-6 rounded-3xl bg-bg-card border border-border-main space-y-4 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-3 opacity-5 -rotate-12 transition-transform group-hover:rotate-0">
                  <Award className="w-16 h-16 text-brand-primary" />
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                    <Zap className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-text-muted uppercase tracking-wider">Referral Stats</p>
                    <p className="text-xl font-black text-text-main">{profile.referralCount}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border-main">
                  <p className="text-[10px] font-bold text-text-muted">Bonus</p>
                  <p className="text-sm font-black text-brand-primary">₹{profile.referralEarnings}</p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <Link
                to="/withdraw"
                className="flex-1 p-4 bg-brand-primary text-white rounded-2xl flex flex-col items-center gap-1 shadow-lg shadow-brand-primary/20 hover:scale-[1.02] transition-transform active:scale-100"
              >
                <ArrowUpRight className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">Withdraw</span>
              </Link>
              <Link
                to="/wallet"
                className="flex-1 p-4 bg-bg-card border border-border-main text-text-main rounded-2xl flex flex-col items-center gap-1 hover:border-brand-primary/30 transition-all active:scale-100"
              >
                <Receipt className="w-5 h-5" />
                <span className="text-[10px] font-black uppercase tracking-widest">History</span>
              </Link>
            </div>

            {/* Main Menu List */}
            <div className="space-y-3 pt-2">
              <p className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-4">Account Settings</p>
              <div className="space-y-2">
                {menuItems.map((item, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ x: 4 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    {item.path ? (
                      <Link
                        to={item.path}
                        className="flex items-center justify-between p-5 rounded-[1.5rem] bg-bg-card border border-border-main hover:border-brand-primary/30 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-bg-main flex items-center justify-center text-text-muted group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all">
                            <item.icon className="w-5 h-5" />
                          </div>
                          <span className="text-text-main font-bold text-sm">{item.label}</span>
                        </div>
                        <ChevronRight className="text-text-muted w-4 h-4 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                      </Link>
                    ) : (
                      <button
                        onClick={item.onClick}
                        className="w-full flex items-center justify-between p-5 rounded-[1.5rem] bg-bg-card border border-border-main hover:border-brand-primary/30 transition-all group"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-11 h-11 rounded-xl bg-bg-main flex items-center justify-center text-text-muted group-hover:bg-brand-primary/10 group-hover:text-brand-primary transition-all">
                            <item.icon className="w-5 h-5" />
                          </div>
                          <span className="text-text-main font-bold text-sm">{item.label}</span>
                        </div>
                        <ChevronRight className="text-text-muted w-4 h-4 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                      </button>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="edit"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-text-main">Edit Profile</h2>
              <button 
                onClick={() => setIsEditing(false)}
                className="p-2 rounded-xl bg-bg-card border border-border-main text-text-muted hover:text-text-main transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted">Your Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      placeholder="Enter your name"
                      className="w-full pl-12 pr-4 py-4 bg-bg-card border border-border-main rounded-2xl text-text-main focus:outline-none focus:border-brand-primary transition-colors"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted">Phone Number (Verified)</label>
                  <div className="relative">
                    <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
                    <input
                      type="text"
                      value={profile.phoneNumber}
                      disabled
                      className="w-full pl-12 pr-4 py-4 bg-bg-card/50 border border-border-main rounded-2xl text-text-muted cursor-not-allowed opacity-70"
                    />
                  </div>
                  <p className="text-[10px] text-text-muted flex items-center gap-1 px-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    Phone number cannot be changed for security reasons.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-4 bg-bg-card border border-border-main text-text-main font-bold rounded-2xl hover:bg-bg-main transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || displayName === profile.displayName}
                  className="flex-1 py-4 bg-brand-primary hover:bg-brand-secondary disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 transition-all duration-300 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Changes</>}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Button */}
      {!isEditing && (
        <div className="px-4">
          <button
            onClick={handleLogout}
            className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-black text-xs uppercase tracking-widest rounded-2xl transition-all duration-300 flex items-center justify-center gap-2 border border-red-500/20"
          >
            <LogOut className="w-4 h-4" />
            Sign Out Securely
          </button>
        </div>
      )}

      {/* Version Info */}
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-3 h-3 text-brand-primary" />
          <p className="text-[10px] font-black text-text-muted uppercase tracking-widest">Secured by FireAuth v2.4</p>
        </div>
        <p className="text-center text-text-muted text-[10px] opacity-40 font-medium">TaskDhan v1.0.0 • Made with ❤️ in India</p>
      </div>
    </div>
  );
}
