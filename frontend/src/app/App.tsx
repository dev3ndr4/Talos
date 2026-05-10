import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '@/pages/login-page/ui/LoginPage';
import { RegisterPage } from '@/pages/register-page/ui/RegisterPage';
import { useUserStore } from '@/entities/user/model/store';
import { Sidebar } from '@/widgets/sidebar/ui/Sidebar';
import { ChatWindow } from '@/features/chat/ui/ChatWindow';

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-surface">
      <Sidebar />
      <main className="flex-1 flex flex-col overflow-hidden relative">
        <ChatWindow />
      </main>
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
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export const App = () => {
  return (
    <div className="min-h-screen bg-white text-text-strong font-sans">
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
        {/* Redirect any other route to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};
