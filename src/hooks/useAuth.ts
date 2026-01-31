import type { AuthContextType } from '@/types/types';
import { authContext } from '@context/AuthContext';
import { useContext } from 'react';

export function useAuth(): AuthContextType {
  const ctx = useContext(authContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
