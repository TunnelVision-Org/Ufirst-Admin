import handler from "@/pages/api/trainers/getById"; // adjust the path if needed

jest.mock("@/config/api", () => ({
  GADGET_API_URL: "https://mock.api/graphql",
  GADGET_API_KEY: "mock-key",
}));

global.fetch = jest.fn();

describe("/api/trainers/getById", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = { method: "GET", query: { id: "trainer123" } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    (fetch as jest.Mock).mockReset();

    jest.spyOn(console, "log").mockImplementation(() => {});
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // 1️⃣ Wrong method
  it("should return 405 for non-GET requests", async () => {
    req.method = "POST";
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" });
  });

  // 2️⃣ Missing ID
  it("should return 400 if trainer ID is missing", async () => {
    req.query = {};
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Trainer ID is required" });
  });

  // 3️⃣ Missing API key
  it("should return 500 if API key is missing", async () => {
  jest.resetModules(); // ensure a fresh module scope

  jest.doMock("@/config/api", () => ({
    GADGET_API_URL: "https://mock.api/graphql",
    GADGET_API_KEY: "",
  }));

  const mod = await import("@/pages/api/trainers/getById"); // re-import with mocked config
  const missingKeyHandler = mod.default;

  await missingKeyHandler(req, res);

  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith({
    error: "Server configuration error: Missing API key",
  });
});


  // 4️⃣ GraphQL errors returned
  it("should return 400 if GraphQL errors exist", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ errors: [{ message: "Bad query" }] }),
    });

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "GraphQL errors",
      details: [{ message: "Bad query" }],
    });
  });

  // 5️⃣ Trainer found successfully
  it("should return 200 and trainer data if found", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        data: {
          trainer: {
            id: "t1",
            userId: "u1",
            user: {
              id: "u1",
              firstName: "John",
              lastName: "Doe",
              email: "john@example.com",
            },
            client: {
              edges: [
                {
                  node: {
                    id: "c1",
                    createdAt: "2025-01-01",
                    user: {
                      id: "u2",
                      firstName: "Jane",
                      lastName: "Smith",
                      email: "jane@example.com",
                    },
                    workouts: { edges: [{ node: { id: "w1" } }] },
                    mealPlan: { id: "m1" },
                  },
                },
              ],
            },
            createdAt: "2024-12-01",
            updatedAt: "2025-01-10",
          },
        },
      }),
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      trainer: {
        id: "t1",
        userId: "u1",
        name: "John Doe",
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
        clients: [
          {
            id: "c1",
            name: "Jane Smith",
            firstName: "Jane",
            lastName: "Smith",
            email: "jane@example.com",
            userId: "u2",
            workoutCount: 1,
            mealPlanCount: 1,
            joinDate: "2025-01-01",
          },
        ],
        clientCount: 1,
        hireDate: "2024-12-01",
        createdAt: "2024-12-01",
        updatedAt: "2025-01-10",
        phone: "",
        specialization: "",
        rating: 0,
      },
    });
  });

  // 6️⃣ Trainer not found
  it("should return 404 if trainer not found", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({ data: { trainer: null } }),
    });

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Trainer not found" });
  });

  // 7️⃣ Fetch throws error
  it("should return 500 if fetch throws an error", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network failure"));
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
