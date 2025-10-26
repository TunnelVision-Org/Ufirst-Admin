/**
 * @file tests/pages/login.test.ts
 */
import handler from "@/pages/api/login";
import { NextApiRequest, NextApiResponse } from "next";

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe("/api/login", () => {
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

  // 1️⃣ Wrong method
  it("returns 405 if not POST", async () => {
    req.method = "GET";

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" });
  });

  // 2️⃣ Missing credentials
  it("returns 400 if email or password missing", async () => {
    req.body = { email: "user@test.com" }; // no password

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Email and password are required" });
  });

  // 3️⃣ Gadget returns sign-in error
  it("returns 401 if Gadget returns authentication errors", async () => {
    req.body = { email: "bad@test.com", password: "wrong" };

    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({
        data: {
          signInUser: {
            user: null,
            errors: [{ message: "Invalid credentials", code: "INVALID_CREDENTIALS" }],
          },
        },
      }),
    });

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(mockFetch).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Invalid credentials",
      errors: [{ message: "Invalid credentials", code: "INVALID_CREDENTIALS" }],
    });
  });

  // 4️⃣ Successful login
  it("returns 200 and user object when login is successful", async () => {
    req.body = { email: "user@test.com", password: "1234" };

    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({
        data: {
          signInUser: {
            user: {
              id: "u1",
              firstName: "John",
              lastName: "Doe",
              email: "user@test.com",
            },
            errors: [],
          },
        },
      }),
    });

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      user: {
        id: "u1",
        firstName: "John",
        lastName: "Doe",
        email: "user@test.com",
      },
    });
  });

  // 5️⃣ Gadget returns no user (invalid credentials)
  it("returns 401 if no user returned from Gadget", async () => {
    req.body = { email: "ghost@test.com", password: "1234" };

    mockFetch.mockResolvedValueOnce({
      status: 200,
      json: async () => ({
        data: { signInUser: { user: null, errors: [] } },
      }),
    });

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: "Invalid credentials" });
  });

  // 6️⃣ Network or fetch error
  it("returns 500 if fetch throws an error", async () => {
    req.body = { email: "user@test.com", password: "1234" };

    mockFetch.mockRejectedValueOnce(new Error("Network failure"));

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Internal server error",
      details: "Network failure",
    });
  });
});
