import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BoardDTO } from "@kanban/shared";
import { api } from "@/lib/api";
import { keys } from "@/lib/keys";

export function useBoards() {
  return useQuery({
    queryKey: keys.boardList(),
    queryFn: () => api.get<BoardDTO[]>("/boards"),
  });
}

export function useBoard(boardId: string) {
  return useQuery({
    queryKey: keys.board(boardId),
    queryFn: () => api.get<BoardDTO>(`/boards/${boardId}`),
  });
}

export function useCreateBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) => api.post<BoardDTO>("/boards", { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.boardList() }),
  });
}

export function useRenameBoard(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api.patch<BoardDTO>(`/boards/${boardId}`, { name }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.boardList() });
      qc.invalidateQueries({ queryKey: keys.board(boardId) });
    },
  });
}

export function useDeleteBoard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (boardId: string) => api.delete<null>(`/boards/${boardId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.boardList() }),
  });
}
