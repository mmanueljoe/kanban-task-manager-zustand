import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { CommentDTO } from "@kanban/shared";
import { api } from "@/lib/api";
import { keys } from "@/lib/keys";

export function useComments(taskId: string, enabled = true) {
  return useQuery({
    queryKey: keys.comments(taskId),
    queryFn: () => api.get<CommentDTO[]>(`/tasks/${taskId}/comments`),
    enabled: Boolean(taskId) && enabled,
  });
}

export function useAddComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      api.post<CommentDTO>(`/tasks/${taskId}/comments`, { body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.comments(taskId) }),
  });
}

export function useRemoveComment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: string) =>
      api.delete<null>(`/comments/${commentId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.comments(taskId) }),
  });
}
