import handler from "@/pages/api/clients/update";

jest.mock("@/config/api", () => ({
  GADGET_API_URL: "https://mock.api/graphql",
  GADGET_API_KEY: "test-api-key",
}));

global.fetch = jest.fn();

describe("/api/clients/update", () => {
  let req: any;
  let res: any;

  beforeEach(() => {
    req = { method: "PUT", body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    (fetch as jest.Mock).mockReset();
  });

  it("should return 405 for non-PUT requests", async () => {
    req.method = "GET";
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: "Method not allowed" });
  });

  it("should return 400 if clientId or userId is missing", async () => {
    req.body = { clientId: "123" };
    await handler(req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Client ID and User ID are required",
    });
  });

  it("should return 500 if API key is missing", async () => {
    jest.resetModules(); // reimport with missing key
    jest.doMock("@/config/api", () => ({
      GADGET_API_URL: "mock-url",
      GADGET_API_KEY: undefined,
    }));
    const missingKeyHandler = (await import("@/pages/api/clients/update")).default;

    req.body = { clientId: "123", userId: "456" };
    await missingKeyHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: "Server configuration error: Missing API key",
    });
  });

  it("should update user and trainer successfully", async () => {
    req.body = {
      clientId: "c1",
      userId: "u1",
      firstName: "John",
      lastName: "Doe",
      email: "john@example.com",
      trainerId: "t1",
    };

    (fetch as jest.Mock)
      .mockResolvedValueOnce({
        json: async () => ({
          data: { updateUser: { success: true } },
        }),
      })
      .mockResolvedValueOnce({
        json: async () => ({
          data: { updateClient: { success: true } },
        }),
      });

    await handler(req, res);

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      message: "Client updated successfully",
    });
  });

  it("should return 400 if user update fails", async () => {
    req.body = { clientId: "c1", userId: "u1", firstName: "John" };
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        data: {
          updateUser: {
            success: false,
            errors: [{ message: "User update failed" }],
          },
        },
      }),
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "User update failed",
      details: undefined,
    });
  });

  it("should return 400 if client update fails", async () => {
    req.body = { clientId: "c1", userId: "u1", trainerId: "t1" };
    (fetch as jest.Mock).mockResolvedValueOnce({
      json: async () => ({
        data: {
          updateClient: {
            success: false,
            errors: [{ message: "Client update failed" }],
          },
        },
      }),
    });

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: "Client update failed",
      details: undefined,
    });
  });

  it("should return 500 if fetch throws an error", async () => {
  req.body = { clientId: "c1", userId: "u1", firstName: "John" };
  (fetch as jest.Mock).mockRejectedValueOnce(new Error("Network failure"));

  await handler(req, res);

  expect(fetch).toHaveBeenCalledTimes(1);
  expect(res.status).toHaveBeenCalledWith(500);
  expect(res.json).toHaveBeenCalledWith({
    error: "Internal server error",
    details: "Network failure",
  });
});

});
