import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation, useParams } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  LayoutDashboard, 
  Wallet, 
  Users, 
  User, 
  Settings, 
  PlusCircle, 
  History, 
  ArrowUpRight, 
  ArrowDownLeft,
  Trophy,
  Gift,
  PlayCircle,
  Download,
  FileText,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Bell,
  ShieldCheck,
  HelpCircle,
  Info,
  Lock,
  Mail,
  Smartphone,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Brain,
  ShieldAlert,
  Ban
} from 'lucide-react';

import { AuthProvider, useAuth } from './AuthContext';
import { ThemeProvider, useTheme } from './ThemeContext';
import { cn, formatCurrency } from './lib/utils';
import { Sun, Moon } from 'lucide-react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from './firebase';
import { AppSettings } from './types';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import TasksPage from './pages/TasksPage';
import ReferralPage from './pages/ReferralPage';
import WalletPage from './pages/WalletPage';
import WithdrawPage from './pages/WithdrawPage';
import ProfilePage from './pages/ProfilePage';
import LogoutPage from './pages/LogoutPage';
import RegisterPage from './pages/RegisterPage';
import AboutPage from './pages/AboutPage';
import PrivacyPage from './pages/PrivacyPage';
import ContactPage from './pages/ContactPage';
import AdminDashboard from './pages/AdminDashboard';
import NotificationsPage from './pages/NotificationsPage';
import SecurityPage from './pages/SecurityPage';
import MysteryBoxPage from './pages/MysteryBoxPage';
import OnboardingTour from './components/OnboardingTour';
import StorePage from './pages/StorePage';
import QuizPage from './pages/QuizPage';
import WheelGamePage from './pages/WheelGamePage';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-xl bg-bg-card border border-border-main text-text-main hover:text-brand-primary transition-all duration-300"
      aria-label="Toggle theme"
    >
      {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
    </button>
  );
};

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-bg-main"><Loader2 className="w-8 h-8 text-brand-primary animate-spin" /></div>;
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return <div className="h-screen w-screen flex items-center justify-center bg-bg-main"><Loader2 className="w-8 h-8 text-brand-primary animate-spin" /></div>;
  return isAdmin ? <>{children}</> : <Navigate to="/dashboard" />;
};

const Navbar = () => {
  const { user, profile, isAdmin } = useAuth();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Tasks', path: '/tasks', icon: Trophy },
    { label: 'Quiz', path: '/quiz', icon: PlayCircle },
    { label: 'Referral', path: '/referral', icon: Users },
    { label: 'Wallet', path: '/wallet', icon: Wallet },
    { label: 'Profile', path: '/profile', icon: User },
  ];

  if (isAdmin) {
    navItems.push({ label: 'Admin', path: '/admin', icon: ShieldCheck });
  }

  if (!user) {
    return (
      <>
        <nav className="fixed top-0 left-0 right-0 bg-bg-card/80 backdrop-blur-lg border-b border-border-main z-50">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between items-center h-16 md:h-20">
              <Link to="/" className="flex items-center gap-2">
                <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
                  <Trophy className="text-white w-6 h-6" />
                </div>
                <span className="text-xl font-bold text-text-main tracking-tight">Task<span className="text-brand-primary">Dhan</span></span>
              </Link>
              <div className="flex items-center gap-4">
                <ThemeToggle />
                <Link
                  to="/login"
                  className="px-6 py-2 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-xl transition-all duration-300"
                >
                  Login
                </Link>
              </div>
            </div>
          </div>
        </nav>
        <div className="h-16 md:h-20" /> {/* Spacer */}
      </>
    );
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 bg-bg-card/80 backdrop-blur-lg border-t border-border-main z-50 md:top-0 md:bottom-auto md:border-b md:border-t-0">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16 md:h-20">
            <Link to="/dashboard" className="hidden md:flex items-center gap-2">
              <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center shadow-lg shadow-brand-primary/20">
                <Trophy className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-text-main tracking-tight">Task<span className="text-brand-primary">Dhan</span></span>
            </Link>

            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="flex justify-around w-full md:w-auto md:gap-8">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={cn(
                        "flex flex-col md:flex-row items-center gap-1 md:gap-2 px-3 py-2 rounded-xl transition-all duration-300",
                        isActive 
                          ? "text-brand-primary md:bg-brand-primary/10" 
                          : "text-text-muted hover:text-text-main"
                      )}
                    >
                      <Icon className="w-6 h-6" />
                      <span className="text-[10px] md:text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              <div className="hidden md:flex items-center gap-4">
                <ThemeToggle />
                <Link
                  to="/logout"
                  className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all duration-300"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <div className="h-16 md:h-20" /> {/* Spacer */}
    </>
  );
};

const ShortLinkRedirect = () => {
  const { code } = useParams();
  return <Navigate to={`/login?ref=${code}`} replace />;
};

