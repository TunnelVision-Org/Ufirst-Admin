import handler from "@/pages/api/clients/getByTrainer";
import { NextApiRequest, NextApiResponse } from "next";
import fetchMock from "jest-fetch-mock";

const mockGADGET_API_URL = "https://api.gadget.dev/graphql";
const mockGADGET_API_KEY = "test-api-key";

// Mock config import
jest.mock("@/config/api", () => ({
  GADGET_API_URL: "https://api.gadget.dev/graphql",
  GADGET_API_KEY: "test-api-key",
}));

describe("API: /api/clients/getByTrainer", () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;

  beforeEach(() => {
    fetchMock.resetMocks();

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should return 405 for non-GET requests", async () => {
    req = { method: "POST" };

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" });
  });

  it("should return 400 if trainerId is missing", async () => {
    req = { method: "GET", query: {} };

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Trainer ID is required" });
  });

it("should return 500 if API key is missing", async () => {
  jest.resetModules(); // 🧹 Clear module cache

  jest.doMock("@/config/api", () => ({
    GADGET_API_URL: "https://api.gadget.dev/graphql",
    GADGET_API_KEY: undefined,
  }));

  const { default: freshHandler } = await import("@/pages/api/clients/getByTrainer");

  const req = { method: "GET", query: { trainerId: "abc123" } } as any;
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as any;

  await freshHandler(req, res);

  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith({
    error: "Server configuration error: Missing API key",
  });
});


  it("should handle GraphQL errors", async () => {
    req = { method: "GET", query: { trainerId: "t123" } };

    fetchMock.mockResponseOnce(
      JSON.stringify({ errors: [{ message: "Some GraphQL error" }] })
    );

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(fetchMock).toHaveBeenCalledWith(mockGADGET_API_URL, expect.any(Object));
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "GraphQL errors",
      })
    );
  });

  it("should return an empty client list if no clients found", async () => {
    req = { method: "GET", query: { trainerId: "t999" } };

    fetchMock.mockResponseOnce(
      JSON.stringify({ data: { clients: { edges: [] } } })
    );

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      clients: [],
    });
  });

  it("should return a formatted list of clients on success", async () => {
    req = { method: "GET", query: { trainerId: "trainer123" } };

    const mockGraphQLResponse = {
      data: {
        clients: {
          edges: [
            {
              node: {
                id: "1",
                userId: "u1",
                trainerId: "trainer123",
                user: {
                  firstName: "John",
                  lastName: "Doe",
                  email: "john@example.com",
                },
                workouts: { edges: [{ node: { id: "w1" } }] },
                mealPlan: { edges: [{ node: { id: "m1" } }] },
                weightTrend: { edges: [] },
                createdAt: "2025-01-01T00:00:00Z",
                updatedAt: "2025-01-02T00:00:00Z",
              },
            },
          ],
        },
      },
    };

    fetchMock.mockResponseOnce(JSON.stringify(mockGraphQLResponse));

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      clients: [
        expect.objectContaining({
          id: "1",
          userId: "u1",
          trainerId: "trainer123",
          name: "John Doe",
          email: "john@example.com",
          workoutCount: 1,
          mealPlanCount: 1,
          weightTrendCount: 0,
        }),
      ],
    });
  });

  it("should handle unexpected internal errors gracefully", async () => {
    req = { method: "GET", query: { trainerId: "t123" } };

    fetchMock.mockRejectOnce(new Error("Network failure"));

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Internal server error",
        details: "Network failure",
      })
    );
  });
});
