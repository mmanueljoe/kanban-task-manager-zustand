import { randomUUID } from "node:crypto";
import argon2 from "argon2";
import { User, type UserRole } from "@/domain/User.js";
import { UserRepository } from "@/repositories/UserRepository.js";
import {
  ConflictError,
  NotAuthenticatedError,
  NotAuthorizedError,
  NotFoundError,
  ValidationError,
} from "@/errors/AppError.js";

export class UserService {
  constructor(private readonly users: UserRepository = new UserRepository()) {}

  async register(input: {
    name: string;
    email: string;
    password: string;
  }): Promise<User> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("That email is already registered");
    }

    const passwordHash = await argon2.hash(input.password);

    const user = new User({
      id: randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash,
    });

    return this.users.create(user);
  }

  async getById(id: string): Promise<User> {
    const user = await this.users.findById(id);
    if (!user) {
      throw new NotFoundError("User not found");
    }
    return user;
  }

  async login(input: { email: string; password: string }): Promise<User> {
    const user = await this.users.findByEmail(input.email);
    if (!user) {
      throw new NotAuthenticatedError("Invalid email or password");
    }

    const passwordMatches = await argon2.verify(
      user.passwordHash,
      input.password
    );
    if (!passwordMatches) {
      throw new NotAuthenticatedError("Invalid email or password");
    }

    return user;
  }

  // Platform administration — every method below requires the acting user to be
  // an admin. This is where the ADMIN role earns its keep.
  async listAllUsers(actingUserId: string): Promise<User[]> {
    await this.requireAdmin(actingUserId);
    return this.users.findAll();
  }

  async setUserRole(
    actingUserId: string,
    targetUserId: string,
    role: UserRole
  ): Promise<User> {
    await this.requireAdmin(actingUserId);
    // Guard against the last admin locking themselves out.
    if (actingUserId === targetUserId && role === "USER") {
      throw new ValidationError("You can't remove your own admin role");
    }

    const target = await this.users.findById(targetUserId);
    if (!target) {
      throw new NotFoundError("User not found");
    }
    if (role === "ADMIN") target.promoteToAdmin();
    else target.demoteToUser();
    return this.users.update(target);
  }

  private async requireAdmin(actingUserId: string): Promise<void> {
    const acting = await this.users.findById(actingUserId);
    if (!acting?.isAdmin()) {
      throw new NotAuthorizedError("Admin access required");
    }
  }
}
