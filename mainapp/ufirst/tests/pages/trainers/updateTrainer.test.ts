import handler from "@/pages/api/trainers/update";
import { GADGET_API_URL, GADGET_API_KEY } from "@/config/api";

// Mock the config file
jest.mock("@/config/api", () => ({
  GADGET_API_URL: "https://mock.api/graphql",
  GADGET_API_KEY: "test-api-key",
}));

// Mock fetch globally
global.fetch = jest.fn();

describe("/api/trainers/update", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = { method: "PUT", body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    jest.clearAllMocks();
  });

  // 1️⃣ Method not allowed
  it("should return 405 for non-PUT/PATCH requests", async () => {
    req.method = "GET";

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" });
  });

  // 2️⃣ Missing trainer or user ID
  it("should return 400 if trainer ID or user ID is missing", async () => {
    req.body = { firstName: "John" }; // missing id & userId

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Trainer ID and User ID are required",
    });
  });

  // 3️⃣ Missing API key
  it("should return 500 if API key is missing", async () => {
    jest.resetModules();
    jest.doMock("@/config/api", () => ({
      GADGET_API_URL: "https://mock.api/graphql",
      GADGET_API_KEY: "",
    }));
    const { default: missingKeyHandler } = await import("@/pages/api/trainers/update");

    req.body = { id: "trainer123", userId: "user456" };

    await missingKeyHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Server configuration error: Missing API key",
    });
  });

  // 4️⃣ GraphQL mutation success
  it("should return 200 and success message when trainer update succeeds", async () => {
    req.body = {
      id: "trainer123",
      userId: "user456",
      firstName: "Jane",
      lastName: "Doe",
      email: "jane@example.com",
    };

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        data: {
          updateUser: {
            success: true,
            user: {
              id: "user456",
              firstName: "Jane",
              lastName: "Doe",
              email: "jane@example.com",
            },
          },
        },
      }),
    });

    await handler(req, res);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      user: {
        id: "user456",
        firstName: "Jane",
        lastName: "Doe",
        email: "jane@example.com",
      },
      message: "Trainer updated successfully",
    });
  });

  // 5️⃣ GraphQL returns error
  it("should return 400 if updateUser has an error message", async () => {
    req.body = { id: "t1", userId: "u1" };

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        data: {
          updateUser: {
            success: false,
            errors: [{ message: "Email already exists" }],
          },
        },
      }),
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Email already exists",
    });
  });

  // 6️⃣ GraphQL returns false with no error messages
  it("should return 400 with default message if updateUser fails with no specific error", async () => {
    req.body = { id: "t1", userId: "u1" };

    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        data: {
          updateUser: {
            success: false,
            errors: [],
          },
        },
      }),
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Failed to update trainer",
    });
  });

  // 7️⃣ Network or unexpected error
  it("should return 500 if fetch throws an error", async () => {
    req.body = { id: "t1", userId: "u1" };

    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network failure"));

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Internal server error",
    });
  });
});
