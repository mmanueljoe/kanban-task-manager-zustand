import { randomUUID } from "node:crypto";
import argon2 from "argon2";
import { User } from "@/domain/User.js";
import { UserRepository } from "@/repositories/UserRepository.js";
import { ConflictError } from "@/errors/AppError.js";

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
}
