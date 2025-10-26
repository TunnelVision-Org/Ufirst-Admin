import handler from "@/pages/api/trainers/getByEmail"; // adjust to your path

jest.mock("@/config/api", () => ({
  GADGET_API_URL: "https://mock.api/graphql",
  GADGET_API_KEY: "mock-key",
}));

global.fetch = jest.fn();

describe("/api/clients/getTrainerByEmail", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = { method: "GET", query: { email: "test@example.com" } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    (fetch as jest.Mock).mockReset();
  });

  // 1️⃣ Wrong method
  it("should return 405 if method is not GET", async () => {
    req.method = "POST";
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" });
  });

  // 2️⃣ Missing email
  it("should return 400 if email is missing", async () => {
    req.query = {};
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Email is required" });
  });

  // 3️⃣ User not found
  it("should return 404 if user not found", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { users: { edges: [] } } }),
      });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "User not found" });
  });

  // 4️⃣ User lookup GraphQL error
  it("should return 500 if user lookup has GraphQL errors", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ errors: [{ message: "Query failed" }] }),
      });

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Failed to fetch user",
      details: [{ message: "Query failed" }],
    });
  });

  // 5️⃣ Client path — user is a client
  it("should return 200 and client data if user is a client", async () => {
    // Step 1: user lookup
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            users: { edges: [{ node: { id: "u1", firstName: "C", lastName: "Lient", email: "test@example.com" } }] },
          },
        }),
      })
      // Step 2: client lookup
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            clients: {
              edges: [
                {
                  node: {
                    id: "c1",
                    userId: "u1",
                    createdAt: "2025-10-01",
                    user: {
                      id: "u1",
                      email: "test@example.com",
                      firstName: "C",
                      lastName: "Lient",
                    },
                    trainer: {
                      id: "t1",
                      user: {
                        id: "u2",
                        firstName: "T",
                        lastName: "Rainer",
                        email: "trainer@example.com",
                      },
                    },
                    workouts: { edges: [{ node: { id: "w1" } }] },
                    mealPlan: { id: "m1" },
                  },
                },
              ],
            },
          },
        }),
      });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: "c1",
      name: "C Lient",
      firstName: "C",
      lastName: "Lient",
      email: "test@example.com",
      userId: "u1",
      isClient: true,
      trainer: {
        id: "t1",
        name: "T Rainer",
        email: "trainer@example.com",
      },
      workoutCount: 1,
      mealPlanCount: 1,
      joinDate: "2025-10-01",
      clients: [],
    });
  });

  // 6️⃣ Trainer path — user is a trainer
  it("should return 200 and trainer data if user is a trainer", async () => {
    // Step 1: user lookup
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            users: { edges: [{ node: { id: "u2", firstName: "T", lastName: "Rainer", email: "trainer@example.com" } }] },
          },
        }),
      })
      // Step 2: client lookup — empty
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { clients: { edges: [] } } }),
      })
      // Step 3: trainer lookup — with clients
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            trainers: {
              edges: [
                {
                  node: {
                    id: "t1",
                    userId: "u2",
                    user: {
                      id: "u2",
                      firstName: "T",
                      lastName: "Rainer",
                      email: "trainer@example.com",
                    },
                    client: {
                      edges: [
                        {
                          node: {
                            id: "c1",
                            userId: "u3",
                            createdAt: "2025-09-01",
                            user: {
                              id: "u3",
                              firstName: "Client",
                              lastName: "One",
                              email: "c1@example.com",
                            },
                            workouts: { edges: [{ node: { id: "w1" } }] },
                            mealPlan: { id: "m1" },
                          },
                        },
                      ],
                    },
                  },
                },
              ],
            },
          },
        }),
      });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      id: "t1",
      name: "T Rainer",
      firstName: "T",
      lastName: "Rainer",
      email: "trainer@example.com",
      userId: "u2",
      isClient: false,
      clientCount: 1,
      clients: [
        {
          id: "c1",
          name: "Client One",
          firstName: "Client",
          lastName: "One",
          email: "c1@example.com",
          userId: "u3",
          workoutCount: 1,
          mealPlanCount: 1,
          joinDate: "2025-09-01",
          createdAt: "2025-09-01",
        },
      ],
    });
  });

  // 7️⃣ User is neither client nor trainer
  it("should return 404 if user has no client or trainer profile", async () => {
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: {
            users: { edges: [{ node: { id: "u3", email: "none@example.com" } }] },
          },
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { clients: { edges: [] } } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { trainers: { edges: [] } } }),
      });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: "No client or trainer profile found for this user",
    });
  });

  // 8️⃣ Any fetch throws
  it("should return 500 if any fetch throws an error", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network error"));
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: "Internal server error" });
  });
});
