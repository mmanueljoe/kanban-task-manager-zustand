import { useEffect } from 'react';
import data from '@data/data.json';
import type { BoardsData } from '@/types/types';
import { getBoards, setBoards } from '@/utils/localStorage';
import { useUi } from '@/hooks/useUi';
import { useStore } from './useStore';

export function StoreHydration({ children }: { children: React.ReactNode }) {
  const { startLoading, stopLoading } = useUi();
  const dispatch = useStore((s) => s.dispatch);

  useEffect(() => {
    startLoading('initBoards');
    const timer = setTimeout(() => {
      try {
        const loadedBoards = getBoards()?.boards ?? (data as BoardsData).boards;
        dispatch({
          type: 'SET_BOARDS',
          payload: { boards: loadedBoards },
        });
      } catch (error) {
        console.error('Error loading boards:', error);
        dispatch({
          type: 'SET_BOARDS',
          payload: { boards: (data as BoardsData).boards },
        });
      } finally {
        stopLoading('initBoards');
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [dispatch, startLoading, stopLoading]);

  useEffect(() => {
    const unsub = useStore.subscribe((state) => {
      if (state.boards.length > 0) {
        setBoards({ boards: state.boards });
      }
    });
    return unsub;
  }, []);

  return <>{children}</>;
}
