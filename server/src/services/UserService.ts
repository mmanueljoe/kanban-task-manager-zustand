import { randomUUID } from "node:crypto";
import argon2 from "argon2";
import { User } from "@/domain/User.js";
import { UserRepository } from "@/repositories/UserRepository.js";
import {
  ConflictError,
  NotAuthorizedError,
  NotFoundError,
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

  async login(input: { email: string; password: string }): Promise<User> {
    const user = await this.users.findByEmail(input.email);
    if (!user) {
      throw new NotAuthorizedError("Invalid email or password");
    }

    const passwordMatches = await argon2.verify(
      user.passwordHash,
      input.password
    );
    if (!passwordMatches) {
      throw new NotAuthorizedError("Invalid email or password");
    }

    return user;
  }

  // Platform administration: only an existing admin can promote someone.
  async promoteToAdmin(
    actingUserId: string,
    targetUserId: string
  ): Promise<User> {
    const acting = await this.users.findById(actingUserId);
    if (!acting?.isAdmin()) {
      throw new NotAuthorizedError("Only an admin can promote users");
    }

    const target = await this.users.findById(targetUserId);
    if (!target) {
      throw new NotFoundError("User not found");
    }

    target.promoteToAdmin();
    return this.users.update(target);
  }
}
