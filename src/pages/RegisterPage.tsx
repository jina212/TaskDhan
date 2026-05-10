import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, increment, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User, Smartphone, Lock, Share2, Eye, EyeOff, ChevronLeft, Loader2, Settings, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { generateReferralCode } from '../lib/utils';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [referralCodeInput, setReferralCodeInput] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const referralCodeFromUrl = new URLSearchParams(location.search).get('ref');

  // Initialize referral code from URL if present
  React.useEffect(() => {
    if (referralCodeFromUrl) {
      setReferralCodeInput(referralCodeFromUrl);
    }
  }, [referralCodeFromUrl]);

  const handleUserDoc = async (uid: string, name: string, userEmail: string, phone: string, photo: string) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      const referralCode = generateReferralCode();
      const userData: any = {
        uid: uid,
        displayName: name,
        email: userEmail,
        phoneNumber: phone,
        photoURL: photo,
        balance: 0,
        todayEarnings: 0,
        totalEarnings: 0,
        referralEarnings: 0,
        referralCode: referralCode,
        referralCount: 0,
        streak: 0,
        spinsLeft: 3,
        role: 'user',
        createdAt: new Date().toISOString()
      };

      const finalReferralCode = referralCodeInput || referralCodeFromUrl;
      if (finalReferralCode) {
        userData.referredBy = finalReferralCode;
      }

      await setDoc(doc(db, 'users', uid), userData);

      // Handle Referral Bonus
      if (finalReferralCode) {
        try {
          const referrersQuery = query(collection(db, 'users'), where('referralCode', '==', finalReferralCode));
          const referrerSnap = await getDocs(referrersQuery);
          if (!referrerSnap.empty) {
            const referrerDoc = referrerSnap.docs[0];
            await updateDoc(doc(db, 'users', referrerDoc.id), {
              referralCount: increment(1),
              referralEarnings: increment(49),
              balance: increment(49)
            });
            
            await addDoc(collection(db, 'transactions'), {
              userId: referrerDoc.id,
              amount: 49,
              type: 'credit',
              category: 'referral',
              description: 'Referral Bonus',
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error('Error updating referrer:', error);
        }
      }
      return true;
    }
    return false;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    if (!agreeToTerms) {
      toast.error('Please agree to the Terms & Conditions');
      return;
    }

    setLoading(true);

    try {
      // For this app, we combine phone number with a default domain for registration
      // as Firebase Auth usually requires email/password. 
      // In a real production app, you might use Phone Auth.
      const pseudoEmail = `${phoneNumber}@taskdhan.com`;
      const userCredential = await createUserWithEmailAndPassword(auth, pseudoEmail, password);
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: fullName
      });

      await handleUserDoc(user.uid, fullName, pseudoEmail, phoneNumber, '');

      toast.success('Account created successfully!');
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Registration error:', error);
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Phone number already registered. Please login.');
      } else {
        toast.error('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-main flex flex-col">
      {/* Header with Back Button and Illustration */}
      <div className="p-6 pb-2">
        <button 
          onClick={() => navigate(-1)} 
          className="p-2 -ml-2 rounded-full hover:bg-bg-card transition-colors"
        >
          <ChevronLeft className="w-8 h-8 text-text-main" />
        </button>

        <div className="flex flex-col items-center mt-4">
          <div className="relative w-40 h-40">
            {/* Custom Illustration Placeholder */}
            <div className="absolute inset-0 bg-blue-50 rounded-full flex items-center justify-center opacity-60 overflow-hidden">
                <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 opacity-40 blur-2xl" />
            </div>
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
              <div className="w-24 h-32 bg-[#001D3D] rounded-2xl p-4 shadow-xl flex flex-col gap-2 relative overflow-hidden">
                 <div className="w-full h-1 bg-brand-primary opacity-20 rounded-full" />
                 <div className="flex gap-2 items-center">
                    <div className="w-8 h-8 rounded-full bg-rose-200 flex items-center justify-center">
                        <User className="w-5 h-5 text-rose-500 fill-rose-500" />
                    </div>
                    <div className="flex flex-col gap-1 w-full">
                        <div className="w-3/4 h-1 bg-white opacity-40 rounded-full" />
                        <div className="w-1/2 h-1 bg-white opacity-40 rounded-full" />
                    </div>
                 </div>
                 <div className="w-full h-1 bg-white opacity-20 rounded-full mt-2" />
                 <div className="w-full h-1 bg-white opacity-20 rounded-full" />
                 <div className="w-1/2 h-1 bg-white opacity-20 rounded-full" />
                 
                 {/* Decorative Gear Icons */}
                 <Settings className="absolute -top-2 -right-2 w-10 h-10 text-blue-400 opacity-60 animate-spin-slow" />
                 <Settings className="absolute top-4 -right-4 w-6 h-6 text-blue-300 opacity-40 animate-spin-slow-reverse" />
              </div>
            </div>
          </div>
          
          <h1 className="text-4xl font-extrabold text-text-main mt-4">Register</h1>
          <p className="text-text-muted mt-1 font-medium">Create your account</p>
        </div>
      </div>

      {/* Registration Form */}
      <div className="flex-1 bg-white rounded-t-[3rem] mt-4 shadow-2xl p-8 pb-12">
        <form onSubmit={handleRegister} className="space-y-6 max-w-md mx-auto">
          {/* Full Name */}
          <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-600 transition-transform group-focus-within:scale-110">
              <User className="w-6 h-6" />
            </div>
            <input
              type="text"
              placeholder="Full Name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-white border border-gray-200 rounded-full text-text-main font-semibold focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all placeholder:text-gray-400 placeholder:font-medium"
              required
            />
          </div>

          {/* Mobile Number */}
          <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-600 transition-transform group-focus-within:scale-110">
              <Smartphone className="w-6 h-6" />
            </div>
            <input
              type="tel"
              placeholder="Mobile Number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-white border border-gray-200 rounded-full text-text-main font-semibold focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all placeholder:text-gray-400 placeholder:font-medium"
              required
            />
          </div>

          {/* Password */}
          <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-600 transition-transform group-focus-within:scale-110">
              <ClipboardList className="w-6 h-6" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-16 pr-14 py-5 bg-white border border-gray-200 rounded-full text-text-main font-semibold focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all placeholder:text-gray-400 placeholder:font-medium"
              required
              minLength={6}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-primary transition-colors"
            >
              {showPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
            </button>
          </div>

          {/* Confirm Password */}
          <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-600 transition-transform group-focus-within:scale-110">
                <ClipboardList className="w-6 h-6" />
            </div>
            <input
              type={showConfirmPassword ? "text" : "confirm-password"}
              placeholder="Please enter confirm password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-16 pr-14 py-5 bg-white border border-gray-200 rounded-full text-text-main font-semibold focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all placeholder:text-gray-400 placeholder:font-medium"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-primary transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-6 h-6" /> : <Eye className="w-6 h-6" />}
            </button>
          </div>

          {/* Referral Code (Optional) */}
          <div className="relative group">
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-600 transition-transform group-focus-within:scale-110">
              <Share2 className="w-6 h-6" />
            </div>
            <input
              type="text"
              placeholder="Referral Code (Optional)"
              value={referralCodeInput}
              onChange={(e) => setReferralCodeInput(e.target.value)}
              className="w-full pl-16 pr-6 py-5 bg-white border border-gray-200 rounded-full text-text-main font-semibold focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary/20 transition-all placeholder:text-gray-400 placeholder:font-medium"
            />
          </div>

          {/* Terms and Conditions Checkbox */}
          <div className="flex items-center gap-3 px-2">
            <input
              type="checkbox"
              id="terms"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="w-5 h-5 border-2 border-gray-300 rounded focus:ring-brand-primary text-brand-primary cursor-pointer"
            />
            <label htmlFor="terms" className="text-sm font-semibold text-text-main cursor-pointer select-none">
              I agree with <Link to="/terms" className="text-brand-primary hover:underline">Terms & condition</Link>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-[#0EA5B9] hover:brightness-110 active:scale-[0.98] text-white font-black text-xl uppercase tracking-widest rounded-2xl shadow-xl shadow-[#0EA5B9]/30 transition-all flex items-center justify-center gap-2 group"
          >
            {loading ? <Loader2 className="w-8 h-8 animate-spin" /> : 'SUBMIT'}
          </button>
        </form>
      </div>

      {/* Bottom Sign In Bar */}
      <div className="bg-[#0EA5B9] py-6 text-center text-white">
        <p className="font-semibold tracking-wide">
          Already have an account?{' '}
          <Link to="/login" className="font-black underline transition-transform inline-block hover:scale-105 active:scale-95">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
