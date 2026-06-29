import { describe, it, expect } from "vitest";
import { User } from "../src/domain/User.js";

const validParams = {
  id: "user-1",
  name: "Ama",
  email: "ama@example.com",
  passwordHash: "hashed-secret",
};

describe("User", () => {
  describe("construction", () => {
    it("builds a valid user and exposes it through getters", () => {
      const user = new User(validParams);

      expect(user.id).toBe("user-1");
      expect(user.name).toBe("Ama");
      expect(user.email).toBe("ama@example.com");
      expect(user.passwordHash).toBe("hashed-secret");
    });

    it("defaults the role to USER when none is given", () => {
      const user = new User(validParams);

      expect(user.role).toBe("USER");
      expect(user.isAdmin()).toBe(false);
    });

    it("honours an explicit ADMIN role", () => {
      const user = new User({ ...validParams, role: "ADMIN" });

      expect(user.role).toBe("ADMIN");
      expect(user.isAdmin()).toBe(true);
    });

    it("rejects an empty name", () => {
      expect(() => new User({ ...validParams, name: "" })).toThrow(
        "User name is required"
      );
    });

    it("rejects a whitespace-only name", () => {
      expect(() => new User({ ...validParams, name: "   " })).toThrow(
        "User name is required"
      );
    });

    it("rejects an empty email", () => {
      expect(() => new User({ ...validParams, email: "" })).toThrow(
        "User email is required"
      );
    });

    it("rejects a whitespace-only email", () => {
      expect(() => new User({ ...validParams, email: "   " })).toThrow(
        "User email is required"
      );
    });

    it("rejects a missing password hash", () => {
      expect(() => new User({ ...validParams, passwordHash: "" })).toThrow(
        "User passwordHash is required"
      );
    });
  });

  describe("rename", () => {
    it("updates the name", () => {
      const user = new User(validParams);

      user.rename("Kofi");

      expect(user.name).toBe("Kofi");
    });

    it("rejects an empty name", () => {
      const user = new User(validParams);

      expect(() => user.rename("")).toThrow("User name is required");
    });

    it("rejects a whitespace-only name", () => {
      const user = new User(validParams);

      expect(() => user.rename("   ")).toThrow("User name is required");
    });
  });

  describe("promoteToAdmin", () => {
    it("turns a regular user into an admin", () => {
      const user = new User(validParams);
      expect(user.isAdmin()).toBe(false);

      user.promoteToAdmin();

      expect(user.role).toBe("ADMIN");
      expect(user.isAdmin()).toBe(true);
    });

    it("is idempotent for someone already an admin", () => {
      const user = new User({ ...validParams, role: "ADMIN" });

      user.promoteToAdmin();

      expect(user.role).toBe("ADMIN");
    });
  });

  describe("toPublicProfile", () => {
    it("returns the public-safe fields", () => {
      const user = new User({ ...validParams, role: "ADMIN" });

      expect(user.toPublicProfile()).toEqual({
        id: "user-1",
        name: "Ama",
        email: "ama@example.com",
        role: "ADMIN",
      });
    });

    it("never exposes the password hash", () => {
      const user = new User(validParams);

      expect(user.toPublicProfile()).not.toHaveProperty("passwordHash");
    });
  });
});
