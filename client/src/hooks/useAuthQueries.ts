import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserDTO } from "@kanban/shared";
import { api } from "@/lib/api";

export const ME_KEY = ["me"] as const;

// The current session. A 401 throws (data stays undefined) → treated as logged
// out. retry:false because a 401 won't resolve by retrying.
export function useMe() {
  return useQuery({
    queryKey: ME_KEY,
    queryFn: () => api.get<UserDTO>("/auth/me"),
    retry: false,
    staleTime: Infinity,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      api.post<UserDTO>("/auth/login", input),
    // Seed the me-cache with the returned user so the UI updates immediately.
    onSuccess: (user) => qc.setQueryData(ME_KEY, user),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; email: string; password: string }) =>
      api.post<UserDTO>("/auth/register", input),
    onSuccess: (user) => qc.setQueryData(ME_KEY, user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<null>("/auth/logout"),
    // Drop the session and every cached query so no stale data lingers.
    onSuccess: () => {
      qc.setQueryData(ME_KEY, null);
      qc.clear();
    },
  });
}
