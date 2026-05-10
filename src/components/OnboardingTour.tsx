import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Target, 
  Users, 
  Wallet, 
  Gift, 
  ChevronRight, 
  X,
  Sparkles,
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../lib/utils';

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: "Welcome to TaskDhan! 🚀",
    description: "Your journey to earning real money starts here. Let's take a quick tour of how you can maximize your earnings.",
    icon: <Trophy className="w-8 h-8 text-yellow-500" />,
    color: "from-yellow-500/20 to-orange-500/20"
  },
  {
    title: "Complete Tasks 🎯",
    description: "Visit the 'Tasks' section to find simple jobs like watching videos or filling forms. Each task adds real cash to your wallet.",
    icon: <Target className="w-8 h-8 text-blue-500" />,
    color: "from-blue-500/20 to-indigo-500/20"
  },
  {
    title: "Refer & Earn 👥",
    description: "Invite your friends using your unique link. Earn ₹49 for every direct referral and bonus for their referrals too!",
    icon: <Users className="w-8 h-8 text-emerald-500" />,
    color: "from-emerald-500/20 to-teal-500/20"
  },
  {
    title: "Mystery Boxes 🎁",
    description: "Try your luck with Daily Free and Ad-Unlock boxes. You can win up to ₹1000 every single day!",
    icon: <Gift className="w-8 h-8 text-purple-500" />,
    color: "from-purple-500/20 to-pink-500/20"
  },
  {
    title: "Instant Withdrawals 💳",
    description: "Once you reach the minimum balance, withdraw your earnings directly to your UPI or Paytm wallet instantly.",
    icon: <Wallet className="w-8 h-8 text-orange-500" />,
    color: "from-orange-500/20 to-red-500/20"
  }
];

export default function OnboardingTour() {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem('taskdhan_onboarding_seen');
    if (!hasSeenTour) {
      const timer = setTimeout(() => setIsVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleNext = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    localStorage.setItem('taskdhan_onboarding_seen', 'true');
  };

  if (!isVisible) return null;

  const step = TOUR_STEPS[currentStep];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={handleComplete}
        />
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="relative w-full max-w-md bg-bg-card border border-border-main rounded-[2.5rem] shadow-2xl overflow-hidden"
        >
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-bg-main flex">
            {TOUR_STEPS.map((_, i) => (
              <div 
                key={i}
                className={cn(
                  "flex-1 transition-all duration-500",
                  i <= currentStep ? "bg-brand-primary" : "bg-transparent"
                )}
              />
            ))}
          </div>

          <button 
            onClick={handleComplete}
            className="absolute top-6 right-6 p-2 text-text-muted hover:text-text-main transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-8 pt-12 space-y-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <motion.div
                key={currentStep}
                initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                className={cn(
                  "w-20 h-20 rounded-3xl flex items-center justify-center bg-gradient-to-br shadow-xl",
                  step.color
                )}
              >
                {step.icon}
              </motion.div>

              <div className="space-y-3">
                <h2 className="text-2xl font-black text-text-main tracking-tight">
                  {step.title}
                </h2>
                <p className="text-text-muted leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleNext}
                className="w-full py-4 bg-brand-primary hover:bg-brand-secondary text-white font-black rounded-2xl shadow-lg shadow-brand-primary/20 transition-all flex items-center justify-center gap-2 group"
              >
                {currentStep === TOUR_STEPS.length - 1 ? (
                  <>Get Started <CheckCircle2 className="w-5 h-5" /></>
                ) : (
                  <>Next Step <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" /></>
                )}
              </button>
              
              {currentStep < TOUR_STEPS.length - 1 && (
                <button
                  onClick={handleComplete}
                  className="w-full py-2 text-text-muted hover:text-text-main text-sm font-bold transition-colors"
                >
                  Skip Tour
                </button>
              )}
            </div>

            <div className="flex justify-center gap-1.5">
              {TOUR_STEPS.map((_, i) => (
                <div 
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all duration-300",
                    i === currentStep ? "w-4 bg-brand-primary" : "bg-border-main"
                  )}
                />
              ))}
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl" />
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-primary/10 rounded-full blur-3xl" />
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
