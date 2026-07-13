export type ActivityType =
  | "TASK_CREATED"
  | "TASK_MOVED"
  | "TASK_UPDATED"
  | "TASK_DELETED"
  | "TASK_ASSIGNED"
  | "COLUMN_CREATED"
  | "COLUMN_RENAMED"
  | "COLUMN_DELETED"
  | "BOARD_RENAMED"
  | "MEMBER_INVITED"
  | "MEMBER_ROLE_CHANGED"
  | "MEMBER_REMOVED"
  | "COMMENT_ADDED";

export type ActivityDetails = Record<string, string | number | boolean | null>;

export class Activity {
  private readonly _id: string;
  private readonly _boardId: string;
  private readonly _actorId: string;
  private readonly _type: ActivityType;
  private readonly _details: ActivityDetails;
  private readonly _createdAt: Date;

  constructor(params: {
    id: string;
    boardId: string;
    actorId: string;
    type: ActivityType;
    details: ActivityDetails;
    createdAt?: Date;
  }) {
    if (!params.boardId.trim()) throw new Error("Activity boardId is required");
    if (!params.actorId.trim()) throw new Error("Activity actorId is required");

    this._id = params.id;
    this._boardId = params.boardId;
    this._actorId = params.actorId;
    this._type = params.type;
    this._details = params.details;
    this._createdAt = params.createdAt ?? new Date();
  }

  get id(): string {
    return this._id;
  }
  get boardId(): string {
    return this._boardId;
  }
  get actorId(): string {
    return this._actorId;
  }
  get type(): ActivityType {
    return this._type;
  }
  get details(): ActivityDetails {
    return { ...this._details };
  }
  get createdAt(): Date {
    return this._createdAt;
  }
}
