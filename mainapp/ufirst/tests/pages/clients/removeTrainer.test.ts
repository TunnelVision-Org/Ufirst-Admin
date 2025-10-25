import handler from "@/pages/api/clients/removeTrainer";
import { NextApiRequest, NextApiResponse } from "next";
import fetchMock from "jest-fetch-mock";

// Mock configuration module
jest.mock("@/config/api", () => ({
  GADGET_API_URL: "https://api.gadget.dev/graphql",
  GADGET_API_KEY: "test-api-key",
}));

describe("API: /api/clients/removeTrainer", () => {
  let req: Partial<NextApiRequest>;
  let res: Partial<NextApiResponse>;

  beforeEach(() => {
    fetchMock.resetMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should return 405 for non-PUT methods", async () => {
    req = { method: "GET" };

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" });
  });

  it("should return 400 if clientId is missing", async () => {
    req = { method: "PUT", body: {} };

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Client ID is required" });
  });

  it("should return 500 if API key is missing", async () => {
    // Reload module with missing API key
    jest.resetModules();
    jest.doMock("@/config/api", () => ({
      GADGET_API_URL: "https://api.gadget.dev/graphql",
      GADGET_API_KEY: undefined,
    }));

    const { default: freshHandler } = await import("@/pages/api/clients/removeTrainer");

    req = { method: "PUT", body: { clientId: "client123" } };
    await freshHandler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Server configuration error: Missing API key",
    });
  });

  it("should handle GraphQL-level errors", async () => {
    req = { method: "PUT", body: { clientId: "client123" } };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        errors: [{ message: "GraphQL query failed" }],
      })
    );

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Failed to remove trainer",
      })
    );
  });

  it("should handle unsuccessful mutation (success: false)", async () => {
    req = { method: "PUT", body: { clientId: "client123" } };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        data: {
          updateClient: {
            success: false,
            errors: [{ message: "Trainer already removed" }],
          },
        },
      })
    );

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: "Trainer already removed",
      })
    );
  });

  it("should return 200 on successful trainer removal", async () => {
    req = { method: "PUT", body: { clientId: "client123" } };

    fetchMock.mockResponseOnce(
      JSON.stringify({
        data: {
          updateClient: {
            success: true,
            errors: [],
          },
        },
      })
    );

    await handler(req as NextApiRequest, res as NextApiResponse);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.gadget.dev/graphql",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer test-api-key",
        }),
      })
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Trainer removed successfully",
    });
  });

  it("should handle unexpected internal errors", async () => {
    req = { method: "PUT", body: { clientId: "client123" } };
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
