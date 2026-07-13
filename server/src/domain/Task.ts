export type Subtask = {
  id: string;
  title: string;
  isCompleted: boolean;
};

export class Task {
  private readonly _id: string;
  private _columnId: string;
  private _title: string;
  private _description: string;
  private _position: number;
  private _assignedToId: string | null;
  private _subtasks: Subtask[];

  constructor(params: {
    id: string;
    columnId: string;
    title: string;
    description?: string;
    position: number;
    assignedToId?: string | null;
    subtasks?: Subtask[];
  }) {
    if (!params.title.trim()) throw new Error("Task title can't be empty");
    if (!params.columnId.trim()) throw new Error("A column id is required");

    this._id = params.id;
    this._columnId = params.columnId;
    this._title = params.title;
    this._description = params.description ?? "";
    this._position = params.position;
    this._assignedToId = params.assignedToId ?? null;
    this._subtasks = params.subtasks ?? [];
  }

  get id(): string {
    return this._id;
  }

  get columnId(): string {
    return this._columnId;
  }

  get title(): string {
    return this._title;
  }

  get description(): string {
    return this._description;
  }

  get position(): number {
    return this._position;
  }

  get assignedToId(): string | null {
    return this._assignedToId;
  }

  get subtasks(): readonly Subtask[] {
    return [...this._subtasks];
  }

  rename(newTitle: string): void {
    if (!newTitle.trim()) throw new Error("Task title can't be empty");
    this._title = newTitle;
  }

  editDescription(description: string): void {
    this._description = description;
  }

  moveTo(position: number): void {
    this._position = position;
  }

  moveToColumn(newColumnId: string): void {
    if (!newColumnId.trim()) throw new Error("A column id is required");
    this._columnId = newColumnId;
  }

  assignTo(userId: string | null): void {
    this._assignedToId = userId;
  }

  addSubtask(subtask: Subtask): void {
    if (!subtask.title.trim()) throw new Error("Subtask title can't be empty");

    const alreadyExists = this._subtasks.some((s) => s.id === subtask.id);
    if (alreadyExists) throw new Error("Subtask already exists");

    this._subtasks = [...this._subtasks, subtask];
  }

  toggleSubtask(subtaskId: string): void {
    const target = this._subtasks.find((s) => s.id === subtaskId);
    if (!target) throw new Error("Subtask not found");

    this._subtasks = this._subtasks.map((s) =>
      s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
    );
  }

  removeSubtask(subtaskId: string): void {
    const target = this._subtasks.find((s) => s.id === subtaskId);
    if (!target) throw new Error("Subtask not found");

    this._subtasks = this._subtasks.filter((s) => s.id !== subtaskId);
  }

  completedCount(): number {
    return this._subtasks.filter((s) => s.isCompleted).length;
  }

  totalCount(): number {
    return this._subtasks.length;
  }
}
