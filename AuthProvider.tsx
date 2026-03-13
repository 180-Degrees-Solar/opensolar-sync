'use client';

import { createContext, useContext } from 'react';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/lib/types';

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  isAdmin: false,
});

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
  user: User | null;
  profile: Profile | null;
}

export function AuthProvider({ children, user, profile }: AuthProviderProps) {
  const isAdmin = profile?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}
