import type { AuthContextType } from '@/types/types';
import { useStore } from '@/store/useStore';
import { useShallow } from 'zustand/react/shallow';

export function useAuth(): AuthContextType {
  return useStore(
    useShallow((state) => ({
      user: state.user,
      isLoggedIn: state.isLoggedIn,
      login: state.login,
      logout: state.logout,
    }))
  );
}
