import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { ColumnDTO } from "@kanban/shared";
import { api } from "@/lib/api";
import { keys } from "@/lib/keys";

export function useColumns(boardId: string) {
  return useQuery({
    queryKey: keys.columns(boardId),
    queryFn: () => api.get<ColumnDTO[]>(`/boards/${boardId}/columns`),
  });
}

export function useAddColumn(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      api.post<ColumnDTO>(`/boards/${boardId}/columns`, { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.columns(boardId) }),
  });
}

export function useRenameColumn(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ columnId, name }: { columnId: string; name: string }) =>
      api.patch<ColumnDTO>(`/columns/${columnId}`, { name }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.columns(boardId) }),
  });
}

export function useDeleteColumn(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (columnId: string) => api.delete<null>(`/columns/${columnId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.columns(boardId) }),
  });
}

export function useReorderColumn(boardId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      columnId,
      position,
    }: {
      columnId: string;
      position: number;
    }) => api.patch<ColumnDTO>(`/columns/${columnId}/position`, { position }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.columns(boardId) }),
  });
}
