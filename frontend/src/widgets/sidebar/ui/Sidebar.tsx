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
    <div className="flex h-full w-72 flex-col bg-bg-soft border-r border-muted-subtle">
      <div className="p-4">
        <button
          onClick={() => createSession(`New Chat ${sessions.length + 1}`)}
          className="flex w-full items-center justify-between gap-2 rounded-lg bg-surface border border-muted-subtle px-4 py-2.5 text-sm font-medium text-text-strong shadow-sm hover:bg-muted transition-all group"
        >
          <div className="flex items-center gap-2">
            <Plus size={18} strokeWidth={1.5} className="text-primary" />
            <span>New Conversation</span>
          </div>
          <span className="text-[10px] text-text-subtle group-hover:text-primary transition-colors">⌘N</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">
        <div className="px-3 mb-2">
          <p className="text-[10px] font-bold text-text-subtle uppercase tracking-widest">Recent Chats</p>
        </div>
        {sessions.map((session) => (
          <button
            key={session.id}
            onClick={() => setCurrentSession(session)}
            className={clsx(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all relative group",
              currentSession?.id === session.id
                ? "bg-surface text-text-strong shadow-sm ring-1 ring-muted-subtle"
                : "text-text-subtle hover:bg-surface/50 hover:text-text-strong"
            )}
          >
            <MessageSquare size={16} strokeWidth={1.5} className={clsx(
              "shrink-0",
              currentSession?.id === session.id ? "text-primary" : "text-text-subtle group-hover:text-primary"
            )} />
            <span className="truncate">{session.title}</span>
            {currentSession?.id === session.id && (
              <div className="absolute left-0 w-1 h-4 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      <div className="mt-auto p-4 space-y-4">
        <div className="rounded-lg bg-surface/50 border border-muted-subtle p-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white shadow-sm">
              <UserIcon size={16} strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-text-strong truncate">{user?.email?.split('@')[0]}</p>
              <p className="text-[10px] text-text-subtle font-medium">Free Plan</p>
            </div>
          </div>
        </div>
        
        <button
          onClick={logout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-text-subtle hover:bg-error/10 hover:text-error transition-all"
        >
          <LogOut size={14} strokeWidth={1.5} />
          Sign out
        </button>
      </div>
    </div>
  );
};
