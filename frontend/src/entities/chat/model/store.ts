import { create } from 'zustand';
import { api } from '@/shared/api/base';
import { useUserStore } from '@/entities/user/model/store';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning_trace?: string;
  email_draft?: {
    to?: string;
    subject: string;
    body: string;
  };
  created_at: string;
  error?: string;
}

export interface ChatSession {
  id: string;
  title: string;
  chat_summary: string;
  updated_at: string;
}

export interface ChatFolder {
  id: string;
  name: string;
  session_ids: string[];
  is_expanded: boolean;
}

export type AgentType = 'simple' | 'knowledge' | 'comms' | 'coding';

interface ChatStore {
  sessions: ChatSession[];
  folders: ChatFolder[];
  currentSession: ChatSession | null;
  messages: Message[];
  activeAgent: AgentType;
  isLoading: boolean;
  isSending: boolean;
  abortController: AbortController | null;
  fetchSessions: () => Promise<void>;
  fetchFolders: () => Promise<void>;
  setCurrentSession: (session: ChatSession) => Promise<void>;
  createSession: (title: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  terminateMessage: () => void;
  retryMessage: (messageId: string) => Promise<void>;
  setActiveAgent: (agent: AgentType) => void;
  // Folder methods
  createFolder: (name: string) => Promise<void>;
  deleteFolder: (folderId: string) => Promise<void>;
  updateFolder: (folderId: string, updates: Partial<ChatFolder>) => Promise<void>;
  toggleFolderExpanded: (folderId: string) => Promise<void>;
  moveChatToFolder: (sessionId: string, folderId: string | null) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  sessions: [],
  folders: [],
  currentSession: null,
  messages: [],
  activeAgent: 'simple',
  isLoading: false,
  isSending: false,
  abortController: null,

  setActiveAgent: (agent) => set({ activeAgent: agent }),

  terminateMessage: () => {
    const { abortController } = get();
    if (abortController) {
      abortController.abort();
      set({ isSending: false, abortController: null });
    }
  },

  fetchSessions: async () => {
    const { data } = await api.get('/chat/sessions');
    set({ sessions: data });

    // Fetch folders as well
    get().fetchFolders();

    // Try to restore session from localStorage
    const savedSessionId = localStorage.getItem('talos_current_session_id');
    if (savedSessionId && !get().currentSession) {
      const savedSession = data.find((s: ChatSession) => s.id === savedSessionId);
      if (savedSession) {
        get().setCurrentSession(savedSession);
      }
    }
  },

  fetchFolders: async () => {
    const { data } = await api.get('/chat/folders');
    set({ folders: data });
  },

  // Folder methods implementation
  createFolder: async (name) => {
    const { data } = await api.post('/chat/folders', { name });
    set((state) => ({ folders: [...state.folders, data] }));
  },

  deleteFolder: async (folderId) => {
    await api.delete(`/chat/folders/${folderId}`);
    set((state) => ({ folders: state.folders.filter((f) => f.id !== folderId) }));
  },

  updateFolder: async (folderId, updates) => {
    const { data } = await api.patch(`/chat/folders/${folderId}`, updates);
    set((state) => ({
      folders: state.folders.map((f) => (f.id === folderId ? data : f)),
    }));
  },

  toggleFolderExpanded: async (folderId) => {
    const folder = get().folders.find((f) => f.id === folderId);
    if (!folder) return;

    const newExpanded = !folder.is_expanded;
    // Optimistic update
    set((state) => ({
      folders: state.folders.map((f) =>
        f.id === folderId ? { ...f, is_expanded: newExpanded } : f
      ),
    }));

    try {
      await api.patch(`/chat/folders/${folderId}`, { is_expanded: newExpanded });
    } catch {
      // Revert on error
      set((state) => ({
        folders: state.folders.map((f) =>
          f.id === folderId ? { ...f, is_expanded: !newExpanded } : f
        ),
      }));
    }
  },

  moveChatToFolder: async (sessionId, folderId) => {
    const { data } = await api.post(`/chat/sessions/${sessionId}/move`, { folder_id: folderId });
    set({ folders: data });
  },

  setCurrentSession: async (session) => {
    set({ currentSession: session, isLoading: true });
    localStorage.setItem('talos_current_session_id', session.id);
    try {
      const { data } = await api.get(`/chat/sessions/${session.id}/messages`);
      set({ messages: data, isLoading: false });
    } catch (_error) {
      console.error('Failed to fetch messages:', _error);
      set({ messages: [], isLoading: false });
    }
  },

  createSession: async (title) => {
    const { data } = await api.post('/chat/sessions', { title });
    localStorage.setItem('talos_current_session_id', data.id);
    set((state) => ({ sessions: [data, ...state.sessions], currentSession: data, messages: [] }));
  },

  retryMessage: async (messageId) => {
    const { messages } = get();
    // Find the last user message to retry
    const lastUserMsg = [...messages].reverse().find((m) => m.role === 'user');
    if (lastUserMsg) {
      // Remove the failed assistant message from current view
      set((state) => ({
        messages: state.messages.filter((m) => m.id !== messageId),
      }));
      // Re-send the last user message content
      await get().sendMessage(lastUserMsg.content);
    }
  },

  sendMessage: async (content) => {
    const { currentSession, messages, activeAgent } = get();
    if (!currentSession) return;

    // Optimistic user message
    const tempUserMsg: Message = {
      id: Math.random().toString(),
      role: 'user',
      content,
      created_at: new Date().toISOString(),
    };

    const controller = new AbortController();
    set({ messages: [...messages, tempUserMsg], isSending: true, abortController: controller });

    try {
      const { data } = await api.post(
        `/chat/sessions/${currentSession.id}/messages`,
        {
          content,
          agent_type: activeAgent,
        },
        { signal: controller.signal }
      );

      // Data is now ConsolidatedMessageResponse: { message: Message, session: ChatSession, user: User, error?: string, detected_agent_type?: AgentType }
      const { message, session, user, error: _error, detected_agent_type } = data;

      if (_error) {
        message.error = _error;
      }

      // Update Active Agent if detected
      if (detected_agent_type && detected_agent_type !== get().activeAgent) {
        set({ activeAgent: detected_agent_type });
      }

      // Update User Store
      useUserStore.getState().setUser(user);

      // Update Sessions List and Current Session
      set((state) => ({
        messages: state.messages
          .map((m) => (m.id === tempUserMsg.id ? tempUserMsg : m))
          .concat(message),
        currentSession: session,
        sessions: state.sessions.map((s) => (s.id === session.id ? session : s)),
        isSending: false,
        abortController: null,
      }));
    } catch (_error: any) {
      if (_error.name === 'CanceledError' || _error.name === 'AbortError') {
        console.log('Message sending aborted');
        return; // Don't show error if manually aborted
      }

      console.error('Failed to send message:', _error);
      // Add a client-side error message if the API call itself fails
      const errorMessage: Message = {
        id: Math.random().toString(),
        role: 'assistant',
        content: 'I encountered a network error. Please check your connection and try again.',
        created_at: new Date().toISOString(),
        error: 'network_error',
      };
      set((state) => ({
        messages: [...state.messages, errorMessage],
        isSending: false,
        abortController: null,
      }));
    }
  },
}));
