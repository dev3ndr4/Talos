import { create } from 'zustand';
import { api } from '@/shared/api/base';
import { useUserStore } from '@/entities/user/model/store';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  reasoning_trace?: string;
  created_at: string;
}

export interface ChatSession {
  id: string;
  title: string;
  chat_summary: string;
  updated_at: string;
}

interface ChatStore {
  sessions: ChatSession[];
  currentSession: ChatSession | null;
  messages: Message[];
  isLoading: boolean;
  fetchSessions: () => Promise<void>;
  setCurrentSession: (session: ChatSession) => Promise<void>;
  createSession: (title: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  sessions: [],
  currentSession: null,
  messages: [],
  isLoading: false,

  fetchSessions: async () => {
    const { data } = await api.get('/chat/sessions');
    set({ sessions: data });
  },

  setCurrentSession: async (session) => {
    set({ currentSession: session, isLoading: true });
    // In a real app we'd fetch messages for this session
    // const { data } = await api.get(`/chat/sessions/${session.id}/messages`);
    set({ messages: [], isLoading: false }); // Resetting for now, or fetch
  },

  createSession: async (title) => {
    const { data } = await api.post('/chat/sessions', { title });
    set((state) => ({ sessions: [data, ...state.sessions], currentSession: data, messages: [] }));
  },

  sendMessage: async (content) => {
    const { currentSession, messages } = get();
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
      const { data } = await api.post(`/chat/sessions/${currentSession.id}/messages`, { content });
      
      // Data is now ConsolidatedMessageResponse: { message: Message, session: ChatSession, user: User }
      const { message, session, user } = data;

      // Update User Store
      useUserStore.getState().setUser(user);

      // Update Sessions List and Current Session
      set((state) => ({
        messages: state.messages.map(m => m.id === tempUserMsg.id ? tempUserMsg : m).concat(message),
        currentSession: session,
        sessions: state.sessions.map(s => s.id === session.id ? session : s)
      }));
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  },
}));
