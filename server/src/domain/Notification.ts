import type { ActivityType, ActivityDetails } from "@/domain/Activity.js";

export class Notification {
  private readonly _id: string;
  private readonly _userId: string;
  private readonly _actorId: string;
  private readonly _type: ActivityType;
  private readonly _boardId: string;
  private readonly _details: ActivityDetails;
  private _read: boolean;
  private readonly _createdAt: Date;

  constructor(params: {
    id: string;
    userId: string;
    actorId: string;
    type: ActivityType;
    boardId: string;
    details: ActivityDetails;
    read?: boolean;
    createdAt?: Date;
  }) {
    if (!params.userId.trim())
      throw new Error("Notification userId is required");
    if (!params.actorId.trim())
      throw new Error("Notification actorId is required");
    if (!params.boardId.trim())
      throw new Error("Notification boardId is required");

    this._id = params.id;
    this._userId = params.userId;
    this._actorId = params.actorId;
    this._type = params.type;
    this._boardId = params.boardId;
    this._details = params.details;
    this._read = params.read ?? false;
    this._createdAt = params.createdAt ?? new Date();
  }

  get id(): string {
    return this._id;
  }
  get userId(): string {
    return this._userId;
  }
  get actorId(): string {
    return this._actorId;
  }
  get type(): ActivityType {
    return this._type;
  }
  get boardId(): string {
    return this._boardId;
  }
  get details(): ActivityDetails {
    return { ...this._details };
  }
  get read(): boolean {
    return this._read;
  }
  get createdAt(): Date {
    return this._createdAt;
  }

  markRead(): void {
    this._read = true;
  }
}
