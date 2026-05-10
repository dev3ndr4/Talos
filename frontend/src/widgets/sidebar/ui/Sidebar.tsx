import React, { useEffect } from 'react';
import { useChatStore, AgentType } from '@/entities/chat/model/store';
import { useUserStore } from '@/entities/user/model/store';
import {
  Plus,
  MessageSquare,
  LogOut,
  User as UserIcon,
  Code,
  Library,
  MessageCircle,
  LayoutGrid,
} from 'lucide-react';
import { clsx } from 'clsx';

export const Sidebar = () => {
  const {
    sessions,
    currentSession,
    fetchSessions,
    createSession,
    setCurrentSession,
    activeAgent,
    setActiveAgent,
  } = useChatStore();
  const { user, logout } = useUserStore();

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const agents: { type: AgentType; icon: React.ReactNode; label: string }[] = [
    { type: 'coding', icon: <Code size={20} strokeWidth={1.5} />, label: 'Coding' },
    { type: 'knowledge', icon: <Library size={20} strokeWidth={1.5} />, label: 'Knowledge' },
    { type: 'comms', icon: <MessageCircle size={20} strokeWidth={1.5} />, label: 'Comms' },
  ];

  return (
    <>
      {/* Navigation Rail - High-level Domain Switching */}
      <nav className="nav-rail">
        <div className="nav-rail-logo">
          <LayoutGrid size={24} strokeWidth={2.5} />
        </div>

        <div className="nav-rail-items">
          {agents.map((agent) => (
            <button
              key={agent.type}
              onClick={() => setActiveAgent(agent.type)}
              className={clsx('nav-rail-item', activeAgent === agent.type && 'active')}
            >
              {agent.icon}
              <span className="nav-rail-tooltip">{agent.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main Sidebar - Session Management */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <button
            onClick={() => createSession(`New Chat ${sessions.length + 1}`)}
            className="btn btn-surface w-full justify-between group"
            style={{ padding: 'var(--spacing-3) var(--spacing-4)' }}
          >
            <div className="flex items-center gap-2">
              <Plus size={18} strokeWidth={1.5} className="text-primary" />
              <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>New Conversation</span>
            </div>
            <span
              style={{ fontSize: '10px' }}
              className="text-text-subtle group-hover:text-primary transition-colors"
            >
              ⌘N
            </span>
          </button>
        </div>

        <div className="sidebar-content">
          <div className="sidebar-section-title">Recent Chats</div>
          <div className="flex flex-col gap-1">
            {sessions.map((session) => (
              <button
                key={session.id}
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
                <span className="truncate flex-1">{session.title}</span>
                {currentSession?.id === session.id && <div className="active-indicator" />}
              </button>
            ))}
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-profile-card">
            <div className="user-avatar">
              <UserIcon size={16} strokeWidth={1.5} />
            </div>
            <div className="user-info">
              <p className="user-name">{user?.email?.split('@')[0] || 'User'}</p>
              <p className="user-plan">Free Plan</p>
            </div>
          </div>

          <button onClick={logout} className="sign-out-btn">
            <LogOut size={14} strokeWidth={1.5} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
