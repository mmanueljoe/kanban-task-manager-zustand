import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BoardMemberDTO, CollaboratorRole } from "@kanban/shared";
import { api } from "@/lib/api";
import { keys } from "@/lib/keys";

export function useMembers(boardId: string) {
  return useQuery({
    queryKey: keys.members(boardId),
    queryFn: () => api.get<BoardMemberDTO[]>(`/boards/${boardId}/members`),
    enabled: Boolean(boardId),
  });
}

export function useInviteCollaborator(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { email: string; role: CollaboratorRole }) =>
      api.post<null>(`/boards/${boardId}/collaborators`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.members(boardId) }),
  });
}

export function useChangeMemberRole(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      role,
    }: {
      userId: string;
      role: CollaboratorRole;
    }) =>
      api.patch<null>(`/boards/${boardId}/collaborators/${userId}`, { role }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.members(boardId) }),
  });
}

export function useRemoveMember(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.delete<null>(`/boards/${boardId}/collaborators/${userId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.members(boardId) }),
  });
}

export function useTransferOwnership(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (newOwnerId: string) =>
      api.post<null>(`/boards/${boardId}/transfer`, { newOwnerId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.members(boardId) });
      qc.invalidateQueries({ queryKey: keys.board(boardId) });
      qc.invalidateQueries({ queryKey: keys.boardList() });
    },
  });
}
