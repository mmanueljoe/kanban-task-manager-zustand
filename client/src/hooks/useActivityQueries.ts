import { useQuery } from "@tanstack/react-query";
import type { ActivityDTO } from "@kanban/shared";
import { api } from "@/lib/api";
import { keys } from "@/lib/keys";

export function useActivity(boardId: string, enabled = true) {
  return useQuery({
    queryKey: keys.activity(boardId),
    queryFn: () => api.get<ActivityDTO[]>(`/boards/${boardId}/activity`),
    enabled: Boolean(boardId) && enabled,
  });
}
