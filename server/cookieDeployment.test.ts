import { describe, expect, it } from "vitest";
import { getSessionCookieOptions } from "./_core/cookies";

describe("session cookies across deployment protocols", () => {
  it("keeps secure, same-site attributes for HTTPS hosting", () => {
    expect(getSessionCookieOptions({ protocol: "https", headers: {} } as any)).toMatchObject({ secure: true, sameSite: "lax", httpOnly: true });
  });

  it("uses SameSite=Lax without Secure for direct HTTP fnos/LAN access", () => {
    expect(getSessionCookieOptions({ protocol: "http", headers: {} } as any)).toMatchObject({ secure: false, sameSite: "lax", httpOnly: true });
  });
});
