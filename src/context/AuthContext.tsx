/* eslint-disable react-refresh/only-export-components */
import { createContext, useState } from 'react';
import { getAuth, setAuth } from '@utils/localStorage';
import type { AuthContextType, User } from '@/types/types';

export const authContext = createContext<AuthContextType | null>(null);

function readStoredAuth() {
  const stored = getAuth();
  return stored?.isLoggedIn && stored.user
    ? { user: stored.user, isLoggedIn: true }
    : { user: null as User | null, isLoggedIn: false };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(readStoredAuth);
  const { user, isLoggedIn } = state;

  const login = (u: User) => {
    setState({ user: u, isLoggedIn: true });
    setAuth({ isLoggedIn: true, user: u });
  };

  const logout = () => {
    setState({ user: null, isLoggedIn: false });
    setAuth({ isLoggedIn: false, user: null });
  };

  return (
    <authContext.Provider value={{ user, isLoggedIn, login, logout }}>
      {children}
    </authContext.Provider>
  );
}
