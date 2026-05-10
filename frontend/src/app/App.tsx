import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/login-page/ui/LoginPage';
import { RegisterPage } from '@/pages/register-page/ui/RegisterPage';
import { useUserStore } from '@/entities/user/model/store';
import { useUIStore } from '@/shared/model/ui-store';
import { Sidebar } from '@/widgets/sidebar/ui/Sidebar';
import { Header } from '@/widgets/header/ui/Header';
import { ChatWindow } from '@/features/chat/ui/ChatWindow';
import { useChatStore } from '@/entities/chat/model/store';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';

const BackgroundAnimation = ({ isChatActive }: { isChatActive: boolean }) => {
  return (
    <div className={clsx('bg-animation', isChatActive && 'chat-active')}>
      <div className="bg-orb bg-orb-1" />
      <div className="bg-orb bg-orb-2" />
      <div className="bg-orb bg-orb-3" />
    </div>
  );
};

const Dashboard = () => {
  const { sidebarOpen, toggleSidebar } = useUIStore();

  return (
    <div className="app-container">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={toggleSidebar}
            className="mobile-backdrop lg:hidden"
          />
        )}
      </AnimatePresence>
      <Sidebar />
      <div className="main-wrapper">
        <Header />
        <main className="main-content">
          <ChatWindow />
        </main>
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading, fetchMe } = useUserStore();
  const token = localStorage.getItem('talos_token');

  useEffect(() => {
    if (token && !user) {
      fetchMe();
    }
  }, [token, user, fetchMe]);

  if (token && isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm font-medium text-text-subtle">Initializing Talos...</span>
        </motion.div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App = () => {
  const { messages, currentSession } = useChatStore();
  const isChatActive = !!currentSession && messages.length > 0;

  return (
    <div className="min-h-screen relative">
      <BackgroundAnimation isChatActive={isChatActive} />
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
    </div>
  );
};
