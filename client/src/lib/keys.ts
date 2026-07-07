export const keys = {
  me: ["me"] as const,

  boards: ["boards"] as const,
  boardList: () => ["boards", "list"] as const,
  board: (boardId: string) => ["boards", boardId] as const,

  // A board's columns.
  columns: (boardId: string) => ["boards", boardId, "columns"] as const,
  // A column's tasks — keyed per column, which is what makes the optimistic
  // task-move touch exactly two cache entries (source + destination).
  tasks: (columnId: string) => ["columns", columnId, "tasks"] as const,
};
