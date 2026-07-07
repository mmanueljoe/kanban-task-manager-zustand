import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { TaskDTO } from "@kanban/shared";
import { api } from "@/lib/api";
import { keys } from "@/lib/keys";

export function useTasks(columnId: string) {
  return useQuery({
    queryKey: keys.tasks(columnId),
    queryFn: () => api.get<TaskDTO[]>(`/columns/${columnId}/tasks`),
  });
}

export function useCreateTask(columnId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { title: string; description?: string }) =>
      api.post<TaskDTO>(`/columns/${columnId}/tasks`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tasks(columnId) }),
  });
}

export function useEditTask(columnId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      ...input
    }: {
      taskId: string;
      title?: string;
      description?: string;
    }) => api.patch<TaskDTO>(`/tasks/${taskId}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tasks(columnId) }),
  });
}

export function useDeleteTask(columnId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => api.delete<null>(`/tasks/${taskId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tasks(columnId) }),
  });
}

type MoveVars = {
  task: TaskDTO;
  fromColumnId: string;
  toColumnId: string;
  position: number;
};

// The DnD drop. Optimistically moves the card between the two per-column caches,
// rolls back on error, and reconciles with the server on settle.
export function useMoveTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ task, toColumnId, position }: MoveVars) =>
      api.patch<TaskDTO>(`/tasks/${task.id}/move`, { toColumnId, position }),

    onMutate: async ({
      task,
      fromColumnId,
      toColumnId,
      position,
    }: MoveVars) => {
      await qc.cancelQueries({ queryKey: keys.tasks(fromColumnId) });
      await qc.cancelQueries({ queryKey: keys.tasks(toColumnId) });

      const prevFrom = qc.getQueryData<TaskDTO[]>(keys.tasks(fromColumnId));
      const prevTo = qc.getQueryData<TaskDTO[]>(keys.tasks(toColumnId));

      // Remove from the source list.
      qc.setQueryData<TaskDTO[]>(keys.tasks(fromColumnId), (list = []) =>
        list.filter((t) => t.id !== task.id)
      );
      // Insert into the destination list at its new position, kept sorted.
      qc.setQueryData<TaskDTO[]>(keys.tasks(toColumnId), (list = []) => {
        const moved = { ...task, columnId: toColumnId, position };
        const others = list.filter((t) => t.id !== task.id);
        return [...others, moved].sort((a, b) => a.position - b.position);
      });

      return { prevFrom, prevTo, fromColumnId, toColumnId };
    },

    onError: (_err, _vars, ctx) => {
      if (!ctx) return;
      qc.setQueryData(keys.tasks(ctx.fromColumnId), ctx.prevFrom);
      qc.setQueryData(keys.tasks(ctx.toColumnId), ctx.prevTo);
    },

    onSettled: (_data, _err, { fromColumnId, toColumnId }: MoveVars) => {
      qc.invalidateQueries({ queryKey: keys.tasks(fromColumnId) });
      qc.invalidateQueries({ queryKey: keys.tasks(toColumnId) });
    },
  });
}

// Subtask operations return the updated task; simplest correct approach is to
// refetch the owning column's tasks.
export function useToggleSubtask(columnId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      subtaskId,
    }: {
      taskId: string;
      subtaskId: string;
    }) => api.patch<TaskDTO>(`/tasks/${taskId}/subtasks/${subtaskId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tasks(columnId) }),
  });
}

export function useAddSubtask(columnId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, title }: { taskId: string; title: string }) =>
      api.post<TaskDTO>(`/tasks/${taskId}/subtasks`, { title }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tasks(columnId) }),
  });
}

export function useRemoveSubtask(columnId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      taskId,
      subtaskId,
    }: {
      taskId: string;
      subtaskId: string;
    }) => api.delete<TaskDTO>(`/tasks/${taskId}/subtasks/${subtaskId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.tasks(columnId) }),
  });
}
