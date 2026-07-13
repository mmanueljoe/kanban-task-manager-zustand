import "dotenv/config";
import argon2 from "argon2";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client.js";

// The seed is a one-off batch script, in the same category as a migration — so
// it connects over DIRECT_URL (the session pooler), NOT the app's DATABASE_URL
// (the transaction pooler). The $transaction below is an interactive
// transaction, and those can't run over a transaction-mode pooler — that's the
// same reason prisma.config.ts points migrations at DIRECT_URL.
const connectionString = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DIRECT_URL (or DATABASE_URL) is not set — check your .env");
}
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

/**
 * Demo/development seed data.
 *
 * Two properties make this safe to run against a real (non-production) database:
 *
 *  1. It is IDEMPOTENT — every write is an `upsert` keyed on a stable value
 *     (email for users, a fixed id for everything else). Run it once or ten
 *     times, the database ends up in the same state. No duplicate boards,
 *     no unique-constraint crashes on the second run.
 *
 *  2. The ids are DETERMINISTIC — they're hard-coded, not random. That means
 *     the seeded board/task ids are stable across machines, so they can be
 *     referenced from the API docs and the Postman collection.
 *
 * The login for every seeded account is the password below.
 */
const SEED_PASSWORD = "Password123!";

// Stable ids. Readable groupings (1s = Alice, 2s = Bob, …) so the data is easy
// to eyeball in the database and to reference from docs.
const IDS = {
  users: {
    alice: "11111111-1111-1111-1111-111111111111",
    bob: "22222222-2222-2222-2222-222222222222",
    carol: "33333333-3333-3333-3333-333333333333",
  },
  board: "b0000000-0000-0000-0000-000000000001",
  columns: {
    todo: "c0000000-0000-0000-0000-000000000001",
    doing: "c0000000-0000-0000-0000-000000000002",
    done: "c0000000-0000-0000-0000-000000000003",
  },
} as const;

// The app spaces positions in gaps of 1000 (see the position helpers in the
// services) so a row can later be dropped between two others without renumbering
// the whole column. The seed follows the same convention.
const POSITION_GAP = 1000;

type SeedTask = {
  id: string;
  title: string;
  description: string;
  subtasks: { id: string; title: string; isCompleted: boolean }[];
};

const TASKS_BY_COLUMN: Record<string, SeedTask[]> = {
  [IDS.columns.todo]: [
    {
      id: "d0000000-0000-0000-0000-000000000001",
      title: "Design the landing page",
      description: "First impression for new visitors.",
      subtasks: [
        {
          id: "e0000000-0000-0000-0000-000000000001",
          title: "Wireframe the hero section",
          isCompleted: false,
        },
        {
          id: "e0000000-0000-0000-0000-000000000002",
          title: "Pick a colour palette",
          isCompleted: false,
        },
      ],
    },
    {
      id: "d0000000-0000-0000-0000-000000000002",
      title: "Set up product analytics",
      description: "Know what users actually do.",
      subtasks: [],
    },
  ],
  [IDS.columns.doing]: [
    {
      id: "d0000000-0000-0000-0000-000000000003",
      title: "Build authentication",
      description: "Register, login, protected routes.",
      subtasks: [
        {
          id: "e0000000-0000-0000-0000-000000000003",
          title: "Hash passwords with argon2",
          isCompleted: true,
        },
        {
          id: "e0000000-0000-0000-0000-000000000004",
          title: "Issue JWT on login",
          isCompleted: true,
        },
        {
          id: "e0000000-0000-0000-0000-000000000005",
          title: "Guard the /me route",
          isCompleted: false,
        },
      ],
    },
  ],
  [IDS.columns.done]: [
    {
      id: "d0000000-0000-0000-0000-000000000004",
      title: "Initialise the repository",
      description: "Tooling, linting, first commit.",
      subtasks: [
        {
          id: "e0000000-0000-0000-0000-000000000006",
          title: "Write the README",
          isCompleted: true,
        },
      ],
    },
  ],
};

