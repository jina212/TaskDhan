import React from 'react';
import { motion } from 'framer-motion';
import { Bell, CheckCircle2, AlertCircle, Info, Trash2, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'success' | 'warning' | 'info';
  read: boolean;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Withdrawal Successful',
    message: 'Your withdrawal of ₹500 has been processed successfully.',
    time: '2 hours ago',
    type: 'success',
    read: false,
  },
  {
    id: '2',
    title: 'New Task Available',
    message: 'A new high-paying task "Install PhonePe" is now available.',
    time: '5 hours ago',
    type: 'info',
    read: false,
  },
  {
    id: '3',
    title: 'Daily Streak Reminder',
    message: 'Don\'t forget to claim your daily bonus to keep your streak alive!',
    time: '1 day ago',
    type: 'warning',
    read: true,
  },
  {
    id: '4',
    title: 'Referral Bonus Received',
    message: 'You earned ₹10 from your friend\'s first task completion.',
    time: '2 days ago',
    type: 'success',
    read: true,
  },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = React.useState(mockNotifications);

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-4">
      <div className="flex items-center justify-between px-2">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Notifications</h1>
          <p className="text-text-muted text-sm">Stay updated with your earnings</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={markAllRead}
            className="text-xs font-bold text-brand-primary hover:underline"
          >
            Mark all read
          </button>
          <span className="text-border-main">|</span>
          <button 
            onClick={clearAll}
            className="text-xs font-bold text-red-500 hover:underline"
          >
            Clear all
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notification, i) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => markAsRead(notification.id)}
              className={cn(
                "p-4 rounded-2xl border transition-all duration-300 cursor-pointer group relative",
                notification.read 
                  ? "bg-bg-card/50 border-border-main/50 opacity-75" 
                  : "bg-bg-card border-border-main shadow-sm"
              )}
            >
              <div className="flex gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                  notification.type === 'success' && "bg-green-500/10 text-green-500",
                  notification.type === 'warning' && "bg-yellow-500/10 text-yellow-500",
                  notification.type === 'info' && "bg-blue-500/10 text-blue-500"
                )}>
                  {notification.type === 'success' && <CheckCircle2 className="w-5 h-5" />}
                  {notification.type === 'warning' && <AlertCircle className="w-5 h-5" />}
                  {notification.type === 'info' && <Bell className="w-5 h-5" />}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className={cn(
                      "font-bold text-sm",
                      notification.read ? "text-text-muted" : "text-text-main"
                    )}>
                      {notification.title}
                    </h3>
                    <span className="text-[10px] text-text-muted font-medium">{notification.time}</span>
                  </div>
                  <p className="text-text-muted text-xs leading-relaxed">
                    {notification.message}
                  </p>
                </div>
              </div>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteNotification(notification.id);
                }}
                className="absolute top-4 right-4 p-1 text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-20 space-y-4">
            <div className="w-20 h-20 bg-bg-card border border-border-main rounded-full flex items-center justify-center mx-auto text-text-muted">
              <Bell className="w-10 h-10 opacity-20" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-main">No notifications yet</h3>
              <p className="text-text-muted text-sm">We'll notify you when something happens</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
