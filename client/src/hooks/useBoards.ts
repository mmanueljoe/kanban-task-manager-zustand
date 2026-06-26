import type { BoardsContextType } from '@/types/types';
import { useStore } from '@/store/useStore';
import { useShallow } from 'zustand/react/shallow';

export function useBoards(): BoardsContextType {
  return useStore(
    useShallow((state) => ({
      boards: state.boards,
      dispatch: state.dispatch,
    }))
  );
}
