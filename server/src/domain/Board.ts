type BoardAccessLevel = "OWNER" | CollaboratorRole;

type CollaboratorRole = "EDITOR" | "VIEWER";

type Collaborator = {
  userId: string;
  role: CollaboratorRole;
};

class Board {
  private readonly _boardId: string;
  private _ownerId: string;
  private _name: string;
  private _collaboratorList: Collaborator[];

  constructor(params: {
    boardId: string;
    ownerId: string;
    name: string;
    collaborators: Collaborator[];
  }) {
    if (!params.name.trim()) throw new Error("Board name can't be empty");
    if (!params.ownerId.trim()) throw new Error("An owner id is required");

    this._boardId = params.boardId;
    this._ownerId = params.ownerId;
    this._name = params.name;
    this._collaboratorList = params.collaborators ?? [];
  }

  get id(): string {
    return this._boardId;
  }

  get ownerId(): string {
    return this._ownerId;
  }
  get name(): string {
    return this._name;
  }

  get collaborators(): readonly Collaborator[] {
    return [...this._collaboratorList];
  }

  rename(newName: string): void {
    if (!newName.trim()) throw new Error("Board name can't be empty");
    this._name = newName;
  }

  addCollaborator(actingOwnerId: string, collaborator: Collaborator): void {
    if (actingOwnerId !== this._ownerId)
      throw new Error("Only the owner can invite collaborators");

    if (collaborator.userId === this._ownerId)
      throw new Error("The owner cannot be added as a collaborator");

    const alreadyOnBoard = this._collaboratorList.find(
      (c) => c.userId === collaborator.userId
    );

    if (alreadyOnBoard) throw new Error("Collaborator already exists");
    this._collaboratorList = [...this._collaboratorList, collaborator];
  }

  changeCollaboratorRole(
    actingOwnerId: string,
    userId: string,
    newRole: CollaboratorRole
  ): void {
    if (actingOwnerId !== this._ownerId)
      throw new Error("Only the owner can change collaborators role");

    const existingCollaborator = this._collaboratorList.find(
      (c) => c.userId === userId
    );

    if (!existingCollaborator) throw new Error("Collaborator not found");

    this._collaboratorList = this._collaboratorList.map((c) =>
      c.userId === userId ? { ...c, role: newRole } : c
    );
  }

  removeCollaborator(actingOwnerId: string, userId: string): void {
    if (actingOwnerId !== this._ownerId)
      throw new Error("Only the owner can remove a collaborator");

    const existingCollaborator = this._collaboratorList.find(
      (c) => c.userId === userId
    );

    if (!existingCollaborator) throw new Error("Collaborator not found");

    this._collaboratorList = this._collaboratorList.filter(
      (c) => c.userId !== userId
    );
  }

  changeOwner(actingOwnerId: string, nextOwnerId: string): void {
    if (actingOwnerId !== this._ownerId)
      throw new Error("Only an owner can change ownership");

    this._ownerId = nextOwnerId;
  }

  getAccessLevel(userId: string): BoardAccessLevel | null {
    if (userId === this._ownerId) {
      return "OWNER";
    }
    const collaborator = this._collaboratorList.find(
      (u) => u.userId === userId
    );

    if (!collaborator) return null;

    return collaborator.role;
  }

  canModifyContent(userId: string): boolean {
    const accessLevel = this.getAccessLevel(userId);

    return accessLevel === "EDITOR" || accessLevel === "OWNER";
  }
}
