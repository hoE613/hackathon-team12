import type { Request, Response } from "express";
import { users } from "./data.js";
import { accessTokenToUserId } from "./state.js";

export function getBearerToken(req: Request) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice("Bearer ".length).trim() || null;
}

export function getUserFromRequest(req: Request) {
  const token = getBearerToken(req);
  if (!token) {
    return null;
  }

  const userId = accessTokenToUserId.get(token);
  if (!userId) {
    return null;
  }

  return users.find((user) => user.id === userId) ?? null;
}

export function requireAuth(req: Request, res: Response) {
  const user = getUserFromRequest(req);
  if (!user) {
    res.status(401).json({ error: "unauthorized" });
    return null;
  }

  return user;
}
