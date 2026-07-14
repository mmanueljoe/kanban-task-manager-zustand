import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { NotificationDTO } from "@kanban/shared";
import { api } from "@/lib/api";
import { keys } from "@/lib/keys";

export function useNotifications() {
  return useQuery({
    queryKey: keys.notifications(),
    queryFn: () => api.get<NotificationDTO[]>("/notifications"),
    // No polling: real-time invalidates this live, useNotificationRealtime
    // refetches on socket reconnect (covering anything missed while offline),
    // and TanStack's refetch-on-focus handles tab-back.
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
