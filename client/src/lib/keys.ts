export const keys = {
  me: ["me"] as const,

  boards: ["boards"] as const,
  boardList: () => ["boards", "list"] as const,
  board: (boardId: string) => ["boards", boardId] as const,

  columns: (boardId: string) => ["boards", boardId, "columns"] as const,

  tasks: (columnId: string) => ["columns", columnId, "tasks"] as const,
};
