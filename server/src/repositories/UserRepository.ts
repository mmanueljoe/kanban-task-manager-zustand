import { prisma } from "@/config/prisma.js";
import { User } from "@/domain/User.js";
import type { UserModel } from "@/generated/prisma/models.js";

function toDomain(row: UserModel): User {
  return new User({
    id: row.id,
    name: row.name,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role,
  });
}

export class UserRepository {
  async create(user: User): Promise<User> {
    const row = await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
      },
    });
    return toDomain(row);
  }

  async update(user: User): Promise<User> {
    const row = await prisma.user.update({
      where: { id: user.id },
      data: {
        name: user.name,
        email: user.email,
        passwordHash: user.passwordHash,
        role: user.role,
      },
    });
    return toDomain(row);
  }

  async findById(id: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await prisma.user.findUnique({ where: { email } });
    return row ? toDomain(row) : null;
  }

  // Bulk lookup for turning a board's collaborator ids into displayable people.
  async findByIds(ids: string[]): Promise<User[]> {
    if (ids.length === 0) return [];
    const rows = await prisma.user.findMany({ where: { id: { in: ids } } });
    return rows.map(toDomain);
  }
}
