import {
  useCallback,
  useEffect,
  useRef,
  type ReactElement,
  type ReactNode,
} from "react";
import type { UiContextType, UiToast } from "@/types/types";
import { useStore, type AppStore } from "@store/useStore";
import { uiContext } from "@context/ui-context";

const MIN_LOADING_DURATION_MS = 300;

export function UiProvider({
  children,
}: {
  children: ReactNode;
}): ReactElement {
  const loadingKeys = useStore((s: AppStore) => s.loadingKeys);
  const toasts = useStore((s: AppStore) => s.toasts);
  const addLoadingKey = useStore((s: AppStore) => s.addLoadingKey);
  const removeLoadingKey = useStore((s: AppStore) => s.removeLoadingKey);
  const addToast = useStore((s: AppStore) => s.addToast);
  const removeToast = useStore((s: AppStore) => s.removeToast);
  // const { loadingKeys, toasts, addLoadingKey, removeLoadingKey, addToast, removeToast } = useStore();

  const loadingStartTimesRef = useRef<Map<string, number>>(new Map());
  const stopTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map()
  );

  const startLoading = useCallback(
    (key: string) => {
      const existingTimeout = stopTimeoutsRef.current.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        stopTimeoutsRef.current.delete(key);
      }
      loadingStartTimesRef.current.set(key, Date.now());
      addLoadingKey(key);
    },
    [addLoadingKey]
  );

  const stopLoading = useCallback(
    (key: string) => {
      const startTime = loadingStartTimesRef.current.get(key);
      const elapsed = startTime ? Date.now() - startTime : 0;
      const remaining = Math.max(0, MIN_LOADING_DURATION_MS - elapsed);
      const existingTimeout = stopTimeoutsRef.current.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      const doStop = () => {
        loadingStartTimesRef.current.delete(key);
        stopTimeoutsRef.current.delete(key);
        removeLoadingKey(key);
      };
      if (remaining > 0) {
        const timeout = setTimeout(doStop, remaining);
        stopTimeoutsRef.current.set(key, timeout);
      } else {
        doStop();
      }
    },
    [removeLoadingKey]
  );

  const showToast = useCallback(
    ({ type, message }: Omit<UiToast, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      addToast({ id, type, message });
    },
    [addToast]
  );

  const isLoading = useCallback(
    (key?: string) => {
      if (key) return loadingKeys.includes(key);
      return loadingKeys.length > 0;
    },
    [loadingKeys]
  );

  useEffect(() => {
    const timeouts = stopTimeoutsRef.current;
    return () => {
      timeouts.forEach((timeout) => clearTimeout(timeout));
      Array.from(timeouts.keys()).forEach((k) => timeouts.delete(k));
    };
  }, []);

  const value: UiContextType = {
    state: { loadingKeys, toasts },
    showToast,
    startLoading,
    stopLoading,
    isLoading,
    dismissToast: removeToast,
  };

  return <uiContext.Provider value={value}>{children}</uiContext.Provider>;
}
