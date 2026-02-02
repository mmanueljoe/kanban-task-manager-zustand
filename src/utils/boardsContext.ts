import { createContext } from 'react';
import type { BoardsContextType } from '@/types/types';

export const boardsContext = createContext<BoardsContextType | null>(null);
