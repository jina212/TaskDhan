import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  Timer, 
  Trophy, 
  Coins, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Zap,
  Gamepad2,
  ChevronRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { cn, formatCurrency } from '../lib/utils';
import { collection, query, getDocs, doc, updateDoc, increment, addDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Quiz, QuizAttempt } from '../types';
import { toast } from 'sonner';

export default function QuizPage() {
  const { profile } = useAuth();
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isQuizFinished, setIsQuizFinished] = useState(false);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        const snap = await getDocs(collection(db, 'quizzes'));
        const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Quiz));
        
        if (data.length === 0) {
          setQuizzes([
            {
              id: '1',
              title: 'Cricket World Cup GK',
              category: 'Cricket',
              entryFee: 10,
              reward: 25,
              duration: 60,
              questions: [
                { question: 'Who won the first Cricket World Cup?', options: ['West Indies', 'Australia', 'India', 'England'], correctAnswer: 0 },
                { question: 'How many World Cups has India won?', options: ['1', '2', '3', '4'], correctAnswer: 1 },
                { question: 'Who is known as the God of Cricket?', options: ['Virat Kohli', 'MS Dhoni', 'Sachin Tendulkar', 'Ricky Ponting'], correctAnswer: 2 }
              ]
            },
            {
              id: '2',
              title: 'General Knowledge Challenge',
              category: 'GK',
              entryFee: 20,
              reward: 50,
              duration: 90,
              questions: [
                { question: 'What is the capital of India?', options: ['Mumbai', 'Kolkata', 'New Delhi', 'Chennai'], correctAnswer: 2 },
                { question: 'Which is the largest planet in our solar system?', options: ['Earth', 'Mars', 'Jupiter', 'Saturn'], correctAnswer: 2 },
                { question: 'Who wrote the National Anthem of India?', options: ['Rabindranath Tagore', 'Bankim Chandra Chatterjee', 'Mahatma Gandhi', 'Subhash Chandra Bose'], correctAnswer: 0 }
              ]
            }
          ]);
        } else {
          setQuizzes(data);
        }
      } catch (error) {
        console.error('Error fetching quizzes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const startQuiz = async (quiz: Quiz) => {
    if (!profile) return;
    
    if (profile.coins < quiz.entryFee) {
      toast.error('Insufficient Coins', {
        description: `You need ${quiz.entryFee} coins to enter this quiz.`
      });
      return;
    }

    try {
      // Deduct entry fee
      const userRef = doc(db, 'users', profile.uid);
      await updateDoc(userRef, {
        coins: increment(-quiz.entryFee)
      });

      setActiveQuiz(quiz);
      setCurrentQuestionIdx(0);
      setScore(0);
      setTimeLeft(quiz.duration);
      setIsQuizFinished(false);
      setSelectedOption(null);
      setIsCorrect(null);

      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            finishQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      toast.success('Quiz Started!', {
        description: `${quiz.entryFee} coins deducted as entry fee.`
      });
    } catch (error) {
      console.error('Error starting quiz:', error);
      toast.error('Failed to start quiz. Please try again.');
    }
  };

  const handleOptionSelect = (idx: number) => {
    if (selectedOption !== null || !activeQuiz) return;

    setSelectedOption(idx);
    const correct = idx === activeQuiz.questions[currentQuestionIdx].correctAnswer;
    setIsCorrect(correct);

    if (correct) {
      setScore(prev => prev + 1);
      toast.success('Correct!', { duration: 1000 });
    } else {
      toast.error('Wrong Answer!', { duration: 1000 });
    }

    setTimeout(() => {
      if (currentQuestionIdx < activeQuiz.questions.length - 1) {
        setCurrentQuestionIdx(prev => prev + 1);
        setSelectedOption(null);
        setIsCorrect(null);
      } else {
        finishQuiz();
      }
    }, 1500);
  };

  const finishQuiz = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsQuizFinished(true);

    if (!activeQuiz || !profile) return;

    const rewardEarned = score === activeQuiz.questions.length ? activeQuiz.reward : 0;

    try {
      const userRef = doc(db, 'users', profile.uid);
      const attemptRef = collection(db, 'quizAttempts');

      if (rewardEarned > 0) {
        await updateDoc(userRef, {
          balance: increment(rewardEarned),
          todayEarnings: increment(rewardEarned),
          totalEarnings: increment(rewardEarned)
        });
        toast.success('Congratulations!', {
          description: `You won ₹${rewardEarned} for a perfect score!`
        });
      }

      await addDoc(attemptRef, {
        userId: profile.uid,
        quizId: activeQuiz.id,
        score,
        totalQuestions: activeQuiz.questions.length,
        rewardEarned,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error finishing quiz:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <Loader2 className="w-12 h-12 text-brand-primary animate-spin" />
        <p className="text-text-main font-bold">Loading Quizzes...</p>
      </div>
    );
  }

  if (activeQuiz && !isQuizFinished) {
    const currentQuestion = activeQuiz.questions[currentQuestionIdx];
    const progress = ((currentQuestionIdx + 1) / activeQuiz.questions.length) * 100;

    return (
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Quiz Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
              <Timer className="w-6 h-6" />
            </div>
            <div>
              <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">Time Remaining</p>
              <p className={cn("text-xl font-black", timeLeft < 10 ? "text-red-500 animate-pulse" : "text-text-main")}>
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-text-muted text-[10px] font-black uppercase tracking-widest">Score</p>
            <p className="text-xl font-black text-brand-primary">{score}/{activeQuiz.questions.length}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-3 w-full bg-bg-main rounded-full overflow-hidden border border-border-main">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-brand-primary"
          />
        </div>

        {/* Question Card */}
        <motion.div
          key={currentQuestionIdx}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="p-8 rounded-[2.5rem] bg-bg-card border-2 border-border-main shadow-xl space-y-8"
        >
          <h3 className="text-2xl font-black text-text-main text-center leading-tight">
            {currentQuestion.question}
          </h3>

          <div className="grid grid-cols-1 gap-4">
            {currentQuestion.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                disabled={selectedOption !== null}
                className={cn(
                  "p-5 rounded-2xl border-2 font-bold text-left transition-all flex items-center justify-between group",
                  selectedOption === null 
                    ? "bg-bg-main border-border-main hover:border-brand-primary hover:bg-brand-primary/5" 
                    : selectedOption === idx
                      ? isCorrect 
                        ? "bg-emerald-500 border-emerald-500 text-white" 
                        : "bg-red-500 border-red-500 text-white"
                      : idx === currentQuestion.correctAnswer && selectedOption !== null
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-600"
                        : "bg-bg-main border-border-main opacity-50"
                )}
              >
                <span>{option}</span>
                {selectedOption === idx && (
                  isCorrect ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />
                )}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  if (isQuizFinished) {
    const isPerfect = score === activeQuiz?.questions.length;

    return (
      <div className="max-w-md mx-auto text-center space-y-8 py-12">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-32 h-32 rounded-[2.5rem] bg-brand-primary/10 flex items-center justify-center mx-auto text-brand-primary"
        >
          <Trophy className="w-16 h-16" />
        </motion.div>

        <div className="space-y-2">
          <h2 className="text-3xl font-black text-text-main">Quiz Completed!</h2>
          <p className="text-text-muted">You scored {score} out of {activeQuiz?.questions.length}</p>
        </div>

        <div className="p-8 rounded-[2.5rem] bg-bg-card border-2 border-border-main space-y-6">
          <div className="flex items-center justify-between">
            <span className="text-text-muted font-bold">Accuracy</span>
            <span className="text-text-main font-black">{Math.round((score / (activeQuiz?.questions.length || 1)) * 100)}%</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-text-muted font-bold">Reward Earned</span>
            <span className="text-emerald-500 font-black">₹{isPerfect ? activeQuiz?.reward : 0}</span>
          </div>
          {!isPerfect && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-3 text-left">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
              <p className="text-[10px] font-bold text-red-600">You need a perfect score (100%) to win the reward. Try again!</p>
            </div>
          )}
        </div>

        <button
          onClick={() => {
            setActiveQuiz(null);
            setIsQuizFinished(false);
          }}
          className="w-full py-5 bg-brand-primary text-white font-black rounded-2xl shadow-xl shadow-brand-primary/20 hover:scale-105 transition-all"
        >
          Back to Quizzes
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-text-main tracking-tight flex items-center justify-center gap-3">
          <Brain className="w-8 h-8 text-brand-primary" />
          Quiz & Earn
        </h1>
        <p className="text-text-muted">Test your knowledge and win real cash</p>
      </div>

      {/* Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quizzes.map((quiz, i) => (
          <motion.div
            key={quiz.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-8 rounded-[2.5rem] bg-bg-card border-2 border-border-main hover:border-brand-primary transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
              <Gamepad2 className="w-32 h-32" />
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-center justify-between">
                <div className="px-4 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase tracking-widest">
                  {quiz.category}
                </div>
                <div className="flex items-center gap-1.5 text-text-muted text-xs font-bold">
                  <Timer className="w-4 h-4" />
                  {quiz.duration}s
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-black text-text-main">{quiz.title}</h3>
                <p className="text-text-muted text-sm">{quiz.questions.length} Questions • Perfect score wins reward</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-bg-main border border-border-main">
                  <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-1">Entry Fee</p>
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-yellow-500" />
                    <span className="text-lg font-black text-text-main">{quiz.entryFee}</span>
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-bg-main border border-border-main">
                  <p className="text-text-muted text-[10px] font-black uppercase tracking-widest mb-1">Reward</p>
                  <p className="text-lg font-black text-emerald-500">₹{quiz.reward}</p>
                </div>
              </div>

              <button
                onClick={() => startQuiz(quiz)}
                className="w-full py-4 bg-brand-primary text-white font-black rounded-2xl shadow-lg shadow-brand-primary/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
              >
                Start Quiz <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Leaderboard Preview */}
      <div className="p-8 rounded-[2.5rem] bg-bg-main border-2 border-border-main border-dashed space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-text-main flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Top Quiz Masters
          </h3>
          <button className="text-brand-primary text-xs font-bold hover:underline">View All</button>
        </div>
        <div className="space-y-3">
          {[
            { name: 'Rahul S.', score: 1250, avatar: 'https://picsum.photos/seed/rahul/100/100' },
            { name: 'Priya K.', score: 1120, avatar: 'https://picsum.photos/seed/priya/100/100' },
            { name: 'Amit M.', score: 980, avatar: 'https://picsum.photos/seed/amit/100/100' },
          ].map((user, i) => (
            <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-bg-card border border-border-main">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-border-main">
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                <span className="font-bold text-text-main">{user.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-brand-primary" />
                <span className="font-black text-brand-primary">{user.score}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
