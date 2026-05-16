import type { Express, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { checkDatabase, getPool } from "../db.js";
import { register } from "../http.js";
import { normalizeText } from "../utils.js";

type TestUserBody = {
  nickname?: string;
  preferred_categories?: number[];
};

type DbUserRow = {
  id: string;
  nickname: string;
  profile_image: string | null;
  trust_score: number;
  kg_score: number;
  title_id: number | null;
  preferred_categories: number[];
  created_at: Date;
};

function serializeDbUser(row: DbUserRow) {
  return {
    id: row.id,
    nickname: row.nickname,
    profile_image: row.profile_image,
    trust_score: row.trust_score,
    kg_score: row.kg_score,
    title_id: row.title_id,
    preferred_categories: row.preferred_categories,
    created_at: row.created_at
  };
}

export function registerDbRoutes(app: Express) {
  register(app, "get", "/db/health", async (_req: Request, res: Response) => {
    try {
      res.json(await checkDatabase());
    } catch (error) {
      res.status(503).json({
        ok: false,
        error: (error as Error).message
      });
    }
  });

  register(app, "post", "/db/test/users", async (req: Request, res: Response) => {
    const pool = getPool();
    if (!pool) {
      res.status(503).json({ error: "DATABASE_URL is not configured" });
      return;
    }

    const body = req.body as TestUserBody;
    const nickname = normalizeText(body.nickname) || `DB테스트유저${randomUUID().slice(0, 4)}`;
    const preferredCategories = Array.isArray(body.preferred_categories)
      ? body.preferred_categories.filter((categoryId) => Number.isInteger(categoryId))
      : [4, 6];
    const userId = `user_${randomUUID().slice(0, 8)}`;

    const result = await pool.query<DbUserRow>(
      `insert into users (id, nickname, trust_score, kg_score, preferred_categories)
       values ($1, $2, 50, 0, $3::integer[])
       returning id, nickname, profile_image, trust_score, kg_score, title_id, preferred_categories, created_at`,
      [userId, nickname, preferredCategories]
    );

    res.status(201).json({ user: serializeDbUser(result.rows[0]) });
  });

  register(app, "get", "/db/test/users/:userId", async (req: Request<{ userId: string }>, res: Response) => {
    const pool = getPool();
    if (!pool) {
      res.status(503).json({ error: "DATABASE_URL is not configured" });
      return;
    }

    const result = await pool.query<DbUserRow>(
      `select id, nickname, profile_image, trust_score, kg_score, title_id, preferred_categories, created_at
       from users
       where id = $1`,
      [req.params.userId]
    );

    const user = result.rows[0];
    if (!user) {
      res.status(404).json({ error: "user_not_found" });
      return;
    }

    res.json({ user: serializeDbUser(user) });
  });
}
