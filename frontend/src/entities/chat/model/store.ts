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

export type AgentType = 'knowledge' | 'comms' | 'coding';

interface ChatStore {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  messages: Message[];
  activeAgent: AgentType;
  isLoading: boolean;
  fetchSessions: () => Promise<void>;
  setCurrentSession: (session: ChatSession) => Promise<void>;
  createSession: (title: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  retryMessage: (messageId: string) => Promise<void>;
  setActiveAgent: (agent: AgentType) => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  sessions: [],
  currentSession: null,
  messages: [],
  activeAgent: 'coding',
  isLoading: false,

  setActiveAgent: (agent) => set({ activeAgent: agent }),

  fetchSessions: async () => {
    const { data } = await api.get('/chat/sessions');
    set({ sessions: data });

    // Try to restore session from localStorage
    const savedSessionId = localStorage.getItem('talos_current_session_id');
    if (savedSessionId && !get().currentSession) {
      const savedSession = data.find((s: ChatSession) => s.id === savedSessionId);
      if (savedSession) {
        get().setCurrentSession(savedSession);
      }
    }
  },

  setCurrentSession: async (session) => {
    set({ currentSession: session, isLoading: true });
    localStorage.setItem('talos_current_session_id', session.id);
    try {
      const { data } = await api.get(`/chat/sessions/${session.id}/messages`);
      set({ messages: data, isLoading: false });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
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
    set({ messages: [...messages, tempUserMsg] });

    try {
      const { data } = await api.post(`/chat/sessions/${currentSession.id}/messages`, {
        content,
        agent_type: activeAgent,
      });

      // Data is now ConsolidatedMessageResponse: { message: Message, session: ChatSession, user: User, error?: string }
      const { message, session, user, error } = data;

      if (error) {
        message.error = error;
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
      }));
    } catch (error) {
      console.error('Failed to send message:', error);
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
      }));
    }
  },
}));
