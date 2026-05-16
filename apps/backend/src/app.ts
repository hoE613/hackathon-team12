import cors from "cors";
import express, { type NextFunction, type Request, type Response } from "express";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { register } from "./http.js";
import { registerRoutes } from "./routes/index.js";
import { nowIso } from "./utils.js";

export function createApp() {
  const app = express();
  const currentDir = dirname(fileURLToPath(import.meta.url));
  const frontendDist = resolve(currentDir, "../../../frontend/dist");
  const frontendIndex = resolve(frontendDist, "index.html");

  app.use(cors());
  app.use(express.json());

  register(app, "get", "/health", (_req: Request, res: Response) => {
    res.json({ ok: true, service: "backend", timestamp: nowIso() });
  });

  if (existsSync(frontendIndex)) {
    app.get("/posts", (req: Request, res: Response, next: NextFunction) => {
      const accept = req.headers.accept ?? "";
      if (accept.includes("text/html")) {
        res.sendFile(frontendIndex);
        return;
      }
      next();
    });
  }

  registerRoutes(app);

  if (existsSync(frontendIndex)) {
    app.use(express.static(frontendDist));
    app.get("*", (_req: Request, res: Response) => {
      res.sendFile(frontendIndex);
    });
  }

  return app;
}
