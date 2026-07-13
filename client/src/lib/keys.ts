export const keys = {
  me: ["me"] as const,

  boards: ["boards"] as const,
  boardList: () => ["boards", "list"] as const,
  board: (boardId: string) => ["boards", boardId] as const,

  columns: (boardId: string) => ["boards", boardId, "columns"] as const,
  members: (boardId: string) => ["boards", boardId, "members"] as const,
  activity: (boardId: string) => ["boards", boardId, "activity"] as const,

  tasks: (columnId: string) => ["columns", columnId, "tasks"] as const,
  comments: (taskId: string) => ["tasks", taskId, "comments"] as const,
};
