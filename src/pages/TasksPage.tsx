import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PlayCircle, 
  Download, 
  FileText, 
  ChevronRight, 
  Clock, 
  Trophy, 
  CheckCircle2, 
  AlertCircle,
  X,
  Upload,
  Loader2,
  Zap
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Task, TaskSubmission } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { Toaster, toast } from 'sonner';
import SecurityVerification from '../components/SecurityVerification';
import confetti from 'canvas-confetti';
import { useSettings } from '../hooks/useSettings';
import { format } from 'date-fns';

const DAILY_LIMITS: Record<string, number> = {
  video: 10,
  download: 5,
  form: 10
};

export default function TasksPage() {
  const { user, profile } = useAuth();
  const { settings } = useSettings();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [proof, setProof] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isTaskStarted, setIsTaskStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [todaySubmissions, setTodaySubmissions] = useState<Record<string, number>>({
    video: 0,
    download: 0,
    form: 0
  });
  const [submissions, setSubmissions] = useState<TaskSubmission[]>([]);
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all');

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isTimerRunning && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(timer);
  }, [isTimerRunning, timeLeft]);

  useEffect(() => {
    if (!user) return;

    // Fetch recent submissions history
    const qSubHistory = query(
      collection(db, 'submissions'),
      where('userId', '==', user.uid),
      orderBy('submittedAt', 'desc'),
      limit(5)
    );

    const unsubscribeSubHistory = onSnapshot(qSubHistory, (snapshot) => {
      const submissionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TaskSubmission));
      setSubmissions(submissionsData);
    }, (error) => {
      console.error('Error fetching submission history:', error);
    });

    // Fetch today's submissions to check limits
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const startOfTodayISO = startOfToday.toISOString();

    const qSub = query(
      collection(db, 'submissions'),
      where('userId', '==', user.uid),
      where('submittedAt', '>=', startOfTodayISO)
    );

    const unsubscribeSub = onSnapshot(qSub, (snapshot) => {
      const counts: Record<string, number> = { video: 0, download: 0, form: 0 };
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.taskType && counts[data.taskType] !== undefined) {
          counts[data.taskType]++;
        }
      });
      setTodaySubmissions(counts);
    });

    const qTasks = query(collection(db, 'tasks'), where('active', '==', true));
    
    const unsubscribeTasks = onSnapshot(qTasks, (snapshot) => {
      const tasksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      
      if (tasksData.length === 0) {
        setTasks([
          { id: '1', title: 'Watch Video Ad', description: 'Watch the full 30-second video to earn reward.', reward: 2, type: 'video', difficulty: 'easy', duration: 30, sponsored: true, active: true, createdAt: new Date().toISOString() },
          { id: '2', title: 'Install PhonePe', description: 'Download and register on PhonePe app.', reward: 10, type: 'download', difficulty: 'hard', duration: 300, sponsored: false, active: true, createdAt: new Date().toISOString() },
          { id: '3', title: 'Fill Feedback Form', description: 'Provide your honest feedback about our platform.', reward: 5, type: 'form', difficulty: 'medium', duration: 120, sponsored: false, active: true, createdAt: new Date().toISOString() },
          { id: '4', title: 'Join Telegram Channel', description: 'Join our official telegram channel for updates.', reward: 3, type: 'form', difficulty: 'easy', duration: 60, sponsored: true, active: true, createdAt: new Date().toISOString() },
        ]);
      } else {
        setTasks(tasksData);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching tasks:', error);
      setLoading(false);
    });

    return () => {
      unsubscribeSubHistory();
      unsubscribeSub();
      unsubscribeTasks();
    };
  }, [user]);

  const handleStartSubmission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isVerified) {
      setIsVerifying(true);
    } else {
      setShowConfirmation(true);
    }
  };

  const handleSubmitProof = async () => {
    if (!user || !selectedTask) return;

    // Final limit check before submission
    if (todaySubmissions[selectedTask.type] >= DAILY_LIMITS[selectedTask.type]) {
      toast.error(`Daily limit reached for ${selectedTask.type} tasks!`);
      setShowConfirmation(false);
      return;
    }
    
    setSubmitting(true);
    try {
      const multiplier = settings?.taskRewardMultiplier || 1;
      const finalReward = Math.round(selectedTask.reward * multiplier);
      
      await addDoc(collection(db, 'submissions'), {
        userId: user.uid,
        taskId: selectedTask.id,
        taskType: selectedTask.type,
        proof: proof,
        status: 'pending',
        reward: finalReward,
        submittedAt: new Date().toISOString()
      });
      
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#10b981', '#3b82f6', '#f59e0b']
      });

      setIsSuccess(true);
      setShowConfirmation(false);
      setTodaySubmissions(prev => ({ ...prev, [selectedTask.type]: prev[selectedTask.type] + 1 }));
      
      setTimeout(() => {
        setIsSuccess(false);
        setSelectedTask(null);
        setProof('');
        setIsTaskStarted(false);
        setIsTimerRunning(false);
        setTimeLeft(0);
        setIsVerified(false);
      }, 3000);

    } catch (error) {
      console.error('Error submitting task:', error);
      toast.error('Failed to submit task. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getTaskIcon = (type: string) => {
    switch (type) {
      case 'video': return PlayCircle;
      case 'download': return Download;
      case 'form': return FileText;
      default: return Trophy;
    }
  };

  const getTaskColor = (type: string) => {
    switch (type) {
      case 'video': return 'text-blue-500 bg-blue-500/10';
      case 'download': return 'text-purple-500 bg-purple-500/10';
      case 'form': return 'text-emerald-500 bg-emerald-500/10';
      default: return 'text-green-500 bg-green-500/10';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'hard': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-text-muted bg-bg-main border-border-main';
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCloseModal = () => {
    if (submitting) return;
    if (isTimerRunning && timeLeft > 0) {
      if (!window.confirm("A task is in progress. Closing this will lose your progress. Are you sure?")) {
        return;
      }
    }
    setSelectedTask(null);
    setIsTaskStarted(false);
    setIsTimerRunning(false);
    setTimeLeft(0);
    setIsVerified(false);
    setProof('');
    setIsSuccess(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Available Tasks</h1>
          <p className="text-text-muted text-xs mt-1">Complete tasks to earn real money</p>
        </div>
        <Link to="/store" className="px-3 py-1 bg-brand-primary/10 border border-brand-primary/20 rounded-full text-brand-primary text-xs font-bold flex items-center gap-1 hover:bg-brand-primary/20 transition-colors">
          <Zap className="w-3 h-3" />
          <span>Recharge</span>
        </Link>
      </div>

      {/* Daily Limits Summary */}
      <div className="grid grid-cols-3 gap-3">
        {Object.entries(DAILY_LIMITS).map(([type, limit]) => {
          const count = todaySubmissions[type] || 0;
          const isFull = count >= limit;
          const Icon = getTaskIcon(type);
          const colorClass = getTaskColor(type);
          
          return (
            <div key={type} className="p-3 rounded-2xl bg-bg-card border border-border-main flex flex-col items-center text-center">
              <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center mb-2", colorClass)}>
                <Icon className="w-4 h-4" />
              </div>
              <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-1">{type}</p>
              <p className={cn("text-xs font-black", isFull ? "text-red-500" : "text-text-main")}>
                {count}/{limit}
              </p>
            </div>
          );
        })}
      </div>

      {/* Difficulty Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {(['all', 'easy', 'medium', 'hard'] as const).map((diff) => (
          <button
            key={diff}
            onClick={() => setDifficultyFilter(diff)}
            className={cn(
              "px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border-2 whitespace-nowrap",
              difficultyFilter === diff
                ? "bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-105"
                : "bg-bg-card border-border-main text-text-muted hover:border-brand-primary/50"
            )}
          >
            {diff}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks
            .filter(task => difficultyFilter === 'all' || task.difficulty === difficultyFilter)
            .sort((a, b) => {
              const order = { easy: 1, medium: 2, hard: 3 };
              return order[a.difficulty as keyof typeof order] - order[b.difficulty as keyof typeof order];
            })
            .map((task, i) => {
            const Icon = getTaskIcon(task.type);
            const colorClass = getTaskColor(task.type);
            const isLimitReached = todaySubmissions[task.type] >= DAILY_LIMITS[task.type];

            return (
              <motion.div
                key={task.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "p-5 rounded-3xl bg-bg-card border border-border-main transition-all group relative overflow-hidden",
                  isLimitReached ? "opacity-60 grayscale cursor-not-allowed" : "hover:border-text-muted cursor-pointer"
                )}
                onClick={() => !isLimitReached && setSelectedTask(task)}
              >
                {isLimitReached && (
                  <div className="absolute top-3 left-3 z-10 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-md uppercase">
                    Limit Reached
                  </div>
                )}
                
                <div className="flex items-start justify-between mb-4">
                  <div className="flex flex-col gap-2">
                    <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center", colorClass)}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className={cn("px-2 py-0.5 rounded-md border text-[10px] font-bold uppercase w-fit", getDifficultyColor(task.difficulty))}>
                      {task.difficulty}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-brand-primary">₹{task.reward}</p>
                    <p className="text-text-muted text-[10px] uppercase font-bold tracking-widest">Reward</p>
                  </div>
                </div>
                
                <h3 className="text-lg font-bold text-text-main mb-1">{task.title}</h3>
                <p className="text-text-muted text-sm line-clamp-2 mb-4">{task.description}</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-border-main/50">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-text-muted text-xs">
                      <Clock className="w-3 h-3" />
                      <span>{Math.floor(task.duration / 60)}m {task.duration % 60}s</span>
                    </div>
                    {task.sponsored && (
                      <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold rounded-md uppercase">Sponsored</span>
                    )}
                  </div>
                  <button 
                    disabled={isLimitReached}
                    className={cn(
                      "flex items-center gap-1 text-sm font-bold transition-transform",
                      isLimitReached ? "text-text-muted" : "text-brand-primary group-hover:translate-x-1"
                    )}
                  >
                    {isLimitReached ? 'Locked' : 'Start Task'} <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Recent Submissions Section */}
      {submissions.length > 0 && (
        <div className="space-y-4 pt-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-text-main">Recent Submissions</h2>
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest bg-bg-card px-2 py-0.5 rounded-md border border-border-main">
              Last 5 Tasks
            </div>
          </div>

          <div className="space-y-3">
            {submissions.map((sub, i) => {
              const task = tasks.find(t => t.id === sub.taskId);
              const statusColors = {
                pending: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
                approved: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
                rejected: 'text-rose-500 bg-rose-500/10 border-rose-500/20'
              };

              return (
                <motion.div
                  key={sub.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-4 rounded-2xl bg-bg-card border border-border-main flex items-center justify-between group hover:border-brand-primary/30 transition-all shadow-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", getTaskColor(sub.taskType))}>
                      {React.createElement(getTaskIcon(sub.taskType), { className: "w-5 h-5" })}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-text-main group-hover:text-brand-primary transition-colors">
                        {task?.title || `Task (${sub.taskType})`}
                      </h4>
                      <p className="text-[10px] text-text-muted font-medium">
                        {format(new Date(sub.submittedAt), 'dd MMM, hh:mm aa')}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className={cn("px-2 py-0.5 rounded-md border text-[10px] font-black uppercase tracking-wider", statusColors[sub.status])}>
                      {sub.status}
                    </div>
                    <p className="text-xs font-bold text-brand-primary">₹{sub.reward}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Modal */}
      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={handleCloseModal}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg bg-bg-card border border-border-main rounded-[2.5rem] overflow-hidden shadow-2xl"
            >
              <div className="p-8">
                <AnimatePresence mode="wait">
                  {isSuccess ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="flex flex-col items-center justify-center py-12 text-center space-y-6"
                    >
                      <div className="relative">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", damping: 12, stiffness: 200 }}
                          className="w-24 h-24 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20"
                        >
                          <CheckCircle2 className="w-12 h-12 text-white" />
                        </motion.div>
                        <motion.div
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute inset-0 rounded-full bg-emerald-500 blur-xl -z-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <h2 className="text-2xl font-bold text-text-main">Task Submitted!</h2>
                        <p className="text-text-muted max-w-[250px]">
                          Great job! Your proof has been submitted for review.
                        </p>
                      </div>
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 font-bold text-sm">
                        Potential Reward: ₹{selectedTask.reward}
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <div className="flex flex-col gap-3">
                          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center", getTaskColor(selectedTask.type))}>
                            {React.createElement(getTaskIcon(selectedTask.type), { className: "w-8 h-8" })}
                          </div>
                          <div className={cn("px-3 py-1 rounded-lg border text-xs font-bold uppercase w-fit", getDifficultyColor(selectedTask.difficulty))}>
                            {selectedTask.difficulty} Level
                          </div>
                        </div>
                        <button 
                          onClick={handleCloseModal}
                          className="p-2 rounded-full bg-bg-main text-text-muted hover:text-text-main transition-colors"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <h2 className="text-2xl font-bold text-text-main mb-2">{selectedTask.title}</h2>
                      <p className="text-text-muted mb-6">{selectedTask.description}</p>

                      <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 rounded-2xl bg-bg-main border border-border-main">
                          <p className="text-text-muted text-xs mb-1">Reward</p>
                          <p className="text-xl font-bold text-brand-primary">₹{selectedTask.reward}</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-bg-main border border-border-main">
                          <p className="text-text-muted text-xs mb-1">Time Limit</p>
                          <p className="text-xl font-bold text-text-main">{Math.floor(selectedTask.duration / 60)}m {selectedTask.duration % 60}s</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <button
                          disabled={isTaskStarted}
                          onClick={() => {
                            setIsTaskStarted(true);
                            setTimeLeft(selectedTask.duration);
                            setIsTimerRunning(true);
                            toast.info('Task started! Wait for the timer to finish.');
                          }}
                          className={cn(
                            "w-full py-4 font-bold rounded-2xl shadow-lg transition-all duration-300 flex items-center justify-center gap-2",
                            isTaskStarted 
                              ? "bg-bg-main text-text-muted border border-border-main shadow-none cursor-not-allowed" 
                              : "bg-brand-primary hover:bg-brand-secondary text-white shadow-brand-primary/20"
                          )}
                        >
                          <PlayCircle className="w-5 h-5" />
                          {isTaskStarted ? 'Task in Progress' : 'Start Task'}
                        </button>

                        {isTaskStarted && timeLeft > 0 && (
                          <div className="space-y-6">
                            {selectedTask.type === 'video' && (
                              <div className="relative aspect-video bg-black rounded-3xl overflow-hidden shadow-2xl flex items-center justify-center group">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                                <div className="z-20 flex flex-col items-center gap-3">
                                  <motion.div 
                                    animate={{ scale: [1, 1.1, 1] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="w-16 h-16 rounded-full bg-brand-primary/20 backdrop-blur-md flex items-center justify-center border border-brand-primary/30"
                                  >
                                    <PlayCircle className="w-8 h-8 text-brand-primary" />
                                  </motion.div>
                                  <p className="text-white font-bold text-xs uppercase tracking-widest px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                                    Ad Playing...
                                  </p>
                                </div>
                                <div className="absolute bottom-6 left-6 right-6 z-20 space-y-2">
                                  <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                                    <motion.div 
                                      className="h-full bg-brand-primary"
                                      initial={{ width: "0%" }}
                                      animate={{ width: `${((selectedTask.duration - timeLeft) / selectedTask.duration) * 100}%` }}
                                      transition={{ duration: 1, ease: "linear" }}
                                    />
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex flex-col items-center justify-center p-8 rounded-[2.5rem] bg-bg-main border border-border-main shadow-inner space-y-4">
                              <div className="relative w-32 h-32 flex items-center justify-center">
                                <svg className="w-full h-full -rotate-90 drop-shadow-lg">
                                  <circle
                                    cx="64"
                                    cy="64"
                                    r="58"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    className="text-border-main/30"
                                  />
                                  <motion.circle
                                    cx="64"
                                    cy="64"
                                    r="58"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="10"
                                    className={cn(
                                      "transition-colors duration-500",
                                      timeLeft < 10 ? "text-red-500" : "text-brand-primary"
                                    )}
                                    strokeLinecap="round"
                                    strokeDasharray="364.42"
                                    initial={{ strokeDashoffset: 0 }}
                                    animate={{ strokeDashoffset: 364.42 * (1 - timeLeft / selectedTask.duration) }}
                                    transition={{ duration: 1, ease: "linear" }}
                                  />
                                </svg>
                                <div className="absolute flex flex-col items-center justify-center">
                                  <motion.span 
                                    key={timeLeft}
                                    initial={{ scale: 1.1, opacity: 0.5 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className={cn(
                                      "text-3xl font-black line-height-none tabular-nums tracking-tighter",
                                      timeLeft < 10 ? "text-red-500" : "text-text-main"
                                    )}
                                  >
                                    {formatTime(timeLeft)}
                                  </motion.span>
                                  <span className="text-[10px] font-black uppercase text-text-muted tracking-[0.2em] mt-1">Remaining</span>
                                </div>
                              </div>
                              <div className="text-center space-y-1">
                                <h4 className="text-text-main font-bold text-base">Task in Progress</h4>
                                <p className="text-text-muted text-[10px] uppercase font-black tracking-[0.2em] opacity-60">Complete the requirements before time ends</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {isTaskStarted && timeLeft === 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-4"
                          >
                            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-3">
                              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                              <div>
                                <p className="text-emerald-500 font-bold text-sm">Time's Up!</p>
                                <p className="text-text-muted text-xs">You can now submit your proof.</p>
                              </div>
                            </div>

                            <form onSubmit={handleStartSubmission} className="space-y-4">
                              <div className="space-y-2">
                                <label className="text-sm font-medium text-text-muted">Submit Proof (Link or Description)</label>
                                <textarea
                                  value={proof}
                                  onChange={(e) => setProof(e.target.value)}
                                  placeholder="Enter proof of completion (e.g., username, screenshot link, etc.)"
                                  className="w-full p-4 bg-bg-main border border-border-main rounded-2xl text-text-main focus:outline-none focus:border-brand-primary transition-colors min-h-[100px]"
                                  required
                                />
                              </div>
                              <button
                                type="submit"
                                disabled={submitting || !proof}
                                className="w-full py-4 bg-brand-primary hover:bg-brand-secondary disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 transition-all duration-300 flex items-center justify-center gap-2"
                              >
                                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5" /> {isVerified ? 'Submit Proof' : 'Verify & Submit'}</>}
                              </button>
                            </form>
                          </motion.div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmation && selectedTask && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !submitting && setShowConfirmation(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-bg-card border border-border-main rounded-[2.5rem] overflow-hidden shadow-2xl p-8"
            >
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-main">Confirm Submission</h3>
                    <p className="text-text-muted text-xs font-medium">Please review your task details</p>
                  </div>
                </div>

                <div className="p-5 rounded-3xl bg-bg-main border border-border-main space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-border-main/50">
                    <span className="text-text-muted text-xs font-medium">Task</span>
                    <span className="text-text-main text-sm font-bold">{selectedTask.title}</span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-border-main/50">
                    <span className="text-text-muted text-xs font-medium">Reward</span>
                    <span className="text-brand-primary text-sm font-black">₹{selectedTask.reward}</span>
                  </div>
                  <div className="space-y-2 pt-1">
                    <span className="text-text-muted text-[10px] font-black uppercase tracking-widest ">Your Proof</span>
                    <div className="p-3 bg-bg-card rounded-xl border border-border-main/50">
                      <p className="text-text-main text-xs font-medium italic break-words line-clamp-3">
                        "{proof}"
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    disabled={submitting}
                    onClick={() => setShowConfirmation(false)}
                    className="flex-1 py-4 bg-bg-main border border-border-main text-text-main font-bold rounded-2xl hover:bg-bg-card transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={submitting}
                    onClick={handleSubmitProof}
                    className="flex-[2] py-4 bg-brand-primary hover:bg-brand-secondary text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" />
                        Confirm Submit
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <SecurityVerification 
        isOpen={isVerifying} 
        onClose={() => setIsVerifying(false)} 
        onVerify={(valid) => {
          if (valid) {
            setIsVerified(true);
            toast.success('Verification successful!');
            setShowConfirmation(true);
          }
        }}
      />
    </div>
  );
}
