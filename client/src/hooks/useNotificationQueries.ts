import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NotificationDTO } from "@kanban/shared";
import { api } from "@/lib/api";
import { keys } from "@/lib/keys";

export function useNotifications() {
  return useQuery({
    queryKey: keys.notifications(),
    queryFn: () => api.get<NotificationDTO[]>("/notifications"),
    // Poll while there's no real-time channel yet, so the badge stays fresh.
    // The real-time slice will invalidate this query instead.
    refetchInterval: 30000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch<null>(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.notifications() }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.post<null>("/notifications/read-all"),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.notifications() }),
  });
}
