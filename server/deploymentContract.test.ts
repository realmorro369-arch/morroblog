import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const projectRoot = path.resolve(import.meta.dirname, "..");
const readProjectFile = (file: string) => fs.readFileSync(path.join(projectRoot, file), "utf8");

describe("fnos deployment contract", () => {
  it("builds the complete Node application in the image and starts the compiled server", () => {
    const dockerfile = readProjectFile("Dockerfile");

    expect(dockerfile).toContain("FROM node:22-slim");
    expect(dockerfile).toContain("COPY . .");
    expect(dockerfile).toContain("corepack pnpm install --frozen-lockfile");
    expect(dockerfile).toContain("corepack pnpm run build");
    expect(dockerfile).toContain('CMD ["node", "dist/index.js"]');
    expect(dockerfile).toContain("HEALTHCHECK");
    expect(dockerfile).toContain("/healthz");
    expect(dockerfile).not.toContain("/app/client/dist");
  });

  it("connects the app to the compose-managed MySQL service only after its health check", () => {
    const compose = readProjectFile("docker-compose.yml");

    expect(compose).toContain("@mysql:3306/");
    expect(compose).toContain("condition: service_healthy");
    expect(compose).toContain('"3000:3000"');
    expect(compose).toContain("MYSQL_ROOT_PASSWORD must be set");
    expect(compose).toContain("JWT_SECRET must be set");
    expect(compose).not.toContain('"3306:3306"');
    expect(compose).toContain("mysqladmin ping -h localhost -uroot -p$$MYSQL_ROOT_PASSWORD --silent");
    expect(compose).toContain("condition: service_completed_successfully");
    expect(compose).toContain('command: ["sh", "-c", "pnpm run db:migrate"]');
  });

  it("passes SMTP credentials only to the server environment", () => {
    const compose = readProjectFile("docker-compose.yml");

    expect(compose).toContain("SMTP_HOST: ${SMTP_HOST}");
    expect(compose).toContain("SMTP_PASS: ${SMTP_PASS}");
    expect(compose).toContain("SMTP_FROM: ${SMTP_FROM}");
    expect(compose).toContain("INITIAL_ADMIN_EMAIL: ${INITIAL_ADMIN_EMAIL}");
  });

  it("exposes an unauthenticated container health probe without conflating it with the tRPC API", () => {
    const entry = readProjectFile("server/_core/index.ts");
    expect(entry).toContain('app.get("/healthz"');
    expect(entry).toContain('status(200).type("text/plain").send("ok")');
  });

  it("keeps a non-Docker production path that migrates before starting the compiled server", () => {
    const manifest = JSON.parse(readProjectFile("package.json")) as { scripts?: Record<string, string> };
    const nodeGuide = readProjectFile("NODE_DEPLOYMENT.md");

    expect(manifest.scripts?.["db:migrate"]).toBe("drizzle-kit migrate");
    expect(manifest.scripts?.["start:production"]).toContain("node dist/index.js");
    expect(nodeGuide).toContain("DATABASE_URL=");
    expect(nodeGuide).toContain("pnpm run db:migrate");
    expect(nodeGuide).toContain("pnpm run start:production");
    expect(nodeGuide).toContain("/healthz");
    expect(nodeGuide).toContain("EnvironmentFile=/etc/morroblog/morroblog.env");
  });
});
