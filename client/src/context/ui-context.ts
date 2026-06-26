import { createContext } from 'react';
import type { UiContextType } from '@/types/types';

export const uiContext = createContext<UiContextType | null>(null);
