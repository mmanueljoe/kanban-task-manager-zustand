export class Column {
  private readonly _id: string;
  private readonly _boardId: string;
  private _name: string;
  private _position: number;

  constructor(params: {
    id: string;
    boardId: string;
    name: string;
    position: number;
  }) {
    if (!params.name.trim()) throw new Error("Column name can't be empty");
    if (!params.boardId.trim()) throw new Error("A board id is required");

    this._id = params.id;
    this._boardId = params.boardId;
    this._name = params.name;
    this._position = params.position;
  }

  get id(): string {
    return this._id;
  }

  get boardId(): string {
    return this._boardId;
  }

  get name(): string {
    return this._name;
  }

  get position(): number {
    return this._position;
  }

  rename(newName: string): void {
    if (!newName.trim()) throw new Error("Column name can't be empty");
    this._name = newName;
  }

  // The repository decides *what* number to hand in (the gap math); the column
  // just holds wherever it's been placed.
  moveTo(position: number): void {
    this._position = position;
  }
}