const Footer = () => {
  return (
    <footer className="mt-20 py-12 border-t border-border-main bg-bg-card/30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          <div className="col-span-1 md:col-span-2 space-y-6">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-brand-primary rounded-xl flex items-center justify-center">
                <Trophy className="text-white w-6 h-6" />
              </div>
              <span className="text-xl font-bold text-text-main tracking-tight">Task<span className="text-brand-primary">Dhan</span></span>
            </Link>
            <p className="text-sm text-text-muted max-w-xs leading-relaxed">
              India's most trusted micro-tasking platform. Earn real cash by completing simple daily tasks and referring friends.
            </p>
          </div>
          <div>
            <h4 className="text-sm font-black text-text-main uppercase tracking-widest mb-6">Company</h4>
            <ul className="space-y-4">
              <li><Link to="/about" className="text-sm text-text-muted hover:text-brand-primary transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="text-sm text-text-muted hover:text-brand-primary transition-colors">Contact Us</Link></li>
              <li><Link to="/privacy" className="text-sm text-text-muted hover:text-brand-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-sm text-text-muted hover:text-brand-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-sm font-black text-text-main uppercase tracking-widest mb-6">Support</h4>
            <ul className="space-y-4">
              <li><Link to="/contact" className="text-sm text-text-muted hover:text-brand-primary transition-colors">Help Center</Link></li>
              <li><a href="mailto:support@taskdhan.com" className="text-sm text-text-muted hover:text-brand-primary transition-colors">Email Support</a></li>
              <li className="text-sm text-text-muted">WhatsApp Support: Soon</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border-main flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-text-muted">© 2024 TaskDhan. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest px-2 py-0.5 rounded bg-brand-primary/10">Made in India</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

function AppContent() {
  const { user, profile, isAdmin } = useAuth();
  const [settings, setSettings] = React.useState<AppSettings | null>(null);

  React.useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) setSettings(doc.data() as AppSettings);
    });
    return () => unsub();
  }, []);

  if (profile?.isBanned) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-bg-main p-6 text-center">
        <Ban className="w-20 h-20 text-red-500 mb-6" />
        <h1 className="text-3xl font-black text-text-main mb-2">Account Banned</h1>
        <p className="text-text-muted">Your account has been suspended for violating our terms of service.</p>
        <a href="mailto:support@taskdhan.app" className="mt-8 text-brand-primary font-bold hover:underline">Contact Support</a>
      </div>
    );
  }

  if (!isAdmin && settings && (!settings.isAppLive || settings.maintenanceMode)) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-bg-main p-6 text-center">
        <ShieldAlert className="w-20 h-20 text-brand-primary mb-6" />
        <h1 className="text-3xl font-black text-text-main mb-2">Systems Offline</h1>
        <p className="text-text-muted max-w-xs mx-auto">
          We are performing some scheduled maintenance or updates. Please check back after some time.
        </p>
      </div>
    );
  }
  
  return (
    <Router>
      <div className="min-h-screen bg-bg-main text-text-main font-sans selection:bg-brand-primary/30">
        {user && <OnboardingTour />}
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 py-6 pb-24 md:pb-8">
          {user && (
            <div className="md:hidden fixed top-4 right-4 z-[60] flex items-center gap-2">
              <ThemeToggle />
              <Link
                to="/logout"
                className="p-2 rounded-xl bg-bg-card border border-border-main text-red-500 hover:bg-red-500/10 transition-all duration-300"
              >
                <LogOut className="w-5 h-5" />
              </Link>
            </div>
          )}
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
              <Route path="/tasks" element={<PrivateRoute><TasksPage /></PrivateRoute>} />
              <Route path="/referral" element={<PrivateRoute><ReferralPage /></PrivateRoute>} />
              <Route path="/wallet" element={<PrivateRoute><WalletPage /></PrivateRoute>} />
              <Route path="/withdraw" element={<PrivateRoute><WithdrawPage /></PrivateRoute>} />
              <Route path="/profile" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
              <Route path="/logout" element={<LogoutPage />} />
              <Route path="/mystery-box" element={<PrivateRoute><MysteryBoxPage /></PrivateRoute>} />
              <Route path="/store" element={<PrivateRoute><StorePage /></PrivateRoute>} />
              <Route path="/quiz" element={<PrivateRoute><QuizPage /></PrivateRoute>} />
              <Route path="/wheel-game" element={<PrivateRoute><WheelGamePage /></PrivateRoute>} />
              <Route path="/security" element={<PrivateRoute><SecurityPage /></PrivateRoute>} />
              <Route path="/notifications" element={<PrivateRoute><NotificationsPage /></PrivateRoute>} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
              <Route path="/r/:code" element={<ShortLinkRedirect />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </AnimatePresence>
        </main>
        {!user && <Footer />}
        <Toaster position="top-center" richColors />
      </div>
    </Router>
  );
}
