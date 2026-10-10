'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from './api-client';

export interface User {
  id: string;
  username: string;
  roles: string[];
}

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isLoginModalOpen: boolean;
  loginReason: string;
  isPublicAccessEnabled: boolean;
  openLoginModal: (reason?: string) => void;
  closeLoginModal: () => void;
  login: (username: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  requireAuth: (action: () => void | Promise<void>, reason?: string) => void;
}

const defaultPublicAccess =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ACCESS_ENABLED !== undefined
    ? String(process.env.NEXT_PUBLIC_ACCESS_ENABLED).toLowerCase() !== 'false'
    : true;

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isLoginModalOpen: false,
  loginReason: '',
  isPublicAccessEnabled: defaultPublicAccess,
  openLoginModal: () => {},
  closeLoginModal: () => {},
  login: async () => {},
  logout: async () => {},
  requireAuth: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginReason, setLoginReason] = useState<string>('');

  const isPublicAccessEnabled =
    typeof process !== 'undefined' && process.env.NEXT_PUBLIC_ACCESS_ENABLED !== undefined
      ? String(process.env.NEXT_PUBLIC_ACCESS_ENABLED).toLowerCase() !== 'false'
      : true;

  useEffect(() => {
    async function checkAuth() {
      try {
        const profile = await apiClient.get<User>('/auth/me');
        if (profile && profile.roles && !profile.roles.includes('anonymous')) {
          setUser(profile);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  const openLoginModal = (reason?: string) => {
    setLoginReason(reason || '');
    setIsLoginModalOpen(true);
  };

  const closeLoginModal = () => {
    setIsLoginModalOpen(false);
    setLoginReason('');
  };

  const login = async (username: string, pass: string) => {
    const res = await apiClient.post<{ user: User }>('/auth/login', { username, password: pass });
    if (res?.user) {
      setUser(res.user);
      setIsLoginModalOpen(false);
      setLoginReason('');
    }
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setUser(null);
    }
  };

  const requireAuth = (action: () => void | Promise<void>, reason?: string) => {
    if (user) {
      action();
    } else {
      openLoginModal(reason || 'Authentication required for this operation.');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isLoginModalOpen,
        loginReason,
        isPublicAccessEnabled,
        openLoginModal,
        closeLoginModal,
        login,
        logout,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
