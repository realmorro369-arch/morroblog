import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (file: string) => fs.readFileSync(path.resolve(import.meta.dirname, "../client/src/pages", file), "utf8");

describe("authenticated page loading contract", () => {
  it.each(["CreatePost.tsx", "PostWorkspace.tsx"])("waits for auth state before rendering an authorization error in %s", file => {
    const page = source(file);
    const loadingIndex = page.indexOf("if (isAuthLoading)");
    const unauthorizedIndex = page.indexOf("if (!isAuthenticated)");

    expect(loadingIndex).toBeGreaterThan(-1);
    expect(unauthorizedIndex).toBeGreaterThan(loadingIndex);
  });
});
