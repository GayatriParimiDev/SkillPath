import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

interface User {
  id: string;
  name: string;
  email?: string;
  education?: string;
  isGuest: boolean;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isGuest: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, education: string, email: string, password: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem('skillpath_user').then((saved) => {
      if (saved) {
        try {
          setUser(JSON.parse(saved));
        } catch {}
      }
      setIsLoading(false);
    });
  }, []);

  const saveUser = async (u: User) => {
    setUser(u);
    await AsyncStorage.setItem('skillpath_user', JSON.stringify(u));
  };

  const login = async (email: string, _password: string) => {
    const u: User = {
      id: Crypto.randomUUID(),
      name: email.split('@')[0],
      email,
      isGuest: false,
    };
    await saveUser(u);
  };

  const signup = async (name: string, education: string, email: string, _password: string) => {
    const u: User = {
      id: Crypto.randomUUID(),
      name,
      email,
      education,
      isGuest: false,
    };
    await saveUser(u);
  };

  const loginAsGuest = async () => {
    const u: User = {
      id: `guest_${Crypto.randomUUID()}`,
      name: 'Guest',
      isGuest: true,
    };
    await saveUser(u);
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem('skillpath_user');
    await AsyncStorage.removeItem('skillpath_guest_progress');
    await AsyncStorage.removeItem('skillpath_curriculum');
  };

  const value = useMemo(() => ({
    user,
    isLoading,
    isGuest: user?.isGuest ?? false,
    login,
    signup,
    loginAsGuest,
    logout,
  }), [user, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
