import type { Express, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { getBearerToken, requireAuth } from "../auth.js";
import { posts, resolveTitle, users, type User } from "../data.js";
import { getPool } from "../db.js";
import { register } from "../http.js";
import type { AdminCreateUserBody, LoginBody, RefreshBody, SignupBody, UserProfileBody } from "../request-types.js";
import { serializeUser } from "../serializers.js";
import { accessTokenToUserId, authAccounts, postLikes, postScraps, refreshTokenToUserId } from "../state.js";
import { normalizeText, nowIso } from "../utils.js";

type DbUserRow = {
  id: string;
  nickname: string;
  profile_image: string | null;
  trust_score: number;
  kg_score: number;
  role: "user" | "admin";
  title_id: number | null;
  preferred_categories: number[];
  created_at: string;
};

type DbAuthAccountRow = {
  id: string;
  user_id: string;
  provider: string;
  provider_user_id: string;
  email: string | null;
  access_token_enc: string;
  refresh_token_enc: string;
  created_at: string;
};

function createToken(prefix: string, userId: string) {
  return `${prefix}_${userId}_${randomUUID()}`;
}

function upsertUserCache(user: User) {
  const existingIndex = users.findIndex((candidate) => candidate.id === user.id);
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
}

function upsertAuthCache(account: DbAuthAccountRow) {
  const existingIndex = authAccounts.findIndex((candidate) => candidate.id === account.id);
  if (existingIndex >= 0) {
    authAccounts[existingIndex] = {
      id: account.id,
      userId: account.user_id,
      provider: account.provider,
      providerUserId: account.provider_user_id,
      email: account.email,
      accessTokenEnc: account.access_token_enc,
      refreshTokenEnc: account.refresh_token_enc,
      createdAt: account.created_at
    };
  } else {
    authAccounts.push({
      id: account.id,
      userId: account.user_id,
      provider: account.provider,
      providerUserId: account.provider_user_id,
      email: account.email,
      accessTokenEnc: account.access_token_enc,
      refreshTokenEnc: account.refresh_token_enc,
      createdAt: account.created_at
    });
  }
}

const preferredCategoryNameBySlug: Record<string, string> = {
  western: "양식",
  chinese: "중식",
  japanese: "일식",
  pub: "술집"
};

function getDbTitleName(kgScore: number) {
  if (kgScore <= 5) return "새내기";
  if (kgScore <= 10) return "쩝쩝 학사";
  if (kgScore <= 30) return "쩝쩝 석사";
  if (kgScore <= 50) return "쩝쩝 박사";
  if (kgScore <= 70) return "쩝쩝 교수";
  if (kgScore <= 90) return "쩝쩝 총장";
  return "쩝신";
}

async function getDbTitleId(pool: NonNullable<ReturnType<typeof getPool>>, kgScore: number) {
  const result = await pool.query<{ id: number }>(
    `select id
     from titles
     where $1 >= min_kg and (max_kg is null or $1 <= max_kg)
     order by min_kg asc
     limit 1`,
    [kgScore]
  );

  return result.rows[0]?.id ?? null;
}

async function resolvePreferredCategoryIds(pool: NonNullable<ReturnType<typeof getPool>>, preferredCategories: string[]) {
  const uniqueNames = [...new Set(preferredCategories.map((category) => preferredCategoryNameBySlug[category]).filter(Boolean))];
  if (uniqueNames.length === 0) {
    return [] as number[];
  }

  const result = await pool.query<{ id: number; name: string }>(
    `select id, name
     from categories
     where name = any($1::text[])`,
    [uniqueNames]
  );

  const idByName = new Map(result.rows.map((row) => [row.name, row.id]));
  return preferredCategories
    .map((category) => preferredCategoryNameBySlug[category])
    .map((name) => idByName.get(name))
    .filter((value): value is number => typeof value === "number");
}

async function resolvePreferredCategorySlugs(pool: NonNullable<ReturnType<typeof getPool>>, preferredCategories: number[]) {
  if (preferredCategories.length === 0) {
    return [] as string[];
  }

  const result = await pool.query<{ id: number; name: string }>(
    `select id, name
     from categories
     where id = any($1::integer[])`,
    [preferredCategories]
  );

  const slugByName: Record<string, string> = {
    양식: "western",
    중식: "chinese",
    일식: "japanese",
    술집: "pub"
  };
  const nameById = new Map(result.rows.map((row) => [row.id, row.name]));
  return preferredCategories
    .map((categoryId) => nameById.get(categoryId))
    .map((name) => (name ? slugByName[name] : null))
    .filter((value): value is string => typeof value === "string");
}

function mapDbUserRowToMemoryUser(row: DbUserRow, preferredCategories: string[]) {
  return {
    id: row.id,
    nickname: row.nickname,
    profileImage: row.profile_image,
    trustScore: row.trust_score,
    kgScore: row.kg_score,
    titleId: resolveTitle(row.kg_score).id,
    role: row.role,
    preferredCategories,
    createdAt: row.created_at
  };
}

async function createUserAccount(pool: NonNullable<ReturnType<typeof getPool>>, body: SignupBody | AdminCreateUserBody, role: "user" | "admin") {
  const code = normalizeText(body.code);
  if (!code) {
    return { error: "code is required" as const };
  }

  const providerUserId = `gachon_${code}`;
  const existingAccount = await pool.query<{ id: string }>(
    `select id
     from auth_accounts
     where provider = 'gachon' and provider_user_id = $1`,
    [providerUserId]
  );

  if (existingAccount.rows[0]) {
    return { error: "account_exists" as const };
  }

  const nickname = normalizeText(body.nickname) || `가천유저${users.length + 1}`;
  const email = typeof body.email === "string" && body.email.trim() ? body.email.trim() : null;
  const preferredCategories = Array.isArray(body.preferred_categories) ? body.preferred_categories : ["japanese"];
  const preferredCategoryIds = await resolvePreferredCategoryIds(pool, preferredCategories);
  const titleId = await getDbTitleId(pool, 0);
  const userId = `user_${randomUUID().slice(0, 8)}`;
  const accessToken = createToken("access", userId);
  const refreshToken = createToken("refresh", userId);
  const authId = `auth_${randomUUID().slice(0, 8)}`;

  await pool.query(
    `insert into users (id, nickname, profile_image, trust_score, kg_score, role, title_id, preferred_categories)
     values ($1, $2, null, 50, 0, $3, $4, $5::integer[])`,
    [userId, nickname, role, titleId, preferredCategoryIds]
  );

  const authResult = await pool.query<DbAuthAccountRow>(
    `insert into auth_accounts (id, user_id, provider, provider_user_id, email, access_token_enc, refresh_token_enc)
     values ($1, $2, 'gachon', $3, $4, $5, $6)
     returning id, user_id, provider, provider_user_id, email, access_token_enc, refresh_token_enc, created_at`,
    [authId, userId, providerUserId, email, accessToken, refreshToken]
  );

  const memoryUser = mapDbUserRowToMemoryUser(
    {
      id: userId,
      nickname,
      profile_image: null,
      trust_score: 50,
      kg_score: 0,
      role,
      title_id: titleId,
      preferred_categories: preferredCategoryIds,
      created_at: nowIso()
    },
    preferredCategories
  );

  upsertUserCache(memoryUser);
  upsertAuthCache(authResult.rows[0]);
  accessTokenToUserId.set(accessToken, userId);
  refreshTokenToUserId.set(refreshToken, userId);

  return { user: memoryUser, accessToken, refreshToken } as const;
}

export function registerAuthRoutes(app: Express) {
  register(app, "post", "/auth/gachon/login", async (req: Request, res: Response) => {
    const body = req.body as LoginBody;
    const code = normalizeText(body.code);
    if (!code) {
      res.status(400).json({ error: "code is required" });
      return;
    }

    const pool = getPool();
    if (!pool) {
      res.status(503).json({ error: "DATABASE_URL is not configured" });
      return;
    }

    const providerUserId = `gachon_${code}`;
    const result = await pool.query<DbUserRow & { auth_id: string; email: string | null; access_token_enc: string; refresh_token_enc: string }>(
      `select a.id as auth_id,
              a.email,
              a.access_token_enc,
              a.refresh_token_enc,
              u.id,
              u.nickname,
              u.profile_image,
              u.trust_score,
              u.kg_score,
              u.role,
              u.title_id,
              u.preferred_categories,
              u.created_at
       from auth_accounts a
       inner join users u on u.id = a.user_id
       where a.provider = 'gachon' and a.provider_user_id = $1
       limit 1`,
      [providerUserId]
    );

    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: "account_not_found" });
      return;
    }

    const preferredCategories = await resolvePreferredCategorySlugs(pool, row.preferred_categories);
    const user = mapDbUserRowToMemoryUser(row, preferredCategories);
    upsertUserCache(user);

    const accessToken = createToken("access", user.id);
    const refreshToken = createToken("refresh", user.id);
    accessTokenToUserId.set(accessToken, user.id);
    refreshTokenToUserId.set(refreshToken, user.id);

    await pool.query(
      `update auth_accounts
       set access_token_enc = $1,
           refresh_token_enc = $2
       where id = $3`,
      [accessToken, refreshToken, row.auth_id]
    );

    upsertAuthCache({
      id: row.auth_id,
      user_id: user.id,
      provider: "gachon",
      provider_user_id: providerUserId,
      email: row.email,
      access_token_enc: accessToken,
      refresh_token_enc: refreshToken,
      created_at: row.created_at
    });

    res.json({ access_token: accessToken, refresh_token: refreshToken, user: serializeUser(user) });
  });

  register(app, "post", "/auth/signup", async (req: Request, res: Response) => {
    const pool = getPool();
    if (!pool) {
      res.status(503).json({ error: "DATABASE_URL is not configured" });
      return;
    }

    const body = req.body as SignupBody;
    const result = await createUserAccount(pool, body, "user");
    if ("error" in result) {
      res.status(result.error === "account_exists" ? 409 : 400).json({ error: result.error });
      return;
    }

    res.status(201).json({ user: serializeUser(result.user), access_token: result.accessToken, refresh_token: result.refreshToken });
  });

  register(app, "post", "/admin/users", async (req: Request, res: Response) => {
    const requester = requireAuth(req, res);
    if (!requester) {
      return;
    }
    if (requester.role !== "admin") {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    const pool = getPool();
    if (!pool) {
      res.status(503).json({ error: "DATABASE_URL is not configured" });
      return;
    }

    const body = req.body as AdminCreateUserBody;
    const result = await createUserAccount(pool, body, body.role ?? "user");
    if ("error" in result) {
      res.status(result.error === "account_exists" ? 409 : 400).json({ error: result.error });
      return;
    }

    res.status(201).json({ user: serializeUser(result.user), access_token: result.accessToken, refresh_token: result.refreshToken });
  });

  register(app, "post", "/auth/refresh", async (req: Request, res: Response) => {
    const pool = getPool();
    if (!pool) {
      res.status(503).json({ error: "DATABASE_URL is not configured" });
      return;
    }

    const refreshToken = normalizeText((req.body as RefreshBody).refresh_token);
    const userId = refreshTokenToUserId.get(refreshToken);

    if (!userId) {
      res.status(401).json({ error: "invalid_refresh_token" });
      return;
    }

    const user = users.find((candidate) => candidate.id === userId);
    if (!user) {
      res.status(401).json({ error: "invalid_refresh_token" });
      return;
    }

    const accessToken = createToken("access", user.id);
    const nextRefreshToken = createToken("refresh", user.id);
    accessTokenToUserId.set(accessToken, user.id);
    refreshTokenToUserId.delete(refreshToken);
    refreshTokenToUserId.set(nextRefreshToken, user.id);

    const account = authAccounts.find((candidate) => candidate.userId === user.id);
    if (account) {
      account.accessTokenEnc = accessToken;
      account.refreshTokenEnc = nextRefreshToken;
      await pool.query(
        `update auth_accounts
         set access_token_enc = $1,
             refresh_token_enc = $2
         where id = $3`,
        [accessToken, nextRefreshToken, account.id]
      );
    }

    res.json({ access_token: accessToken, refresh_token: nextRefreshToken });
  });

  register(app, "post", "/auth/logout", async (req: Request, res: Response) => {
    const pool = getPool();
    const refreshToken = normalizeText((req.body as RefreshBody).refresh_token);
    const accessToken = getBearerToken(req);

    if (accessToken) {
      accessTokenToUserId.delete(accessToken);
    }

    if (refreshToken) {
      const userId = refreshTokenToUserId.get(refreshToken);
      refreshTokenToUserId.delete(refreshToken);
      if (userId) {
        const account = authAccounts.find((candidate) => candidate.userId === userId);
        if (account) {
          account.accessTokenEnc = "";
          account.refreshTokenEnc = "";
          if (pool) {
            await pool.query(
              `update auth_accounts
               set access_token_enc = '',
                   refresh_token_enc = ''
               where id = $1`,
              [account.id]
            );
          }
        }
      }
    }

    res.json({ ok: true });
  });

  register(app, "get", "/users/me", async (req: Request, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    let postedCount = posts.filter((post) => post.userId === user.id && post.status !== "deleted").length;
    let clipCount = postScraps.filter((action) => {
      const post = posts.find((candidate) => candidate.id === action.postId);
      return action.userId === user.id && Boolean(post) && post?.status !== "deleted";
    }).length;
    let recommendedCount = postLikes.filter((action) => {
      const post = posts.find((candidate) => candidate.id === action.postId);
      return action.userId === user.id && Boolean(post) && post?.status !== "deleted";
    }).length;
    const pool = getPool();
    if (pool) {
      const [postResult, clipResult, likeResult] = await Promise.all([
        pool.query<{ count: string }>(`select count(*)::text as count from posts where user_id = $1 and status <> 'deleted'`, [user.id]),
        pool.query<{ count: string }>(
          `select count(*)::text as count
           from post_scraps ps
           join posts p on p.id = ps.post_id
           where ps.user_id = $1 and p.status <> 'deleted'`,
          [user.id]
        ),
        pool.query<{ count: string }>(
          `select count(*)::text as count
           from post_likes pl
           join posts p on p.id = pl.post_id
           where pl.user_id = $1 and p.status <> 'deleted'`,
          [user.id]
        )
      ]);
      postedCount = Number(postResult.rows[0]?.count ?? postedCount);
      clipCount = Number(clipResult.rows[0]?.count ?? clipCount);
      recommendedCount = Number(likeResult.rows[0]?.count ?? recommendedCount);
    }
    const serializedUser = serializeUser(user);

    res.json({
      ...serializedUser,
      kg: serializedUser.kg_score,
      posted_count: postedCount,
      clip_count: clipCount,
      recommended_count: recommendedCount
    });
  });

  register(app, "patch", "/users/me", async (req: Request, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    const pool = getPool();
    if (!pool) {
      res.status(503).json({ error: "DATABASE_URL is not configured" });
      return;
    }

    const profileBody = req.body as UserProfileBody;
    if (typeof profileBody.nickname === "string" && profileBody.nickname.trim()) {
      user.nickname = profileBody.nickname.trim();
    }
    if (typeof profileBody.email === "string") {
      const account = authAccounts.find((candidate) => candidate.userId === user.id);
      if (account) {
        account.email = profileBody.email;
        await pool.query(
          `update auth_accounts
           set email = $1
           where user_id = $2`,
          [profileBody.email, user.id]
        );
      }
    }
    if (Array.isArray(profileBody.preferred_categories) && profileBody.preferred_categories.length > 0) {
      user.preferredCategories = profileBody.preferred_categories;
      const preferredCategoryIds = await resolvePreferredCategoryIds(pool, profileBody.preferred_categories);
      await pool.query(
        `update users
         set nickname = $1,
             preferred_categories = $2::integer[]
         where id = $3`,
        [user.nickname, preferredCategoryIds, user.id]
      );
    } else {
      await pool.query(
        `update users
         set nickname = $1
         where id = $2`,
        [user.nickname, user.id]
      );
    }

    res.json({ updated_user: serializeUser(user) });
  });
}
