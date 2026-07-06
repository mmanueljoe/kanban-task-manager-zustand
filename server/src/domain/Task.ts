// A subtask is a small checklist item inside a task. It has no behaviour of its
// own — the task owns it and is the only thing allowed to change it.
export type Subtask = {
  id: string;
  title: string;
  isCompleted: boolean;
};

// A task is a card. It lives in exactly one column, and that column IS its
// status — there is no separate status field. Moving the card to another column
// is the only way its status changes.
export class Task {
  private readonly _id: string;
  private _columnId: string;
  private _title: string;
  private _description: string;
  private _position: number;
  private _subtasks: Subtask[];

  constructor(params: {
    id: string;
    columnId: string;
    title: string;
    description?: string;
    position: number;
    subtasks?: Subtask[];
  }) {
    if (!params.title.trim()) throw new Error("Task title can't be empty");
    if (!params.columnId.trim()) throw new Error("A column id is required");

    this._id = params.id;
    this._columnId = params.columnId;
    this._title = params.title;
    this._description = params.description ?? "";
    this._position = params.position;
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

  // A copy, so a caller can't reach in and mutate the task's private list — the
  // same defensive-copy guarantee the board makes for its collaborators.
  get subtasks(): readonly Subtask[] {
    return [...this._subtasks];
  }

  rename(newTitle: string): void {
    if (!newTitle.trim()) throw new Error("Task title can't be empty");
    this._title = newTitle;
  }

  // Description is optional, so an empty string is allowed here — it means the
  // user cleared it.
  editDescription(description: string): void {
    this._description = description;
  }

  moveTo(position: number): void {
    this._position = position;
  }

  // This is what a drag from one column to another becomes. Because the column
  // is the status, this single call is how a task's status changes.
  moveToColumn(newColumnId: string): void {
    if (!newColumnId.trim()) throw new Error("A column id is required");
    this._columnId = newColumnId;
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

  // Powers the "2 of 4 subtasks" label on the card.
  completedCount(): number {
    return this._subtasks.filter((s) => s.isCompleted).length;
  }

  totalCount(): number {
    return this._subtasks.length;
  }
}
