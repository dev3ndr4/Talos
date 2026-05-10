import React, { useEffect, useState } from 'react';
import { useChatStore, ChatSession, ChatFolder } from '@/entities/chat/model/store';
import { useUserStore } from '@/entities/user/model/store';
import { useUIStore } from '@/shared/model/ui-store';
import {
  Plus,
  MessageSquare,
  LogOut,
  User as UserIcon,
  Search,
  FolderPlus,
  Folder,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  FolderOpen,
} from 'lucide-react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

export const Sidebar = () => {
  const {
    sessions,
    folders,
    currentSession,
    fetchSessions,
    createSession,
    setCurrentSession,
    createFolder,
    toggleFolderExpanded,
    moveChatToFolder,
  } = useChatStore();
  const { user, logout } = useUserStore();
  const { sidebarOpen } = useUIStore();
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFolderName.trim()) {
      createFolder(newFolderName.trim());
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  };

  const uncategorizedSessions = sessions.filter(
    (s) => !folders.some((f) => f.session_ids.includes(s.id))
  );

  const renderSession = (session: ChatSession) => (
    <motion.button
      key={session.id}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      onClick={() => setCurrentSession(session)}
      className={clsx('nav-item group relative', currentSession?.id === session.id && 'active')}
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

      {/* Folder Assignment Dropdown Placeholder */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        <select
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => moveChatToFolder(session.id, e.target.value || null)}
          className="bg-transparent border-none text-[10px] text-text-subtle focus:ring-0 cursor-pointer w-4 h-4 p-0 appearance-none"
          value={folders.find((f) => f.session_ids.includes(session.id))?.id || ''}
          title="Move to folder"
        >
          <option value="">None</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
        <Folder size={12} className="text-text-subtle" />
      </div>
    </motion.button>
  );

  return (
    <aside className={clsx('sidebar', !sidebarOpen && 'collapsed')}>
      <div className="sidebar-header">
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold">
              T
            </div>
            <span className="font-bold text-lg tracking-tight">Talos</span>
          </div>
          <button
            onClick={() => setIsCreatingFolder(!isCreatingFolder)}
            className="btn btn-ghost p-1.5 hover:bg-white/50"
            title="New Folder"
          >
            <FolderPlus size={18} strokeWidth={1.5} className="text-text-subtle" />
          </button>
        </div>

        <button
          onClick={() => createSession(`New Chat ${sessions.length + 1}`)}
          className="btn btn-primary w-full justify-start gap-3 shadow-md mb-4"
          style={{ padding: 'var(--spacing-3) var(--spacing-4)', borderRadius: 'var(--radius-md)' }}
        >
          <Plus size={18} strokeWidth={2.5} />
          <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>New Chat</span>
        </button>

        <div className="px-2 mb-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-subtle"
              size={14}
            />
            <input
              type="text"
              placeholder="Search conversations..."
              className="w-full bg-white/50 border border-muted-subtle rounded-full py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="sidebar-content">
        {isCreatingFolder && (
          <form onSubmit={handleCreateFolder} className="px-3 mb-4">
            <input
              autoFocus
              type="text"
              placeholder="Folder name..."
              className="w-full bg-white border border-primary/20 rounded-md py-1.5 px-3 text-xs focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onBlur={() => !newFolderName && setIsCreatingFolder(false)}
            />
          </form>
        )}

        {folders.length > 0 && (
          <div className="mb-6">
            <div className="sidebar-section-title">Folders</div>
            <div className="flex flex-col gap-1">
              {folders.map((folder) => (
                <div key={folder.id} className="flex flex-col gap-0.5">
                  <button
                    onClick={() => toggleFolderExpanded(folder.id)}
                    className="nav-item hover:bg-white/30"
                  >
                    {folder.is_expanded ? (
                      <ChevronDown size={14} strokeWidth={1.5} className="text-text-subtle" />
                    ) : (
                      <ChevronRight size={14} strokeWidth={1.5} className="text-text-subtle" />
                    )}
                    {folder.is_expanded ? (
                      <FolderOpen size={16} strokeWidth={1.5} className="text-primary/70" />
                    ) : (
                      <Folder size={16} strokeWidth={1.5} className="text-primary/70" />
                    )}
                    <span className="truncate flex-1 font-semibold text-xs text-text-main">
                      {folder.name}
                    </span>
                    <span className="text-[10px] text-text-subtle bg-muted/30 px-1.5 py-0.5 rounded-full">
                      {folder.session_ids.length}
                    </span>
                  </button>
                  <AnimatePresence>
                    {folder.is_expanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden pl-4 flex flex-col gap-1"
                      >
                        {folder.session_ids.map((sid) => {
                          const session = sessions.find((s) => s.id === sid);
                          return session ? renderSession(session) : null;
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="sidebar-section-title">Recent Activity</div>
        <div className="flex flex-col gap-1">
          <AnimatePresence initial={false}>
            {uncategorizedSessions.map(renderSession)}
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
