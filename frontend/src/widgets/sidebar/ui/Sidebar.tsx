import React, { useEffect } from 'react';
import { useChatStore } from '@/entities/chat/model/store';
import { useUserStore } from '@/entities/user/model/store';
import { Plus, MessageSquare, LogOut, User as UserIcon, Search } from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export const Sidebar = () => {
  const { sessions, currentSession, fetchSessions, createSession, setCurrentSession } =
    useChatStore();
  const { user, logout } = useUserStore();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="flex items-center gap-2 mb-6 px-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
            T
          </div>
          <span className="font-bold text-lg tracking-tight">Talos</span>
        </div>

        <button
          onClick={() => createSession(`New Chat ${sessions.length + 1}`)}
          className="btn btn-primary w-full justify-start gap-3 shadow-md"
          style={{ padding: 'var(--spacing-3) var(--spacing-4)', borderRadius: 'var(--radius-md)' }}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>New Chat</span>
        </button>
      </div>

      <div className="px-4 mb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle" size={14} />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full bg-white/50 border border-muted-subtle rounded-full py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="sidebar-content">
        <div className="sidebar-section-title">Recent Activity</div>
        <div className="flex flex-col gap-1">
          <AnimatePresence initial={false}>
            {sessions.map((session) => (
              <motion.button
                key={session.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                onClick={() => setCurrentSession(session)}
                className={clsx('nav-item', currentSession?.id === session.id && 'active')}
              >
                <MessageSquare
                  size={16}
                  strokeWidth={1.5}
                  className={clsx(
                    'nav-item-icon',
                    currentSession?.id === session.id ? 'text-primary' : 'text-text-subtle'
                  )}
                />
                <span className="truncate flex-1 font-medium">{session.title}</span>
                {currentSession?.id === session.id && (
                  <motion.div
                    layoutId="active-nav-indicator"
                    className="absolute left-0 w-1 h-4 bg-primary rounded-r-full"
                  />
                )}
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </div>

      <div className="sidebar-footer">
        <div className="user-profile-card">
          <div className="user-avatar">
            <UserIcon size={16} strokeWidth={1.5} />
          </div>
          <div className="user-info">
            <p className="user-name">{user?.email?.split('@')[0] || 'User'}</p>
            <p className="user-plan">Pro Member</p>
          </div>
        </div>

        <button onClick={logout} className="sign-out-btn mt-2">
          <LogOut size={14} strokeWidth={1.5} />
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  );
};
