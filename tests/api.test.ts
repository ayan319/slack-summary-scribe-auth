import request from "supertest";
import app from "../server";

describe("API Endpoints", () => {
  describe("GET /api/test", () => {
    it("should return 200 status with success message", async () => {
      const response = await request(app).get("/api/test").expect(200);

      expect(response.body).toEqual({
        success: true,
        message: "API is working!",
        timestamp: expect.any(String),
      });
    });

    it("should return valid timestamp", async () => {
      const response = await request(app).get("/api/test").expect(200);

      const timestamp = new Date(response.body.timestamp);
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it("should have correct content-type", async () => {
      await request(app)
        .get("/api/test")
        .expect("Content-Type", /json/)
        .expect(200);
    });
  });

  describe("POST /api/summarize", () => {
    it("should return 400 for missing messages", async () => {
      const response = await request(app)
        .post("/api/summarize")
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: "Messages array is required",
      });
    });

    it("should return 400 for empty messages array", async () => {
      const response = await request(app)
        .post("/api/summarize")
        .send({ messages: [] })
        .expect(400);

      expect(response.body).toEqual({
        success: false,
        error: "Messages array cannot be empty",
      });
    });

    it("should return 400 for invalid message format", async () => {
      const response = await request(app)
        .post("/api/summarize")
        .send({
          messages: [{ invalid: "format" }],
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Invalid message format");
    });

    it("should accept valid message format", async () => {
      const validMessages = [
        {
          user: "john.doe",
          text: "Hello team!",
          timestamp: "2024-01-01T10:00:00Z",
        },
      ];

      const response = await request(app)
        .post("/api/summarize")
        .send({ messages: validMessages });

      // Should not return 400 for valid format
      expect(response.status).not.toBe(400);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.summary).toBeDefined();
      }
    });
  });
});
