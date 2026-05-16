import type { Express, Request, Response } from "express";
import { buildCategoryRankings, buildUserRankings, titles } from "../data.js";
import { register } from "../http.js";
import { getCategoryById } from "../services/posts.js";

export function registerRankingsRoutes(app: Express) {
  register(app, "get", "/rankings/users", (_req: Request, res: Response) => {
    res.json({ rankings: buildUserRankings() });
  });

  register(app, "get", "/rankings/categories/:categoryId", (req: Request<{ categoryId: string }>, res: Response) => {
    const category = getCategoryById(req.params.categoryId);
    if (!category) {
      res.status(404).json({ error: "category_not_found" });
      return;
    }

    res.json({ rankings: buildCategoryRankings(category.id) });
  });

  register(app, "get", "/rankings/titles", (_req: Request, res: Response) => {
    res.json({ titles });
  });
}
