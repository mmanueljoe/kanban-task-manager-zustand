export class Comment {
  private readonly _id: string;
  private readonly _taskId: string;
  private readonly _authorId: string;
  private readonly _body: string;
  private readonly _createdAt: Date;

  constructor(params: {
    id: string;
    taskId: string;
    authorId: string;
    body: string;
    createdAt?: Date;
  }) {
    if (!params.body.trim()) throw new Error("Comment body can't be empty");
    if (!params.taskId.trim()) throw new Error("Comment taskId is required");
    if (!params.authorId.trim())
      throw new Error("Comment authorId is required");

    this._id = params.id;
    this._taskId = params.taskId;
    this._authorId = params.authorId;
    this._body = params.body;
    this._createdAt = params.createdAt ?? new Date();
  }

  get id(): string {
    return this._id;
  }
  get taskId(): string {
    return this._taskId;
  }
  get authorId(): string {
    return this._authorId;
  }
  get body(): string {
    return this._body;
  }
  get createdAt(): Date {
    return this._createdAt;
  }
}
