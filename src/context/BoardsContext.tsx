import { useReducer, useEffect } from 'react';
import type { BoardsContextType } from '@/types/types';
import data from '@data/data.json';
import type { BoardsData, Board, BoardsState } from '@/types/types';
import { getBoards, setBoards } from '@/utils/localStorage';
import { boardsReducer } from '@/utils/boardsReducer';
import { boardsContext } from '@/utils/boardsContext';

const initialBoards: Board[] =
  getBoards()?.boards ?? (data as BoardsData).boards;

export function BoardsProvider({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const [state, dispatch] = useReducer(boardsReducer, {
    boards: initialBoards,
  } as BoardsState);

  useEffect(() => {
    setBoards({ boards: state.boards });
  }, [state.boards]);

  const value: BoardsContextType = {
    boards: state.boards,
    dispatch,
  };
  return (
    <boardsContext.Provider value={value}>{children}</boardsContext.Provider>
  );
}
