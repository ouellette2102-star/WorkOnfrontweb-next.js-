import { describe, expect, it } from "vitest";
import { buildBackendErrorBody, normalizeBackendError } from "./backend-error";

describe("normalizeBackendError", () => {
  it("preserves the canonical backend error shape", () => {
    const error = normalizeBackendError(
      {
        error: {
          code: "BAD_REQUEST",
          message: "property password should not exist",
          status: 400,
          requestId: "req_123",
          details: ["property password should not exist"],
        },
      },
      "Fallback",
    );

    expect(error).toEqual({
      code: "BAD_REQUEST",
      message: "property password should not exist",
      status: 400,
      requestId: "req_123",
      details: ["property password should not exist"],
    });
  });

  it("supports legacy top-level message responses", () => {
    expect(
      normalizeBackendError({ message: "Session expiree" }, "Fallback", 401),
    ).toEqual({
      message: "Session expiree",
      status: 401,
    });
  });

  it("builds a proxy body that keeps message plus structured proof fields", () => {
    const body = buildBackendErrorBody(
      {
        error: {
          code: "TOKEN_EXPIRED",
          message: "Invalid or expired reset token",
          status: 400,
          requestId: "req_reset",
        },
      },
      "Fallback",
    );

    expect(body).toEqual({
      message: "Invalid or expired reset token",
      code: "TOKEN_EXPIRED",
      status: 400,
      requestId: "req_reset",
      error: {
        message: "Invalid or expired reset token",
        code: "TOKEN_EXPIRED",
        status: 400,
        requestId: "req_reset",
      },
    });
  });
});

