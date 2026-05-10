import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  CreditCard, 
  CheckCircle2, 
  XCircle, 
  PlusCircle, 
  Search,
  Filter,
  Loader2,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  Settings,
  ShieldAlert,
  Ban,
  Unlock,
  Edit2,
  Save,
  Power,
  Gift,
  Trash2
} from 'lucide-react';
import { collection, query, getDocs, updateDoc, doc, addDoc, orderBy, limit, where, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../AuthContext';
import { Task, Withdrawal, UserProfile, AppSettings } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { toast } from 'sonner';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'users' | 'withdrawals' | 'settings' | 'ads'>('overview');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showEditTask, setShowEditTask] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    reward: 0,
    type: 'video' as const,
    difficulty: 'easy' as const,
    duration: 30,
    sponsored: false,
    active: true
  });
  const [addingTask, setAddingTask] = useState(false);
  const [updatingTask, setUpdatingTask] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Overview & Initial Data
        const tasksSnap = await getDocs(collection(db, 'tasks'));
        setTasks(tasksSnap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));

        const withdrawalsSnap = await getDocs(query(collection(db, 'withdrawals'), orderBy('requestedAt', 'desc')));
        setWithdrawals(withdrawalsSnap.docs.map(d => ({ id: d.id, ...d.data() } as Withdrawal)));

        // Fetch Settings
        const settingsDoc = await getDoc(doc(db, 'settings', 'global'));
        if (settingsDoc.exists()) {
          setAppSettings(settingsDoc.data() as AppSettings);
        } else {
          // Initialize default settings
          const defaultSettings: AppSettings = {
            isAppLive: true,
            maintenanceMode: false,
            dailyBonusAmount: 5,
            maxSpinReward: 50,
            minSpinReward: 1,
            mysteryBoxFreeMax: 10,
            mysteryBoxPaidMax: 1000,
            mysteryBoxPaidPrice: 50,
            winProbability: 70,
            taskRewardMultiplier: 1,
            adMobEnabled: true,
            adVideoReward: 10,
            maxAdsPerDay: 20,
            ytVideoLink: 'https://youtube.com',
            announcement: 'Welcome to the platform! Complete tasks and earn money daily.',
            supportTelegram: 'https://t.me/example',
            minWithdrawal: 100,
            referralReward: 5
          };
          await setDoc(doc(db, 'settings', 'global'), defaultSettings);
          setAppSettings(defaultSettings);
        }

        // Fetch Users (optional: limit if many)
        if (activeTab === 'users') {
          const usersSnap = await getDocs(query(collection(db, 'users'), limit(200)));
          setAllUsers(usersSnap.docs.map(d => d.data() as UserProfile));
        }

      } catch (error) {
        console.error('Admin fetch error:', error);
        toast.error('Error fetching admin data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeTab]);

  const handleUpdateSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appSettings) return;
    setSavingSettings(true);
    try {
      await updateDoc(doc(db, 'settings', 'global'), { ...appSettings });
      toast.success('Settings updated successfully!');
    } catch (error) {
      toast.error('Failed to update settings');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleUserAction = async (uid: string, action: 'ban' | 'unban' | 'edit_balance') => {
    try {
      const userRef = doc(db, 'users', uid);
      if (action === 'ban') {
        await updateDoc(userRef, { isBanned: true });
        setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, isBanned: true } : u));
        toast.success('User banned');
      } else if (action === 'unban') {
        await updateDoc(userRef, { isBanned: false });
        setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, isBanned: false } : u));
        toast.success('User unblocked');
      }
    } catch (error) {
      toast.error('Action failed');
    }
  };

  const handleEditBalance = async (uid: string, newBalance: number) => {
    try {
      await updateDoc(doc(db, 'users', uid), { balance: newBalance });
      setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, balance: newBalance } : u));
      toast.success('Balance updated');
    } catch (error) {
      toast.error('Failed to update balance');
    }
  };

  const handleEditCoins = async (uid: string, newCoins: number) => {
    try {
      await updateDoc(doc(db, 'users', uid), { coins: newCoins });
      setAllUsers(prev => prev.map(u => u.uid === uid ? { ...u, coins: newCoins } : u));
      toast.success('Coins updated');
    } catch (error) {
      toast.error('Failed to update coins');
    }
  };

  const handleApproveWithdrawal = async (withdrawal: Withdrawal) => {
    try {
      await updateDoc(doc(db, 'withdrawals', withdrawal.id), {
        status: 'approved',
        processedAt: new Date().toISOString()
      });
      toast.success('Withdrawal approved!');
      // Refresh data
      setWithdrawals(prev => prev.map(w => w.id === withdrawal.id ? { ...w, status: 'approved' } : w));
    } catch (error) {
      toast.error('Failed to approve');
    }
  };

  const handleRejectWithdrawal = async (withdrawal: Withdrawal) => {
    try {
      await updateDoc(doc(db, 'withdrawals', withdrawal.id), {
        status: 'rejected',
        processedAt: new Date().toISOString()
      });
      toast.success('Withdrawal rejected');
      setWithdrawals(prev => prev.map(w => w.id === withdrawal.id ? { ...w, status: 'rejected' } : w));
    } catch (error) {
      toast.error('Failed to reject');
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingTask(true);
    try {
      const taskData = {
        ...newTask,
        createdAt: new Date().toISOString()
      };
      const docRef = await addDoc(collection(db, 'tasks'), taskData);
      setTasks(prev => [{ id: docRef.id, ...taskData } as Task, ...prev]);
      setShowAddTask(false);
      setNewTask({
        title: '',
        description: '',
        reward: 0,
        type: 'video',
        difficulty: 'easy',
        duration: 30,
        sponsored: false,
        active: true
      });
      toast.success('Task added successfully!');
    } catch (error) {
      console.error('Error adding task:', error);
      toast.error('Failed to add task');
    } finally {
      setAddingTask(false);
    }
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setUpdatingTask(true);
    try {
      const taskRef = doc(db, 'tasks', editingTask.id);
      await updateDoc(taskRef, { ...editingTask });
      setTasks(prev => prev.map(t => t.id === editingTask.id ? editingTask : t));
      setShowEditTask(false);
      setEditingTask(null);
      toast.success('Task updated successfully!');
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    } finally {
      setUpdatingTask(false);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    setDeletingTaskId(id);
    try {
      await deleteDoc(doc(db, 'tasks', id));
      setTasks(prev => prev.filter(t => t.id !== id));
      toast.success('Task deleted');
    } catch (error) {
      toast.error('Failed to delete task');
    } finally {
      setDeletingTaskId(null);
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

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-text-main">Admin Panel</h1>
        <div className="flex bg-bg-card p-1 rounded-2xl border border-border-main">
          {[
            { id: 'overview', label: 'Overview', icon: LayoutDashboard },
            { id: 'tasks', label: 'Tasks', icon: Trophy },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'withdrawals', label: 'Withdrawals', icon: CreditCard },
            { id: 'ads', label: 'Ads Control', icon: Power },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all",
                activeTab === tab.id 
                  ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20" 
                  : "text-text-muted hover:text-text-main"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
        </div>
      ) : (
        <div className="space-y-6">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-3xl bg-bg-card border border-border-main">
                <p className="text-text-muted text-sm mb-1">Total Tasks</p>
                <p className="text-3xl font-bold text-text-main">{tasks.length}</p>
              </div>
              <div className="p-6 rounded-3xl bg-bg-card border border-border-main">
                <p className="text-text-muted text-sm mb-1">Total Users</p>
                <p className="text-3xl font-bold text-text-main">{allUsers.length}</p>
              </div>
              <div className="p-6 rounded-3xl bg-bg-card border border-border-main">
                <p className="text-text-muted text-sm mb-1">Pending Withdrawals</p>
                <p className="text-3xl font-bold text-yellow-500">{withdrawals.filter(w => w.status === 'pending').length}</p>
              </div>
              <div className="p-6 rounded-3xl bg-bg-card border border-border-main">
                <p className="text-text-muted text-sm mb-1">Total Volume</p>
                <p className="text-3xl font-bold text-brand-primary">₹{withdrawals.filter(w => w.status === 'approved').reduce((acc, curr) => acc + curr.amount, 0)}</p>
              </div>
            </div>
          )}

          {activeTab === 'withdrawals' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-text-main">Withdrawal Requests</h2>
              </div>
              {withdrawals.length === 0 ? (
                <div className="p-10 text-center bg-bg-card rounded-3xl border border-border-main text-text-muted">
                  No withdrawal requests found.
                </div>
              ) : withdrawals.map((w) => (
                <div key={w.id} className="p-5 rounded-3xl bg-bg-card border border-border-main flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-bg-main flex items-center justify-center">
                      <CreditCard className="text-text-muted w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-text-main font-bold">₹{w.amount} • {w.method}</p>
                      <p className="text-text-muted text-xs">{w.details}</p>
                      <p className="text-text-muted text-[10px] mt-1 uppercase font-bold tracking-widest opacity-50">User: {w.userId.slice(-6)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {w.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => handleApproveWithdrawal(w)}
                          className="px-4 py-2 bg-brand-primary hover:bg-brand-secondary text-white text-xs font-bold rounded-xl transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectWithdrawal(w)}
                          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-xs font-bold rounded-xl transition-colors"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest",
                        w.status === 'approved' ? "bg-brand-primary/10 text-brand-primary" : "bg-red-500/10 text-red-500"
                      )}>
                        {w.status}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'tasks' && (
            <div className="space-y-4">
              <button 
                onClick={() => setShowAddTask(!showAddTask)}
                className="w-full p-4 rounded-2xl border-2 border-dashed border-border-main text-text-muted hover:border-brand-primary/50 hover:text-brand-primary transition-all flex items-center justify-center gap-2 font-bold"
              >
                <PlusCircle className="w-5 h-5" />
                {showAddTask ? 'Cancel' : 'Add New Task'}
              </button>

              {showAddTask && (
                <motion.form 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleAddTask}
                  className="p-6 rounded-3xl bg-bg-card border border-border-main space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase">Title</label>
                      <input 
                        type="text" 
                        required
                        value={newTask.title}
                        onChange={e => setNewTask({...newTask, title: e.target.value})}
                        className="w-full p-3 bg-bg-main border border-border-main rounded-xl text-text-main focus:outline-none focus:border-brand-primary"
                        placeholder="Task Title"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase">Reward (₹)</label>
                      <input 
                        type="number" 
                        required
                        value={newTask.reward}
                        onChange={e => setNewTask({...newTask, reward: Number(e.target.value)})}
                        className="w-full p-3 bg-bg-main border border-border-main rounded-xl text-text-main focus:outline-none focus:border-brand-primary"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Description</label>
                    <textarea 
                      required
                      value={newTask.description}
                      onChange={e => setNewTask({...newTask, description: e.target.value})}
                      className="w-full p-3 bg-bg-main border border-border-main rounded-xl text-text-main focus:outline-none focus:border-brand-primary min-h-[80px]"
                      placeholder="Task description and instructions..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase">Type</label>
                      <select 
                        value={newTask.type}
                        onChange={e => setNewTask({...newTask, type: e.target.value as any})}
                        className="w-full p-3 bg-bg-main border border-border-main rounded-xl text-text-main focus:outline-none focus:border-brand-primary"
                      >
                        <option value="video">Video</option>
                        <option value="download">Download</option>
                        <option value="form">Form</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase">Difficulty</label>
                      <select 
                        value={newTask.difficulty}
                        onChange={e => setNewTask({...newTask, difficulty: e.target.value as any})}
                        className="w-full p-3 bg-bg-main border border-border-main rounded-xl text-text-main focus:outline-none focus:border-brand-primary"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase">Duration (sec)</label>
                      <input 
                        type="number" 
                        required
                        value={newTask.duration}
                        onChange={e => setNewTask({...newTask, duration: Number(e.target.value)})}
                        className="w-full p-3 bg-bg-main border border-border-main rounded-xl text-text-main focus:outline-none focus:border-brand-primary"
                        placeholder="30"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={newTask.sponsored}
                        onChange={e => setNewTask({...newTask, sponsored: e.target.checked})}
                        className="w-4 h-4 rounded border-border-main text-brand-primary focus:ring-brand-primary"
                      />
                      <span className="text-sm font-bold text-text-main">Sponsored</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={newTask.active}
                        onChange={e => setNewTask({...newTask, active: e.target.checked})}
                        className="w-4 h-4 rounded border-border-main text-brand-primary focus:ring-brand-primary"
                      />
                      <span className="text-sm font-bold text-text-main">Active</span>
                    </label>
                  </div>

                  <button 
                    type="submit"
                    disabled={addingTask}
                    className="w-full py-4 bg-brand-primary hover:bg-brand-secondary disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 transition-all flex items-center justify-center gap-2"
                  >
                    {addingTask ? <Loader2 className="w-5 h-5 animate-spin" /> : <><PlusCircle className="w-5 h-5" /> Create Task</>}
                  </button>
                </motion.form>
              )}

              {showEditTask && editingTask && (
                <motion.form 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onSubmit={handleUpdateTask}
                  className="p-6 rounded-3xl bg-bg-card border-2 border-brand-primary/30 space-y-4 shadow-xl"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-text-main">Edit Task</h3>
                    <button 
                      type="button"
                      onClick={() => {
                        setShowEditTask(false);
                        setEditingTask(null);
                      }}
                      className="p-2 hover:bg-bg-main rounded-full text-text-muted transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase">Title</label>
                      <input 
                        type="text" 
                        required
                        value={editingTask.title}
                        onChange={e => setEditingTask({...editingTask, title: e.target.value})}
                        className="w-full p-3 bg-bg-main border border-border-main rounded-xl text-text-main focus:outline-none focus:border-brand-primary"
                        placeholder="Task Title"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase">Reward (₹)</label>
                      <input 
                        type="number" 
                        required
                        value={editingTask.reward}
                        onChange={e => setEditingTask({...editingTask, reward: Number(e.target.value)})}
                        className="w-full p-3 bg-bg-main border border-border-main rounded-xl text-text-main focus:outline-none focus:border-brand-primary"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Description</label>
                    <textarea 
                      required
                      value={editingTask.description}
                      onChange={e => setEditingTask({...editingTask, description: e.target.value})}
                      className="w-full p-3 bg-bg-main border border-border-main rounded-xl text-text-main focus:outline-none focus:border-brand-primary min-h-[80px]"
                      placeholder="Task description and instructions..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase">Type</label>
                      <select 
                        value={editingTask.type}
                        onChange={e => setEditingTask({...editingTask, type: e.target.value as any})}
                        className="w-full p-3 bg-bg-main border border-border-main rounded-xl text-text-main focus:outline-none focus:border-brand-primary"
                      >
                        <option value="video">Video</option>
                        <option value="download">Download</option>
                        <option value="form">Form</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase">Difficulty</label>
                      <select 
                        value={editingTask.difficulty}
                        onChange={e => setEditingTask({...editingTask, difficulty: e.target.value as any})}
                        className="w-full p-3 bg-bg-main border border-border-main rounded-xl text-text-main focus:outline-none focus:border-brand-primary"
                      >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-text-muted uppercase">Duration (sec)</label>
                      <input 
                        type="number" 
                        required
                        value={editingTask.duration}
                        onChange={e => setEditingTask({...editingTask, duration: Number(e.target.value)})}
                        className="w-full p-3 bg-bg-main border border-border-main rounded-xl text-text-main focus:outline-none focus:border-brand-primary"
                        placeholder="30"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editingTask.sponsored}
                        onChange={e => setEditingTask({...editingTask, sponsored: e.target.checked})}
                        className="w-4 h-4 rounded border-border-main text-brand-primary focus:ring-brand-primary"
                      />
                      <span className="text-sm font-bold text-text-main">Sponsored</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={editingTask.active}
                        onChange={e => setEditingTask({...editingTask, active: e.target.checked})}
                        className="w-4 h-4 rounded border-border-main text-brand-primary focus:ring-brand-primary"
                      />
                      <span className="text-sm font-bold text-text-main">Active</span>
                    </label>
                  </div>

                  <div className="flex gap-3">
                    <button 
                      type="button"
                      onClick={() => {
                        setShowEditTask(false);
                        setEditingTask(null);
                      }}
                      className="flex-1 py-4 bg-bg-main border border-border-main text-text-main font-bold rounded-2xl hover:bg-bg-card transition-all"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      disabled={updatingTask}
                      className="flex-[2] py-4 bg-brand-primary hover:bg-brand-secondary disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-brand-primary/20 transition-all flex items-center justify-center gap-2"
                    >
                      {updatingTask ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Changes</>}
                    </button>
                  </div>
                </motion.form>
              )}

              <div className="grid grid-cols-1 gap-3 mt-4">
                {tasks.map((t) => (
                  <div key={t.id} className="p-4 rounded-2xl bg-bg-card border border-border-main flex items-center justify-between hover:border-brand-primary/20 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary font-bold">
                        {t.type[0].toUpperCase()}
                      </div>
                      <div>
                        <h4 className="text-text-main font-bold text-sm tracking-tight">{t.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-text-muted text-[10px] font-bold">₹{t.reward}</p>
                          <span className={cn("px-1.5 py-0.5 rounded text-[8px] font-bold uppercase border", getDifficultyColor(t.difficulty))}>
                            {t.difficulty}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase mr-2",
                        t.active ? "bg-brand-primary/10 text-brand-primary" : "bg-red-500/10 text-red-500"
                      )}>
                        {t.active ? 'Active' : 'Inactive'}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingTask(t);
                            setShowEditTask(true);
                            setShowAddTask(false);
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="p-2 hover:bg-bg-main rounded-lg text-blue-500 transition-colors"
                          title="Edit Task"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTask(t.id)}
                          disabled={deletingTaskId === t.id}
                          className="p-2 hover:bg-bg-main rounded-lg text-rose-500 transition-colors disabled:opacity-50"
                          title="Delete Task"
                        >
                          {deletingTaskId === t.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4 bg-bg-card p-4 rounded-3xl border border-border-main">
                <Search className="w-5 h-5 text-text-muted" />
                <input 
                  type="text" 
                  placeholder="Search user by name or phone..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none focus:ring-0 text-text-main text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allUsers.filter(u => 
                  u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                  u.phoneNumber.includes(searchQuery)
                ).length === 0 ? (
                  <div className="col-span-full p-12 text-center bg-bg-card rounded-3xl border border-border-main text-text-muted">
                    <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                    <p className="font-bold">No users found matching "{searchQuery}"</p>
                    <p className="text-xs">Try a different name or phone number</p>
                  </div>
                ) : (
                  allUsers.filter(u => 
                    u.displayName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                    u.phoneNumber.includes(searchQuery)
                  ).map(u => (
                    <div key={u.uid} className={cn(
                      "p-6 rounded-[2rem] bg-bg-card border transition-all",
                      u.isBanned ? "border-red-500/50 bg-red-500/5" : "border-border-main"
                    )}>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-bg-main flex items-center justify-center text-text-muted font-black text-xl">
                          {u.displayName[0]}
                        </div>
                        <div>
                          <h4 className="font-bold text-text-main flex items-center gap-2">
                            {u.displayName}
                            {u.isBanned && <Ban className="w-3 h-3 text-red-500" />}
                          </h4>
                          <p className="text-text-muted text-xs">{u.phoneNumber}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-brand-primary font-black">{formatCurrency(u.balance)}</p>
                        <p className="text-amber-500 font-bold text-xs">{u.coins} Coins</p>
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest">{u.role}</p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-4">
                      <div className="col-span-2 grid grid-cols-2 gap-2">
                        <button 
                          onClick={() => {
                            const amount = prompt("Enter new balance (INR):", u.balance.toString());
                            if (amount !== null) handleEditBalance(u.uid, Number(amount));
                          }}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-bg-main border border-border-main text-text-main text-[10px] font-black uppercase tracking-wider hover:border-brand-primary transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Balance
                        </button>
                        <button 
                          onClick={() => {
                            const amount = prompt("Enter new coins amount:", u.coins.toString());
                            if (amount !== null) handleEditCoins(u.uid, Number(amount));
                          }}
                          className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-bg-main border border-border-main text-text-main text-[10px] font-black uppercase tracking-wider hover:border-amber-500 transition-all"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Coins
                        </button>
                      </div>
                      <button 
                        onClick={() => handleUserAction(u.uid, u.isBanned ? 'unban' : 'ban')}
                        className={cn(
                          "col-span-2 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                          u.isBanned 
                            ? "bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20" 
                            : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                        )}
                      >
                        {u.isBanned ? <><Unlock className="w-3.5 h-3.5" /> Unblock Account</> : <><Ban className="w-3.5 h-3.5" /> Suspend Account</>}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

          {activeTab === 'ads' && appSettings && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div className="p-8 rounded-[3rem] bg-bg-card border border-border-main space-y-8">
                <div className="flex items-center gap-3 text-brand-primary">
                  <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 flex items-center justify-center">
                    <Power className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-text-main tracking-tight">Ads Configurations</h3>
                    <p className="text-text-muted text-xs font-bold uppercase tracking-widest">Master ads control & rewards</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 rounded-[2rem] bg-bg-main/50 border border-border-main flex items-center justify-between">
                    <div>
                      <p className="font-black text-text-main">AdMob Network</p>
                      <p className="text-text-muted text-xs font-medium">Enable or disable third-party ads</p>
                    </div>
                    <button 
                      onClick={() => setAppSettings({...appSettings, adMobEnabled: !appSettings.adMobEnabled})}
                      className={cn(
                        "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                        appSettings.adMobEnabled ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-red-500 text-white"
                      )}
                    >
                      {appSettings.adMobEnabled ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>

                  <div className="p-6 rounded-[2rem] bg-bg-main/50 border border-border-main space-y-4">
                    <div>
                      <p className="font-black text-text-main">Daily Ad Limit</p>
                      <p className="text-text-muted text-xs font-medium">Max ads a user can watch per day</p>
                    </div>
                    <input 
                      type="number"
                      value={appSettings.maxAdsPerDay}
                      onChange={e => setAppSettings({...appSettings, maxAdsPerDay: Number(e.target.value)})}
                      className="w-full p-4 bg-bg-card border border-border-main rounded-2xl text-text-main font-bold focus:border-brand-primary outline-none"
                    />
                  </div>

                  <div className="p-6 rounded-[2rem] bg-bg-main/50 border border-border-main space-y-4">
                    <div>
                      <p className="font-black text-text-main">Video Reward (Coins)</p>
                      <p className="text-text-muted text-xs font-medium">Coins earned per video ad</p>
                    </div>
                    <input 
                      type="number"
                      value={appSettings.adVideoReward}
                      onChange={e => setAppSettings({...appSettings, adVideoReward: Number(e.target.value)})}
                      className="w-full p-4 bg-bg-card border border-border-main rounded-2xl text-text-main font-bold focus:border-brand-primary outline-none"
                    />
                  </div>

                  <div className="p-6 rounded-[2rem] bg-bg-main/50 border border-border-main space-y-4">
                    <div>
                      <p className="font-black text-text-main">Primary Video Link</p>
                      <p className="text-text-muted text-xs font-medium">Default video URL for rewards</p>
                    </div>
                    <input 
                      type="text"
                      value={appSettings.ytVideoLink}
                      onChange={e => setAppSettings({...appSettings, ytVideoLink: e.target.value})}
                      className="w-full p-4 bg-bg-card border border-border-main rounded-2xl text-text-main font-bold focus:border-brand-primary outline-none"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'settings' && appSettings && (
            <motion.form 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleUpdateSettings}
              className="space-y-8 pb-20"
            >
              {/* Global Control */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-brand-primary" />
                  Global Control
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-6 rounded-3xl bg-bg-card border border-border-main flex items-center justify-between">
                    <div>
                      <p className="font-bold text-text-main">App Status</p>
                      <p className="text-text-muted text-xs">Turn App ON or OFF globally</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setAppSettings({...appSettings, isAppLive: !appSettings.isAppLive})}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                        appSettings.isAppLive ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
                      )}
                    >
                      {appSettings.isAppLive ? 'APP ON' : 'APP OFF'}
                    </button>
                  </div>
                  <div className="p-6 rounded-3xl bg-bg-card border border-border-main flex items-center justify-between">
                    <div>
                      <p className="font-bold text-text-main">Maintenance Mode</p>
                      <p className="text-text-muted text-xs">Show maintenance msg to users</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setAppSettings({...appSettings, maintenanceMode: !appSettings.maintenanceMode})}
                      className={cn(
                        "px-4 py-2 rounded-xl text-xs font-bold transition-all",
                        appSettings.maintenanceMode ? "bg-orange-500 text-white" : "bg-bg-main border border-border-main text-text-muted"
                      )}
                    >
                      {appSettings.maintenanceMode ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>
                </div>

                <div className="p-6 rounded-3xl bg-bg-card border border-border-main space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Global Announcement</label>
                    <textarea 
                      value={appSettings.announcement}
                      onChange={e => setAppSettings({...appSettings, announcement: e.target.value})}
                      className="w-full p-4 bg-bg-main border border-border-main rounded-2xl text-text-main min-h-[100px] focus:border-brand-primary outline-none"
                      placeholder="Type important notice here for all users..."
                    />
                  </div>
                </div>
              </div>

              {/* Support & Links */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                  <Power className="w-5 h-5 text-brand-primary" />
                  Support & Platform Links
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-3xl bg-bg-card border border-border-main">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Telegram Support Group</label>
                    <input 
                      type="text" 
                      value={appSettings.supportTelegram}
                      onChange={e => setAppSettings({...appSettings, supportTelegram: e.target.value})}
                      className="w-full p-3 bg-bg-main border border-border-main rounded-xl text-text-main"
                      placeholder="https://t.me/..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">YouTube Tutorial Link</label>
                    <input 
                      type="text" 
                      value={appSettings.ytVideoLink}
                      onChange={e => setAppSettings({...appSettings, ytVideoLink: e.target.value})}
                      className="w-full p-3 bg-bg-main border border-border-main rounded-xl text-text-main"
                      placeholder="https://youtube.com/..."
                    />
                  </div>
                </div>
              </div>

              {/* Reward Control */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-brand-primary" />
                  Earning & Reward Control
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-3xl bg-bg-card border border-border-main">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Daily Bonus (₹)</label>
                    <input 
                      type="number" 
                      value={appSettings.dailyBonusAmount}
                      onChange={e => setAppSettings({...appSettings, dailyBonusAmount: Number(e.target.value)})}
                      className="w-full p-3 bg-bg-main border border-border-main rounded-xl text-text-main"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Min Spin Reward (Coins)</label>
                    <input 
                      type="number" 
                      value={appSettings.minSpinReward}
                      onChange={e => setAppSettings({...appSettings, minSpinReward: Number(e.target.value)})}
                      className="w-full p-3 bg-bg-main border border-border-main rounded-xl text-text-main"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Max Spin Reward (Coins)</label>
                    <input 
                      type="number" 
                      value={appSettings.maxSpinReward}
                      onChange={e => setAppSettings({...appSettings, maxSpinReward: Number(e.target.value)})}
                      className="w-full p-3 bg-bg-main border border-border-main rounded-xl text-text-main"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Win Probability (%)</label>
                    <input 
                      type="number" 
                      min="0" max="100"
                      value={appSettings.winProbability}
                      onChange={e => setAppSettings({...appSettings, winProbability: Number(e.target.value)})}
                      className="w-full p-3 bg-bg-main border border-border-main rounded-xl text-text-main"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Task Reward Multiplier</label>
                    <input 
                      type="number" 
                      step="0.1"
                      value={appSettings.taskRewardMultiplier}
                      onChange={e => setAppSettings({...appSettings, taskRewardMultiplier: Number(e.target.value)})}
                      className="w-full p-3 bg-bg-main border border-border-main rounded-xl text-text-main"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Min Withdrawal (₹)</label>
                    <input 
                      type="number" 
                      value={appSettings.minWithdrawal}
                      onChange={e => setAppSettings({...appSettings, minWithdrawal: Number(e.target.value)})}
                      className="w-full p-3 bg-bg-main border border-border-main rounded-xl text-text-main"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Referral Reward (₹)</label>
                    <input 
                      type="number" 
                      value={appSettings.referralReward}
                      onChange={e => setAppSettings({...appSettings, referralReward: Number(e.target.value)})}
                      className="w-full p-3 bg-bg-main border border-border-main rounded-xl text-text-main"
                    />
                  </div>
                </div>
              </div>

              {/* Mystery Box Control */}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
                  <Gift className="w-5 h-5 text-brand-primary" />
                  Mystery Box Control
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-3xl bg-bg-card border border-border-main">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Free Box Max Reward (₹)</label>
                    <input 
                      type="number" 
                      value={appSettings.mysteryBoxFreeMax}
                      onChange={e => setAppSettings({...appSettings, mysteryBoxFreeMax: Number(e.target.value)})}
                      className="w-full p-3 bg-bg-main border border-border-main rounded-xl text-text-main"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Paid Box Max Reward (₹)</label>
                    <input 
                      type="number" 
                      value={appSettings.mysteryBoxPaidMax}
                      onChange={e => setAppSettings({...appSettings, mysteryBoxPaidMax: Number(e.target.value)})}
                      className="w-full p-3 bg-bg-main border border-border-main rounded-xl text-text-main"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Paid Box Price (₹)</label>
                    <input 
                      type="number" 
                      value={appSettings.mysteryBoxPaidPrice}
                      onChange={e => setAppSettings({...appSettings, mysteryBoxPaidPrice: Number(e.target.value)})}
                      className="w-full p-3 bg-bg-main border border-border-main rounded-xl text-text-main"
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                disabled={savingSettings}
                className="fixed bottom-24 right-4 md:right-8 px-8 py-4 bg-brand-primary hover:bg-brand-secondary text-white font-black rounded-2xl shadow-xl shadow-brand-primary/20 transition-all flex items-center gap-2 z-[60]"
              >
                {savingSettings ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save All Settings</>}
              </button>
            </motion.form>
          )}
        </div>
      )}
    </div>
  );
}
