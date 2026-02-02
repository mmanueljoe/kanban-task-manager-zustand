import { useContext } from 'react';
import { boardsContext } from '@/utils/boardsContext';
import type { BoardsContextType } from '@/types/types';

export function useBoards(): BoardsContextType {
  const ctx = useContext(boardsContext);
  if (!ctx) throw new Error('useBoards must be used inside BoardsProvider');
  return ctx;
}
