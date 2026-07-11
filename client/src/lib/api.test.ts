import { describe, it, expect, vi, afterEach } from "vitest";
import { api, ApiError } from "@/lib/api";

// A stand-in fetch that returns the given status + JSON body.
const makeFetch = (status: number, body: unknown) =>
  vi.fn().mockResolvedValue({ status, json: async () => body });

afterEach(() => vi.unstubAllGlobals());

describe("api client", () => {
  it("unwraps the data envelope on success", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetch(200, { status: "success", data: { id: "1" } })
    );
    const result = await api.get<{ id: string }>("/thing");
    expect(result).toEqual({ id: "1" });
  });

  it("sends the cookie credentials and JSON headers", async () => {
    const f = makeFetch(200, { status: "success", data: null });
    vi.stubGlobal("fetch", f);
    await api.get("/thing");
    const opts = f.mock.calls[0]![1] as RequestInit;
    const headers = opts.headers as Record<string, string>;
    expect(opts.credentials).toBe("include");
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("posts with method POST and a JSON body", async () => {
    const f = makeFetch(200, { status: "success", data: null });
    vi.stubGlobal("fetch", f);
    await api.post("/thing", { name: "x" });
    const [url, opts] = f.mock.calls[0]! as [string, RequestInit];
    expect(url).toContain("/thing");
    expect(opts.method).toBe("POST");
    expect(opts.body).toBe(JSON.stringify({ name: "x" }));
  });

  it("throws an ApiError with message + status on an error envelope", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetch(409, { status: "error", message: "Taken" })
    );
    await expect(api.get("/thing")).rejects.toMatchObject({
      message: "Taken",
      status: 409,
    });
  });

  it("carries per-field errors from a validation failure", async () => {
    vi.stubGlobal(
      "fetch",
      makeFetch(400, {
        status: "error",
        message: "Validation failed",
        errors: { email: "A valid email is required" },
      })
    );
    try {
      await api.get("/thing");
      throw new Error("expected api.get to throw");
    } catch (e) {
      expect(e).toBeInstanceOf(ApiError);
      expect((e as ApiError).fieldErrors).toEqual({
        email: "A valid email is required",
      });
    }
  });
});
