import { describe, it, expect, vi } from "vitest";
import argon2 from "argon2";
import { UserService } from "@/services/UserService.js";
import { UserRepository } from "@/repositories/UserRepository.js";
import { User } from "@/domain/User.js";
import { ConflictError, NotAuthenticatedError } from "@/errors/AppError.js";

// A fake repository. `vi.fn()` makes a stand-in function we can (a) tell what to
// return and (b) later ask "were you called, and with what?". We cast it to
// UserRepository because the service only ever calls findByEmail + create — the
// fake doesn't need real database code, just those two methods.
function makeFakeRepo(): UserRepository {
  return {
    findByEmail: vi.fn().mockResolvedValue(null),
    // create echoes back whatever User it was handed, like the real one does.
    create: vi.fn().mockImplementation(async (user: User) => user),
    findById: vi.fn(),
  } as unknown as UserRepository;
}

const input = {
  name: "Ama",
  email: "ama@example.com",
  password: "correct horse battery staple",
};

describe("UserService.register", () => {
  it("creates a user when the email is free", async () => {
    const repo = makeFakeRepo();
    const service = new UserService(repo);

    const user = await service.register(input);

    // It checked whether the email was taken, using the given email.
    expect(repo.findByEmail).toHaveBeenCalledWith(input.email);
    // It saved exactly one user.
    expect(repo.create).toHaveBeenCalledTimes(1);
    // The returned user carries the input, with the default role.
    expect(user.name).toBe("Ama");
    expect(user.email).toBe("ama@example.com");
    expect(user.role).toBe("USER");
  });

  it("stores an argon2 hash, never the raw password", async () => {
    const service = new UserService(makeFakeRepo());

    const user = await service.register(input);

    // The stored value is not the plaintext...
    expect(user.passwordHash).not.toBe(input.password);
    // ...and it really is a valid argon2 hash of that password.
    expect(await argon2.verify(user.passwordHash, input.password)).toBe(true);
  });

  it("throws ConflictError when the email is already taken", async () => {
    const repo = makeFakeRepo();
    // This time the lookup finds an existing user.
    vi.mocked(repo.findByEmail).mockResolvedValue(
      new User({
        id: "existing",
        name: "Someone",
        email: input.email,
        passwordHash: "hash",
      })
    );
    const service = new UserService(repo);

    await expect(service.register(input)).rejects.toBeInstanceOf(ConflictError);
    // And it must NOT try to create a second account.
    expect(repo.create).not.toHaveBeenCalled();
  });
});

describe("UserService.login", () => {
  // A registered user whose password is `input.password`, so a correct login
  // succeeds and a wrong one exercises the argon2.verify branch.
  async function makeRegisteredUser(): Promise<User> {
    return new User({
      id: "u1",
      name: input.name,
      email: input.email,
      passwordHash: await argon2.hash(input.password),
    });
  }

  it("returns the user for the right email + password", async () => {
    const repo = makeFakeRepo();
    vi.mocked(repo.findByEmail).mockResolvedValue(await makeRegisteredUser());
    const service = new UserService(repo);

    const user = await service.login({
      email: input.email,
      password: input.password,
    });

    expect(user.email).toBe(input.email);
  });

  // Bad credentials mean "we don't know who you are" — 401, not 403. A missing
  // email and a wrong password are indistinguishable to the caller on purpose,
  // so we don't leak whether an account exists.
  it("throws NotAuthenticatedError (401) when the email is unknown", async () => {
    const repo = makeFakeRepo(); // findByEmail defaults to null
    const service = new UserService(repo);

    await expect(
      service.login({ email: "nobody@example.com", password: input.password })
    ).rejects.toBeInstanceOf(NotAuthenticatedError);
  });

  it("throws NotAuthenticatedError (401) when the password is wrong", async () => {
    const repo = makeFakeRepo();
    vi.mocked(repo.findByEmail).mockResolvedValue(await makeRegisteredUser());
    const service = new UserService(repo);

    await expect(
      service.login({ email: input.email, password: "wrong password" })
    ).rejects.toBeInstanceOf(NotAuthenticatedError);
  });
});
