import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { promoteConfiguredInitialAdmin } from "../db";
import { createRobotsTxt, createRssXml, createSitemapXml, getPageMetadata, getPublicSiteUrl, injectPageMetadata } from "../publicSite";

const REGISTRATION_WINDOW_MS = 60 * 1000;
const MAX_REGISTRATION_REQUESTS_PER_IP = 8;
const registrationRequests = new Map<string, { count: number; resetAt: number }>();

function registrationRateLimit(req: express.Request, res: express.Response, next: express.NextFunction) {
  if (!req.path.includes("auth.requestRegistrationCode")) return next();
  const now = Date.now();
  const key = req.socket.remoteAddress ?? "unknown";
  const current = registrationRequests.get(key);
  if (!current || current.resetAt <= now) {
    registrationRequests.set(key, { count: 1, resetAt: now + REGISTRATION_WINDOW_MS });
    return next();
  }
  if (current.count >= MAX_REGISTRATION_REQUESTS_PER_IP) {
    res.status(429).json({ error: "请求过于频繁，请稍后再试" });
    return;
  }
  current.count += 1;
  return next();
}

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  await promoteConfiguredInitialAdmin(process.env.INITIAL_ADMIN_EMAIL);
  const app = express();
  app.set("trust proxy", true);
  const server = createServer(app);
  app.disable("x-powered-by");
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    next();
  });
  // 30 MiB 原始图片经过 Base64 编码后约为 40 MiB；媒体路由仍按原始二进制大小严格限制为 30 MiB。
  // 留出 JSON/tRPC 包装余量，确保有效请求不会在进入路由前被解析器拒绝。
  app.use(express.json({ limit: "45mb" }));
  app.use(express.urlencoded({ limit: "100kb", extended: true }));
  app.get("/healthz", (_req, res) => res.status(200).type("text/plain").send("ok"));
  registerStorageProxy(app);
  app.use("/api/trpc", registrationRateLimit);
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  app.get("/rss.xml", async (req, res, next) => {
    try {
      const body = await createRssXml(getPublicSiteUrl(req));
      res.type("application/rss+xml; charset=utf-8").send(body);
    } catch (error) { next(error); }
  });
  app.get("/sitemap.xml", async (req, res, next) => {
    try {
      const body = await createSitemapXml(getPublicSiteUrl(req));
      res.type("application/xml; charset=utf-8").send(body);
    } catch (error) { next(error); }
  });
  app.get("/robots.txt", (req, res) => res.type("text/plain; charset=utf-8").send(createRobotsTxt(getPublicSiteUrl(req))));
  const transformPageMetadata = async (url: string, template: string, req: express.Request) => injectPageMetadata(template, await getPageMetadata(url, getPublicSiteUrl(req)));
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server, transformPageMetadata);
  } else {
    serveStatic(app, transformPageMetadata);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
