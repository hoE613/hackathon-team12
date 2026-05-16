import cors from "cors";
import express, { type Request, type Response } from "express";
import { register } from "./http.js";
import { registerRoutes } from "./routes/index.js";
import { nowIso } from "./utils.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  register(app, "get", "/health", (_req: Request, res: Response) => {
    res.json({ ok: true, service: "backend", timestamp: nowIso() });
  });

  registerRoutes(app);

  return app;
}
