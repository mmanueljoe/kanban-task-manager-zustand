import { useParams } from 'react-router';
import { useStore } from '@/store/useStore';
import { useShallow } from 'zustand/react/shallow';
import type { Board } from '@/types/types';

type UseCurrentBoardResult = {
  board: Board | null;
  boardIndex: number | null;
};

export function useCurrentBoard(): UseCurrentBoardResult {
  const { boardId } = useParams<{ boardId?: string }>();

  const index =
    boardId != null && /^\d+$/.test(boardId) ? parseInt(boardId, 10) : null;

  // OPTIMIZATION: Subscribe only to the specific board, not all boards
  // This prevents re-renders when other boards change
  const board = useStore(
    useShallow((state) => {
      if (
        index == null ||
        !Number.isFinite(index) ||
        index < 0 ||
        index >= state.boards.length
      ) {
        return null;
      }
      return state.boards[index];
    })
  );

  return { board, boardIndex: index };
}
