import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Don't hammer the API on transient failures; auth errors set retry:false
      // per-query since a 401 won't fix itself by retrying.
      retry: 1,
      staleTime: 30_000,
    },
  },
});
