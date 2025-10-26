import handler from "@/pages/api/trainers/delete";
import { GADGET_API_URL, GADGET_API_KEY } from "@/config/api";
import { details } from "framer-motion/client";
import { warn } from "console";

jest.mock("@/config/api", () => ({
  GADGET_API_URL: "https://mock.api/graphql",
  GADGET_API_KEY: "test-key",
}));

global.fetch = jest.fn();

describe("/api/trainers/delete", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = { method: "DELETE", body: {} };
    res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    jest.clearAllMocks();
  });

  it("returns 405 for non-DELETE requests", async () => {
    req.method = "GET";
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" });
  });

  it("returns 400 if trainer ID is missing", async () => {
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: "Trainer ID is required" });
  });

  it("returns 500 if API key is missing", async () => {
    jest.resetModules();
    jest.doMock("@/config/api", () => ({
      GADGET_API_URL: "https://mock.api/graphql",
      GADGET_API_KEY: "",
    }));
    const { default: missingKeyHandler } = await import("@/pages/api/trainers/delete");
    req.body = { id: "trainer123" };
    await missingKeyHandler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Server configuration error: Missing API key",
    });
  });

  it("returns 400 if fetching trainer fails", async () => {
    req.body = { id: "trainer123" };
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        errors: [{ message: "Bad query" }],
      }),
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Failed to fetch trainer",
      details: [{ message: "Bad query" }],
    });
  });

  it("returns 404 if trainer not found", async () => {
    req.body = { id: "trainer123" };
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        data: { trainer: null },
      }),
    });
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: "Trainer not found" });
  });

  it("returns 400 if deleting trainer fails", async () => {
    req.body = { id: "trainer123" };
    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: async () => ({
          data: { trainer: { id: "trainer123" } },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          data: { deleteTrainer: { success: false } },
        }),
      });

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Failed to delete trainer",
      details: undefined,
    });
  });

  it("returns 200 with warning if user deletion fails", async () => {
    req.body = { id: "trainer123", userId: "user123" };

    (fetch as jest.Mock)
      // Fetch trainer
      .mockResolvedValueOnce({
        json: async () => ({
          data: { trainer: { id: "trainer123", userId: "user123" } },
        }),
      })
      // Delete trainer success
      .mockResolvedValueOnce({
        json: async () => ({
          data: { deleteTrainer: { success: true } },
        }),
      })
      // Delete user fails
      .mockResolvedValueOnce({
        json: async () => ({
          data: { deleteUser: { success: false } },
        }),
      });

    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      deletedTrainerId: "trainer123",
      userId: "user123",
      success: true,
      message: "Trainer deleted but user deletion failed",
      warning: "Associated user account may still exist",
    });
  });

  it("deletes trainer and user successfully", async () => {
    req.body = { id: "trainer123", userId: "user123" };

    (fetch as jest.Mock)
      // Fetch trainer
      .mockResolvedValueOnce({
        json: async () => ({
          data: { trainer: { id: "trainer123", userId: "user123" } },
        }),
      })
      // Delete trainer success
      .mockResolvedValueOnce({
        json: async () => ({
          data: { deleteTrainer: { success: true } },
        }),
      })
      // Delete user success
      .mockResolvedValueOnce({
        json: async () => ({
          data: { deleteUser: { success: true } },
        }),
      });

    await handler(req, res);
    expect(fetch).toHaveBeenCalledTimes(3);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      deletedTrainerId: "trainer123",
      deletedUserId: "user123",
      message: "Trainer and associated user deleted successfully",
    });
  });

  it("returns 500 if fetch throws an error", async () => {
    req.body = { id: "trainer123" };
    (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network failure"));
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      details: "Network failure",
      error: "Internal server error"
    });
  });
});
