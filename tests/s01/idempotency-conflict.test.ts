import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findReusableIdempotentResponse: vi.fn(),
  findActiveIdempotentResponseByKey: vi.fn(),
  saveIdempotentResponse: vi.fn()
}));

vi.mock("$lib/server/repositories/idempotency.repository.js", () => ({
  findReusableIdempotentResponse: mocks.findReusableIdempotentResponse,
  findActiveIdempotentResponseByKey: mocks.findActiveIdempotentResponseByKey,
  saveIdempotentResponse: mocks.saveIdempotentResponse
}));

describe("idempotency key conflicts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects reuse of the same key for a different endpoint or method before execution", async () => {
    const { getReusableResponse } = await import("../../src/lib/server/services/idempotency.service.js");
    mocks.findReusableIdempotentResponse.mockResolvedValueOnce(null);
    mocks.findActiveIdempotentResponseByKey.mockResolvedValueOnce({
      endpoint: "/api/v1/users",
      method: "POST"
    });

    await expect(
      getReusableResponse({
        userId: "user-1",
        idempotencyKey: "11111111-1111-4111-8111-111111111111",
        endpoint: "/api/v1/employees",
        method: "POST"
      })
    ).rejects.toMatchObject({ code: "PRECONDITION_FAILED" });
  });
});
