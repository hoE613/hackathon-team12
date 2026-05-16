import type { Express } from "express";
import { registerAiRoutes } from "./ai.routes.js";
import { registerAuthRoutes } from "./auth.routes.js";
import { registerDbRoutes } from "./db.routes.js";
import { registerPostsRoutes } from "./posts.routes.js";
import { registerRankingsRoutes } from "./rankings.routes.js";
import { registerSeedRoutes } from "./seed.routes.js";

export function registerRoutes(app: Express) {
  registerAuthRoutes(app);
  registerDbRoutes(app);
  registerPostsRoutes(app);
  registerRankingsRoutes(app);
  registerAiRoutes(app);
  registerSeedRoutes(app);
}
