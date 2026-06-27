export type UserRole = 'ADMIN' | 'USER';

export class User {
  private readonly _id: string;
  private _name: string;
  private _email: string;
  private _role: UserRole;
  private _passwordHash: string;

  constructor(params: {
    id: string;
    name: string;
    email: string;
    passwordHash: string;
    role?: UserRole;
  }) {
    if (!params.name.trim()) throw new Error('User name is required');
    if (!params.email.trim()) throw new Error('User email is required');
    if (!params.passwordHash) throw new Error('User passwordHash is required');

    this._id = params.id;
    this._name = params.name;
    this._email = params.email;
    this._passwordHash = params.passwordHash;
    this._role = params.role ?? 'USER';
  }

  get id(): string {
    return this._id;
  }
  get name(): string {
    return this._name;
  }
  get email(): string {
    return this._email;
  }
  get role(): UserRole {
    return this._role;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }

  rename(newName: string): void {
    if (!newName.trim()) throw new Error('User name is required');
    this._name = newName;
  }

  promoteToAdmin(): void {
    this._role = 'ADMIN';
  }

  isAdmin(): boolean {
    return this._role === 'ADMIN';
  }

  toPublicProfile(): {
    id: string;
    name: string;
    email: string;
    role: UserRole;
  } {
    return {
      id: this._id,
      name: this._name,
      email: this._email,
      role: this._role,
    };
  }
}
