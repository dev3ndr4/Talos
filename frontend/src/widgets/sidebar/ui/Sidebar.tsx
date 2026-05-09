import React, { useEffect } from 'react';
import { useChatStore } from '@/entities/chat/model/store';
import { useUserStore } from '@/entities/user/model/store';
import { Plus, MessageSquare, LogOut, User as UserIcon } from 'lucide-react';
import { clsx } from 'clsx';

export const Sidebar = () => {
  const { sessions, currentSession, fetchSessions, createSession, setCurrentSession } = useChatStore();
  const { user, logout } = useUserStore();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return (
    <div className="flex h-full w-64 flex-col bg-surface border-r border-muted">
      <div className="p-4 border-b border-muted">
        <button
          onClick={() => createSession(`New Chat ${sessions.length + 1}`)}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary/10 py-2.5 text-sm font-semibold text-primary hover:bg-primary/20 transition-colors"
        >
          <Plus size={18} strokeWidth={1.5} />
          New Conversation
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => setCurrentSession(session)}
            className={clsx(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              currentSession?.id === session.id
                ? "bg-muted text-text-strong font-medium"
                : "text-text-subtle hover:bg-muted/50 hover:text-text-strong"
            )}
          >
            <MessageSquare size={16} strokeWidth={1.5} className="shrink-0" />
            <span className="truncate">{session.title}</span>
          </button>
        ))}
      </div>

      <div className="p-4 border-t border-muted bg-muted/5">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserIcon size={16} strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-strong truncate">{user?.email}</p>
            <p className="text-[10px] text-text-subtle uppercase tracking-wider font-bold">Authenticated</p>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs font-medium text-text-subtle hover:text-error transition-colors"
        >
          <LogOut size={14} strokeWidth={1.5} />
          Sign out
        </button>
      </div>
    </div>
  );
};
