/**
 * @file tests/pages/signup.test.ts
 * @description Unit tests for /api/signup
 */

import handler from "@/pages/api/signup";
import { NextApiRequest, NextApiResponse } from "next";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe("/api/signup", () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      method: "POST",
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  // 1️⃣ Wrong HTTP method
  it("returns 405 if not POST", async () => {
    req.method = "GET";

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" });
  });

  // 2️⃣ Missing email or password
  it("returns 400 if email or password missing", async () => {
    req.body = { firstName: "John", lastName: "Doe", email: "" };

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Email and password are required" });
  });

  // 3️⃣ GraphQL-level errors
  it("returns 400 if GraphQL errors are present", async () => {
    req.body = { firstName: "John", lastName: "Doe", email: "john@test.com", password: "12345" };

    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({
        errors: [{ message: "GraphQL query failed" }],
      }),
    });

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(mockFetch).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "GraphQL query failed",
      errors: [{ message: "GraphQL query failed" }],
    });
  });

  // 4️⃣ Mutation-level signup errors
  it("returns 400 if Gadget signup mutation has errors", async () => {
    req.body = { firstName: "Jane", lastName: "Doe", email: "jane@test.com", password: "abc123" };

    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({
        data: {
          signUpUser: {
            success: false,
            errors: [{ message: "Email already in use", code: "EMAIL_TAKEN" }],
          },
        },
      }),
    });

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Email already in use",
      errors: [{ message: "Email already in use", code: "EMAIL_TAKEN" }],
    });
  });

  // 5️⃣ Successful signup
  it("returns 200 and success result when signup is successful", async () => {
    req.body = { firstName: "Sam", lastName: "Smith", email: "sam@test.com", password: "pass123" };

    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({
        data: {
          signUpUser: {
            success: true,
            result: { id: "user123", email: "sam@test.com" },
            errors: [],
          },
        },
      }),
    });

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      result: { id: "user123", email: "sam@test.com" },
    });
  });

  // 6️⃣ Signup not successful but no explicit errors
  it("returns 400 if signup not successful and no explicit errors", async () => {
    req.body = { firstName: "Alex", lastName: "Ray", email: "alex@test.com", password: "pass123" };

    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({
        data: { signUpUser: { success: false, errors: [] } },
      }),
    });

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Signup failed" });
  });

  // 7️⃣ Network or unexpected exception
  it("returns 500 if fetch throws an error", async () => {
    req.body = { firstName: "Lee", lastName: "Chang", email: "lee@test.com", password: "secret" };

    mockFetch.mockRejectedValueOnce(new Error("Network failure"));

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Internal server error",
      details: "Network failure",
    });
  });
});
