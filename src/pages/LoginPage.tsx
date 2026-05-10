import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { signInAnonymously, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, query, where, getDocs, updateDoc, increment, addDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Smartphone, ShieldCheck, ArrowRight, Loader2, Trophy, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { generateReferralCode, cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { useEffect, useCallback } from 'react';

export default function LoginPage() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginMethod, setLoginMethod] = useState<'phone' | 'email'>('phone');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const referralCodeFromUrl = new URLSearchParams(location.search).get('ref');

  const handleUserDoc = useCallback(async (uid: string, phone: string) => {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) {
      const referralCode = generateReferralCode();
      const userData: any = {
        uid: uid,
        displayName: auth.currentUser?.displayName || `User ${phone.slice(-4) || uid.slice(-4)}`,
        photoURL: auth.currentUser?.photoURL || '',
        phoneNumber: phone || '',
        balance: 0,
        todayEarnings: 0,
        totalEarnings: 0,
        referralEarnings: 0,
        referralCode: referralCode,
        referralCount: 0,
        streak: 0,
        spinsLeft: 3,
        role: auth.currentUser?.email === 'lko446661@gmail.com' ? 'admin' : 'user',
        createdAt: new Date().toISOString()
      };

      if (referralCodeFromUrl) {
        userData.referredBy = referralCodeFromUrl;
        try {
          const referrersQuery = query(collection(db, 'users'), where('referralCode', '==', referralCodeFromUrl));
          const referrerSnap = await getDocs(referrersQuery);
          if (!referrerSnap.empty) {
            const referrerDoc = referrerSnap.docs[0];
            const referrerData = referrerDoc.data();
            userData.referrerUid = referrerDoc.id;
            if (referrerData.referrerUid) {
              userData.referrerUidL2 = referrerData.referrerUid;
            }
          }
        } catch (err) {
          console.error("Error setting referrer UIDs:", err);
        }
      }

      await setDoc(doc(db, 'users', uid), userData);

      // If referred, update the referrer's count and earnings (₹49)
      if (referralCodeFromUrl) {
        try {
          const referrersQuery = query(collection(db, 'users'), where('referralCode', '==', referralCodeFromUrl));
          const referrerSnap = await getDocs(referrersQuery);
          if (!referrerSnap.empty) {
            const referrerDoc = referrerSnap.docs[0];
            await updateDoc(doc(db, 'users', referrerDoc.id), {
              referralCount: increment(1),
              referralEarnings: increment(49),
              balance: increment(49)
            });
            
            // Add transaction for referrer
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

      toast.success('Welcome to TaskDhan!');
    } else {
      toast.success('Logged in successfully!');
    }
  }, [referralCodeFromUrl]);

  useEffect(() => {
    // Social login redirect result check removed as requested
  }, [navigate, handleUserDoc]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (loginMethod === 'phone') {
        // Find user by phone number to get their email
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('phoneNumber', '==', phoneNumber));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          toast.error('No account found with this phone number. Please register.');
          setLoading(false);
          return;
        }

        const userDoc = querySnapshot.docs[0].data();
        const userEmail = userDoc.email;

        // Login with email and password
        const userCredential = await signInWithEmailAndPassword(auth, userEmail, password);
        await handleUserDoc(userCredential.user.uid, phoneNumber);
        navigate('/dashboard');
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        await handleUserDoc(userCredential.user.uid, '');
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        toast.error('Invalid credentials.');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address.');
      } else {
        toast.error('Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md p-8 rounded-3xl bg-bg-card border border-border-main shadow-2xl"
      >
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-brand-primary rounded-2xl flex items-center justify-center shadow-lg shadow-brand-primary/20 mb-4">
            <Trophy className="text-white w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-text-main">Welcome Back</h2>
          <p className="text-text-muted mt-2">Login to your TaskDhan account</p>
        </div>

        <div className="flex p-1 bg-bg-main rounded-2xl border border-border-main mb-6">
          <button
            onClick={() => setLoginMethod('phone')}
            className={cn(
              "flex-1 py-2 text-sm font-bold rounded-xl transition-all",
              loginMethod === 'phone' ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" : "text-text-muted hover:text-text-main"
            )}
          >
            Phone
          </button>
          <button
            onClick={() => setLoginMethod('email')}
            className={cn(
              "flex-1 py-2 text-sm font-bold rounded-xl transition-all",
              loginMethod === 'email' ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" : "text-text-muted hover:text-text-main"
            )}
          >
            Email
          </button>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          {loginMethod === 'phone' ? (
            <div className="space-y-4">
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                <input
                  type="tel"
                  placeholder="Mobile Number"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-bg-main border border-border-main rounded-2xl text-text-main focus:outline-none focus:border-brand-primary transition-colors"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-bg-main border border-border-main rounded-2xl text-text-main focus:outline-none focus:border-brand-primary transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || phoneNumber.length < 10 || password.length < 6}
                className="w-full py-4 bg-brand-primary hover:bg-brand-secondary disabled:opacity-50 disabled:hover:bg-brand-primary text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login Now'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-bg-main border border-border-main rounded-2xl text-text-main focus:outline-none focus:border-brand-primary transition-colors"
                  required
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted w-5 h-5" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-bg-main border border-border-main rounded-2xl text-text-main focus:outline-none focus:border-brand-primary transition-colors"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-brand-primary hover:bg-brand-secondary disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 transition-all duration-300 flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login Now'}
                {!loading && <ArrowRight className="w-5 h-5" />}
              </button>
            </div>
          )}
        </form>

        <div className="mt-8 pt-8 border-t border-border-main text-center">
          <p className="text-sm text-text-muted mb-4">
            Don't have an account?{' '}
            <Link to="/register" className="text-brand-primary font-bold hover:underline">Register Now</Link>
          </p>
          <p className="text-xs text-text-muted">
            By continuing, you agree to our <br />
            <Link to="/privacy" className="text-brand-primary hover:underline">Privacy Policy</Link> and <Link to="/terms" className="text-brand-primary hover:underline">Terms of Service</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
