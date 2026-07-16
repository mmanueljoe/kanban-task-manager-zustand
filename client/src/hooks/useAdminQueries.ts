import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserDTO, UserRole } from "@kanban/shared";
import { api } from "@/lib/api";
import { keys } from "@/lib/keys";

export function useUsers(enabled = true) {
  return useQuery({
    queryKey: keys.users(),
    queryFn: () => api.get<UserDTO[]>("/admin/users"),
    enabled,
  });
}

export function useSetUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
      api.patch<UserDTO>(`/admin/users/${userId}/role`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.users() }),
  });
}
