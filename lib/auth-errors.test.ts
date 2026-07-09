import { describe, it, expect } from "vitest";
import { friendlyAuthError, RATE_LIMIT_MESSAGE } from "./auth-errors";

describe("friendlyAuthError", () => {
  it("returns the calm rate-limit message on a 429", () => {
    expect(friendlyAuthError({ status: 429, message: "Too many requests." }, "fallback")).toBe(
      RATE_LIMIT_MESSAGE,
    );
  });

  it("surfaces the server message for other errors", () => {
    expect(friendlyAuthError({ status: 401, message: "Invalid email or password" }, "fallback")).toBe(
      "Invalid email or password",
    );
  });

  it("trims whitespace around the server message", () => {
    expect(friendlyAuthError({ status: 400, message: "  Something went wrong  " }, "fallback")).toBe(
      "Something went wrong",
    );
  });

  it("uses the fallback when the message is missing, blank, or the error is null", () => {
    expect(friendlyAuthError({ status: 500 }, "fallback")).toBe("fallback");
    expect(friendlyAuthError({ status: 500, message: "   " }, "fallback")).toBe("fallback");
    expect(friendlyAuthError(null, "fallback")).toBe("fallback");
    expect(friendlyAuthError(undefined, "fallback")).toBe("fallback");
  });

  it("does not contain dashes in the rate-limit message", () => {
    expect(RATE_LIMIT_MESSAGE).not.toMatch(/[-–—]/);
  });
});
