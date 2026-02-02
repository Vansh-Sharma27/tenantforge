import { describe, it, expect } from "vitest";
import request from "supertest";

import { createApp } from "../../src/app";

describe("Health Check", () => {
  const app = createApp();

  it("GET /health should return 200 with healthy status", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      data: {
        status: "healthy",
      },
    });
    expect(response.body.data.timestamp).toBeDefined();
  });

  it("should return 404 for undefined routes", async () => {
    const response = await request(app).get("/undefined-route");

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({
      status: 404,
      title: "Not Found",
    });
  });
});
