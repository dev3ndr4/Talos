import React, { useEffect, useState } from 'react';
import { useChatStore, ChatSession } from '@/entities/chat/model/store';
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

  const [draggedSessionId, setDraggedSessionId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);

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

  const onDragStart = (e: React.DragEvent, sessionId: string) => {
    setDraggedSessionId(sessionId);
    e.dataTransfer.setData('sessionId', sessionId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOverFolder = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    setDragOverFolderId(folderId);
  };

  const onDragLeaveFolder = () => {
    setDragOverFolderId(null);
  };

  const onDropOnFolder = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    const sessionId = e.dataTransfer.getData('sessionId');
    if (sessionId) {
      moveChatToFolder(sessionId, folderId);
    }
    setDragOverFolderId(null);
    setDraggedSessionId(null);
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
      draggable
      onDragStart={(e) => onDragStart(e, session.id)}
      onDragEnd={() => setDraggedSessionId(null)}
      onClick={() => setCurrentSession(session)}
      className={clsx(
        'nav-item group relative',
        currentSession?.id === session.id && 'active',
        draggedSessionId === session.id && 'opacity-50 grayscale scale-95'
      )}
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
                    onDragOver={(e) => onDragOverFolder(e, folder.id)}
                    onDragLeave={onDragLeaveFolder}
                    onDrop={(e) => onDropOnFolder(e, folder.id)}
                    className={clsx(
                      'nav-item hover:bg-white/30 transition-all duration-300',
                      dragOverFolderId === folder.id &&
                        'bg-primary/10 border-primary/30 border-dashed border-2 scale-[1.02] shadow-lg z-10'
                    )}
                  >
                    {folder.is_expanded ? (
                      <ChevronDown size={14} strokeWidth={1.5} className="text-text-subtle" />
                    ) : (
                      <ChevronRight size={14} strokeWidth={1.5} className="text-text-subtle" />
                    )}
                    {folder.is_expanded ? (
                      <FolderOpen
                        size={16}
                        strokeWidth={1.5}
                        className={clsx(
                          dragOverFolderId === folder.id ? 'text-primary' : 'text-primary/70'
                        )}
                      />
                    ) : (
                      <Folder
                        size={16}
                        strokeWidth={1.5}
                        className={clsx(
                          dragOverFolderId === folder.id ? 'text-primary' : 'text-primary/70'
                        )}
                      />
                    )}
                    <span
                      className={clsx(
                        'truncate flex-1 font-semibold text-xs',
                        dragOverFolderId === folder.id ? 'text-primary' : 'text-text-main'
                      )}
                    >
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
