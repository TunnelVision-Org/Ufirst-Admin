import handler from "@/pages/api/trainers/getAll"; // adjust if your path differs

jest.mock("@/config/api", () => ({
  GADGET_API_URL: "https://mock.api/graphql",
  GADGET_API_KEY: "test-api-key",
}));

global.fetch = jest.fn();

describe("/api/trainers/getAll", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = { method: "GET" };
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

  // 2️⃣ Missing API key
  it("should return 500 if API key is missing", async () => {
    jest.resetModules();
    jest.doMock("@/config/api", () => ({
      GADGET_API_URL: "https://mock.api/graphql",
      GADGET_API_KEY: undefined,
    }));

    const handlerNoKey = (await import("@/pages/api/trainers/getAll")).default;

    await handlerNoKey(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Server configuration error: Missing API key",
    });
  });

  // 3️⃣ GraphQL returns errors
  it("should return 400 if GraphQL returns errors", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        errors: [{ message: "GraphQL query failed" }],
      }),
    });

    await handler(req, res);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "GraphQL errors",
      details: [{ message: "GraphQL query failed" }],
    });
  });

  // 4️⃣ Missing trainers data
  it("should return 400 if trainers data is missing", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: { trainers: null },
      }),
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Failed to fetch trainers",
    });
  });

  // 5️⃣ Successful trainers response
  it("should return 200 and formatted trainer list", async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        data: {
          trainers: {
            edges: [
              {
                node: {
                  id: "t1",
                  user: {
                    id: "u1",
                    firstName: "John",
                    lastName: "Doe",
                    email: "john@example.com",
                  },
                  client: { edges: [{ node: { id: "c1" } }, { node: { id: "c2" } }] },
                  createdAt: "2025-10-01T00:00:00Z",
                  updatedAt: "2025-10-05T00:00:00Z",
                },
              },
            ],
          },
        },
      }),
    });

    await handler(req, res);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      trainers: [
        {
          id: "t1",
          name: "John Doe",
          firstName: "John",
          lastName: "Doe",
          email: "john@example.com",
          userId: "u1",
          clientCount: 2,
          hireDate: "2025-10-01T00:00:00Z",
          createdAt: "2025-10-01T00:00:00Z",
          updatedAt: "2025-10-05T00:00:00Z",
          phone: "",
          specialization: "",
          rating: 0,
        },
      ],
    });
  });

  // 6️⃣ Internal server error
  it("should return 500 if fetch throws an error", async () => {
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network failure"));

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Internal server error",
    });
  });
});
