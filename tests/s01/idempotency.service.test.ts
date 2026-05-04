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

describe("S01 idempotency behavior", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("ignores GET requests even when an Idempotency-Key is supplied", async () => {
    const { getReusableResponse, persistResponse } = await import("../../src/lib/server/services/idempotency.service.js");

    await expect(
      getReusableResponse({
        userId: "user-1",
        idempotencyKey: "11111111-1111-4111-8111-111111111111",
        endpoint: "/api/v1/org",
        method: "GET"
      })
    ).resolves.toBeNull();

    await persistResponse({
      userId: "user-1",
      idempotencyKey: "11111111-1111-4111-8111-111111111111",
      endpoint: "/api/v1/org",
      method: "GET",
      responseStatus: 200,
      responseBody: { ok: true }
    });

    expect(mocks.findReusableIdempotentResponse).not.toHaveBeenCalled();
    expect(mocks.saveIdempotentResponse).not.toHaveBeenCalled();
  });

  it("uses stored responses for PATCH requests", async () => {
    const { getReusableResponse, persistResponse } = await import("../../src/lib/server/services/idempotency.service.js");
    const stored = { responseStatus: 200, responseBody: { name: "Compass HQ" } };
    mocks.findReusableIdempotentResponse.mockResolvedValueOnce(stored);

    await expect(
      getReusableResponse({
        userId: "user-1",
        idempotencyKey: "11111111-1111-4111-8111-111111111111",
        endpoint: "/api/v1/org",
        method: "PATCH"
      })
    ).resolves.toBe(stored);

    await persistResponse({
      userId: "user-1",
      idempotencyKey: "11111111-1111-4111-8111-111111111111",
      endpoint: "/api/v1/org",
      method: "PATCH",
      responseStatus: 200,
      responseBody: { name: "Compass HQ" }
    });

    expect(mocks.findReusableIdempotentResponse).toHaveBeenCalledTimes(1);
    expect(mocks.saveIdempotentResponse).toHaveBeenCalledTimes(1);
  });
});