async function main() {
  // Hashing is deliberately slow (that's the point of argon2), so do it BEFORE
  // opening the transaction. You never want CPU-bound work holding a database
  // connection open inside a transaction — it ties up a pooled connection for
  // no reason and can trip the transaction timeout.
  const passwordHash = await argon2.hash(SEED_PASSWORD);

  await prisma.$transaction(async (tx) => {
    const [alice, bob, carol] = await Promise.all([
      tx.user.upsert({
        where: { email: "alice@example.com" },
        update: { name: "Alice Johnson", role: "ADMIN" },
        create: {
          id: IDS.users.alice,
          name: "Alice Johnson",
          email: "alice@example.com",
          passwordHash,
          role: "ADMIN",
        },
      }),
      tx.user.upsert({
        where: { email: "bob@example.com" },
        update: { name: "Bob Smith" },
        create: {
          id: IDS.users.bob,
          name: "Bob Smith",
          email: "bob@example.com",
          passwordHash,
        },
      }),
      tx.user.upsert({
        where: { email: "carol@example.com" },
        update: { name: "Carol Lee" },
        create: {
          id: IDS.users.carol,
          name: "Carol Lee",
          email: "carol@example.com",
          passwordHash,
        },
      }),
    ]);

    await tx.board.upsert({
      where: { id: IDS.board },
      update: { name: "Product Roadmap", ownerId: alice.id },
      create: {
        id: IDS.board,
        name: "Product Roadmap",
        ownerId: alice.id,
      },
    });

    // Reset the feed so a reseed starts from a clean, known history.
    await tx.activity.deleteMany({ where: { boardId: IDS.board } });

    // Bob can edit the board, Carol can only view it — enough to demo the two
    // collaborator access levels end to end.
    await tx.boardCollaborator.upsert({
      where: { boardId_userId: { boardId: IDS.board, userId: bob.id } },
      update: { role: "EDITOR" },
      create: { boardId: IDS.board, userId: bob.id, role: "EDITOR" },
    });
    await tx.boardCollaborator.upsert({
      where: { boardId_userId: { boardId: IDS.board, userId: carol.id } },
      update: { role: "VIEWER" },
      create: { boardId: IDS.board, userId: carol.id, role: "VIEWER" },
    });

    const columns = [
      { id: IDS.columns.todo, name: "Todo" },
      { id: IDS.columns.doing, name: "Doing" },
      { id: IDS.columns.done, name: "Done" },
    ];

    for (const [index, column] of columns.entries()) {
      await tx.column.upsert({
        where: { id: column.id },
        update: { name: column.name, position: (index + 1) * POSITION_GAP },
        create: {
          id: column.id,
          boardId: IDS.board,
          name: column.name,
          position: (index + 1) * POSITION_GAP,
        },
      });

      const tasks = TASKS_BY_COLUMN[column.id] ?? [];
      for (const [taskIndex, task] of tasks.entries()) {
        await tx.task.upsert({
          where: { id: task.id },
          update: {
            title: task.title,
            description: task.description,
            position: (taskIndex + 1) * POSITION_GAP,
          },
          create: {
            id: task.id,
            columnId: column.id,
            title: task.title,
            description: task.description,
            position: (taskIndex + 1) * POSITION_GAP,
          },
        });

        for (const [subIndex, subtask] of task.subtasks.entries()) {
          await tx.subtask.upsert({
            where: { id: subtask.id },
            update: {
              title: subtask.title,
              isCompleted: subtask.isCompleted,
              position: (subIndex + 1) * POSITION_GAP,
            },
            create: {
              id: subtask.id,
              taskId: task.id,
              title: subtask.title,
              isCompleted: subtask.isCompleted,
              position: (subIndex + 1) * POSITION_GAP,
            },
          });
        }
      }
    }
  });

  console.log("Seed complete.");
  console.log(
    `  Users:    alice@example.com (admin), bob@example.com (editor), carol@example.com (viewer)`
  );
  console.log(`  Password: ${SEED_PASSWORD}`);
  console.log(`  Board:    "Product Roadmap" with Todo / Doing / Done columns`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
