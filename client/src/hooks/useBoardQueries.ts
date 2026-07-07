import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { BoardDTO, BoardContentsDTO, TaskDTO } from "@kanban/shared";
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
    enabled: Boolean(boardId),
  });
}

// One request for the whole board. Seeds the individual board/columns/tasks
// caches so useBoard/useColumns/useTasks read from cache instead of each firing
// their own request — this is what removes the N+1 on board load, while keeping
// the per-column task caches the optimistic move relies on.
export function useBoardContents(boardId: string) {
  const qc = useQueryClient();
  return useQuery({
    queryKey: [...keys.board(boardId), "full"],
    queryFn: async () => {
      const data = await api.get<BoardContentsDTO>(`/boards/${boardId}/full`);
      qc.setQueryData(keys.board(boardId), data.board);
      qc.setQueryData(keys.columns(boardId), data.columns);
      for (const column of data.columns) {
        qc.setQueryData<TaskDTO[]>(
          keys.tasks(column.id),
          data.tasks.filter((t) => t.columnId === column.id)
        );
      }
      return data;
    },
    enabled: Boolean(boardId),
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
