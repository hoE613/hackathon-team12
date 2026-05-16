import type { Express, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { requireAuth } from "../auth.js";
import { buildSeedResponse, categories, posts, resolveTitle, reviews, type Post, type Review, type User, users } from "../data.js";
import { getPool } from "../db.js";
import { register } from "../http.js";
import { authAccounts, postLikes } from "../state.js";
import { nowIso } from "../utils.js";

type SeedUser = {
  code: string;
  nickname: string;
  email: string;
  preferredCategories: string[];
};

const seedUsers: SeedUser[] = [
  { code: "seed_user_01", nickname: "테스트유저1", email: "seed1@example.com", preferredCategories: ["western", "japanese"] },
  { code: "seed_user_02", nickname: "테스트유저2", email: "seed2@example.com", preferredCategories: ["chinese", "pub"] },
  { code: "seed_user_03", nickname: "테스트유저3", email: "seed3@example.com", preferredCategories: ["japanese", "western"] },
  { code: "seed_user_04", nickname: "테스트유저4", email: "seed4@example.com", preferredCategories: ["pub", "chinese"] },
  { code: "seed_user_05", nickname: "테스트유저5", email: "seed5@example.com", preferredCategories: ["western", "pub"] },
  { code: "seed_user_06", nickname: "테스트유저6", email: "seed6@example.com", preferredCategories: ["japanese", "chinese"] }
];

const postCategoryCycle = ["western", "chinese", "japanese", "pub", "western"];

const categoryNameBySlug: Record<string, string> = {
  western: "양식",
  chinese: "중식",
  japanese: "일식",
  pub: "술집"
};

function createToken(prefix: string, userId: string) {
  return `${prefix}_${userId}_${randomUUID()}`;
}

function upsertUserCache(user: User) {
  const index = users.findIndex((candidate) => candidate.id === user.id);
  if (index >= 0) {
    users[index] = user;
  } else {
    users.push(user);
  }
}

async function getDbTitleId(kgScore: number) {
  const pool = getPool();
  if (!pool) {
    return null;
  }

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

async function resolvePreferredCategoryIds(preferredCategories: string[]) {
  const pool = getPool();
  if (!pool) {
    return [] as number[];
  }

  const names = [...new Set(preferredCategories.map((slug) => categoryNameBySlug[slug]).filter(Boolean))];
  if (names.length === 0) {
    return [] as number[];
  }

  const result = await pool.query<{ id: number; name: string }>(
    `select id, name
     from categories
     where name = any($1::text[])`,
    [names]
  );

  const idByName = new Map(result.rows.map((row) => [row.name, row.id]));
  return preferredCategories
    .map((slug) => categoryNameBySlug[slug])
    .map((name) => idByName.get(name))
    .filter((value): value is number => typeof value === "number");
}

async function resolveCategoryId(categorySlug: string) {
  const pool = getPool();
  if (!pool) {
    return null;
  }

  const result = await pool.query<{ id: number }>(
    `select id
     from categories
     where name = $1
     order by parent_id nulls last, id asc
     limit 1`,
    [categoryNameBySlug[categorySlug] ?? categoryNameBySlug.western]
  );

  return result.rows[0]?.id ?? null;
}

async function ensureSeedRestaurant(restaurantId: string, categorySlug: string) {
  const pool = getPool();
  if (!pool) {
    return;
  }

  const categoryId = await resolveCategoryId(categorySlug);
  if (!categoryId) {
    return;
  }

  await pool.query(
    `insert into restaurants (id, name, category_id, address, phone, price_range, business_hours)
     values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (id) do update set
       name = excluded.name,
       category_id = excluded.category_id,
       address = excluded.address,
       phone = excluded.phone,
       price_range = excluded.price_range,
       business_hours = excluded.business_hours,
       updated_at = now()`,
    [restaurantId, "오므라이스 연구소", categoryId, "성남시 수정구 가천로 1", "031-000-0001", "10,000-15,000", "11:00-21:00"]
  );
}

async function upsertSeedPostToDb(post: Post) {
  const pool = getPool();
  if (!pool) {
    return;
  }

  await ensureSeedRestaurant(post.restaurantId, post.categoryId);
  const categoryId = await resolveCategoryId(post.categoryId);
  if (!categoryId) {
    return;
  }

  await pool.query(
    `insert into posts (
       id, user_id, restaurant_id, category_id, title, content, average_rating, review_count,
       photo_count, like_count, kg_score, status, created_at, updated_at, photos
     )
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13, $14::text[])
     on conflict (id) do update set
       title = excluded.title,
       content = excluded.content,
       average_rating = excluded.average_rating,
       review_count = excluded.review_count,
       photo_count = excluded.photo_count,
       like_count = excluded.like_count,
       kg_score = excluded.kg_score,
       status = excluded.status,
       updated_at = excluded.updated_at,
       photos = excluded.photos`,
    [
      post.id,
      post.userId,
      post.restaurantId,
      categoryId,
      post.title,
      post.content,
      post.averageRating,
      post.reviewCount,
      post.photoCount,
      post.likeCount,
      post.kgScore,
      post.status,
      post.createdAt,
      post.photos
    ]
  );
}

function recalculatePostRating(post: Post) {
  const postReviews = reviews.filter((review) => review.postId === post.id);
  post.reviewCount = postReviews.length;
  post.averageRating =
    postReviews.length === 0 ? 0 : Number((postReviews.reduce((sum, review) => sum + review.rating, 0) / postReviews.length).toFixed(1));
}

async function ensureSeedUserAccount(seedUser: SeedUser) {
  const pool = getPool();
  const providerUserId = `gachon_${seedUser.code}`;
  const now = nowIso();

  if (!pool) {
    const existing = authAccounts.find((account) => account.provider === "gachon" && account.providerUserId === providerUserId);
    if (existing) {
      const user = users.find((candidate) => candidate.id === existing.userId);
      if (user) {
        return user;
      }
    }

    const userId = `user_${randomUUID().slice(0, 8)}`;
    const memoryUser: User = {
      id: userId,
      nickname: seedUser.nickname,
      profileImage: null,
      trustScore: 50,
      kgScore: 0,
      titleId: resolveTitle(0).id,
      role: "user",
      preferredCategories: seedUser.preferredCategories,
      createdAt: now
    };
    upsertUserCache(memoryUser);

    authAccounts.push({
      id: `auth_${randomUUID().slice(0, 8)}`,
      userId,
      provider: "gachon",
      providerUserId,
      email: seedUser.email,
      accessTokenEnc: createToken("access", userId),
      refreshTokenEnc: createToken("refresh", userId),
      createdAt: now
    });

    return memoryUser;
  }

  const existing = await pool.query<{
    user_id: string;
    nickname: string;
    profile_image: string | null;
    trust_score: number;
    kg_score: number;
    role: "user" | "admin";
    created_at: string;
  }>(
    `select a.user_id,
            u.nickname,
            u.profile_image,
            u.trust_score,
            u.kg_score,
            u.role,
            u.created_at
     from auth_accounts a
     inner join users u on u.id = a.user_id
     where a.provider = 'gachon' and a.provider_user_id = $1
     limit 1`,
    [providerUserId]
  );

  if (existing.rows[0]) {
    const row = existing.rows[0];
    const memoryUser: User = {
      id: row.user_id,
      nickname: row.nickname,
      profileImage: row.profile_image,
      trustScore: row.trust_score,
      kgScore: row.kg_score,
      titleId: resolveTitle(row.kg_score).id,
      role: row.role,
      preferredCategories: seedUser.preferredCategories,
      createdAt: row.created_at
    };
    upsertUserCache(memoryUser);
    return memoryUser;
  }

  const userId = `user_${randomUUID().slice(0, 8)}`;
  const titleId = await getDbTitleId(0);
  const preferredCategoryIds = await resolvePreferredCategoryIds(seedUser.preferredCategories);
  await pool.query(
    `insert into users (id, nickname, profile_image, trust_score, kg_score, role, title_id, preferred_categories)
     values ($1, $2, null, 50, 0, 'user', $3, $4::integer[])`,
    [userId, seedUser.nickname, titleId, preferredCategoryIds]
  );

  authAccounts.push({
    id: `auth_${randomUUID().slice(0, 8)}`,
    userId,
    provider: "gachon",
    providerUserId,
    email: seedUser.email,
    accessTokenEnc: createToken("access", userId),
    refreshTokenEnc: createToken("refresh", userId),
    createdAt: now
  });

  const latestAuth = authAccounts[authAccounts.length - 1];
  await pool.query(
    `insert into auth_accounts (id, user_id, provider, provider_user_id, email, access_token_enc, refresh_token_enc)
     values ($1, $2, 'gachon', $3, $4, $5, $6)`,
    [latestAuth.id, userId, providerUserId, seedUser.email, latestAuth.accessTokenEnc, latestAuth.refreshTokenEnc]
  );

  const memoryUser: User = {
    id: userId,
    nickname: seedUser.nickname,
    profileImage: null,
    trustScore: 50,
    kgScore: 0,
    titleId: resolveTitle(0).id,
    role: "user",
    preferredCategories: seedUser.preferredCategories,
    createdAt: now
  };
  upsertUserCache(memoryUser);
  return memoryUser;
}

export function registerSeedRoutes(app: Express) {
  register(app, "get", "/seed", (_req: Request, res: Response) => {
    res.json(buildSeedResponse());
  });

  register(app, "post", "/admin/seed/test-accounts", async (req: Request, res: Response) => {
    const requester = requireAuth(req, res);
    if (!requester) {
      return;
    }
    if (requester.role !== "admin") {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    const createdUsers: User[] = [];
    for (const candidate of seedUsers) {
      const user = await ensureSeedUserAccount(candidate);
      createdUsers.push(user);
    }

    const postsByUser = new Map<string, string[]>();
    for (const user of createdUsers) {
      const existingUserPosts = posts.filter((post) => post.userId === user.id && post.status !== "deleted");
      const need = Math.max(0, 5 - existingUserPosts.length);

      for (let index = 0; index < need; index += 1) {
        const categoryId = postCategoryCycle[index % postCategoryCycle.length];
        const fallbackCategoryId = categories[0]?.id ?? "western";
        const resolvedCategoryId = categories.some((category) => category.id === categoryId) ? categoryId : fallbackCategoryId;
        const generatedPostId = `post_seed_${randomUUID().slice(0, 8)}`;
        const createdAt = nowIso();
        const seedPost: Post = {
          id: generatedPostId,
          userId: user.id,
          restaurantId: "rest_001",
          categoryId: resolvedCategoryId,
          title: `[시드] ${user.nickname} ${index + 1}번 글`,
          content: `카테고리 ${resolvedCategoryId} 테스트 글`,
          averageRating: 0,
          reviewCount: 0,
          photoCount: 1,
          likeCount: 0,
          kgScore: 0,
          status: "published",
          createdAt,
          updatedAt: createdAt,
          photos: [`https://picsum.photos/seed/${generatedPostId}/640/480`]
        };
        posts.unshift(seedPost);
        await upsertSeedPostToDb(seedPost);
      }

      const finalUserPosts = posts
        .filter((post) => post.userId === user.id && post.status !== "deleted")
        .sort((left, right) => left.createdAt.localeCompare(right.createdAt))
        .slice(0, 5)
        .map((post) => post.id);
      postsByUser.set(user.id, finalUserPosts);
    }

    const gainByUser = new Map<string, number>();
    let likesSeeded = 0;
    let reviewsSeeded = 0;
    for (const liker of createdUsers) {
      for (const owner of createdUsers) {
        if (liker.id === owner.id) {
          continue;
        }

        const ownerPostIds = postsByUser.get(owner.id) ?? [];
        for (const postId of ownerPostIds.slice(0, 2)) {
          const alreadyLiked = postLikes.some((action) => action.userId === liker.id && action.postId === postId);
          if (alreadyLiked) {
            continue;
          }

          const targetPost = posts.find((candidate) => candidate.id === postId && candidate.status !== "deleted");
          if (!targetPost) {
            continue;
          }

          postLikes.push({ userId: liker.id, postId, createdAt: nowIso() });
          targetPost.likeCount += 1;
          gainByUser.set(owner.id, (gainByUser.get(owner.id) ?? 0) + 1);
          likesSeeded += 1;

          const pool = getPool();
          if (pool) {
            await pool.query(
              `insert into post_likes (user_id, post_id, created_at)
               values ($1, $2, now())
               on conflict (user_id, post_id) do nothing`,
              [liker.id, postId]
            );
            await pool.query(`update posts set like_count = $1, updated_at = now() where id = $2`, [targetPost.likeCount, targetPost.id]);
          }
        }

        for (const postId of ownerPostIds.slice(2, 4)) {
          const alreadyReviewed = reviews.some((review) => review.userId === liker.id && review.postId === postId);
          if (alreadyReviewed) {
            continue;
          }

          const targetPost = posts.find((candidate) => candidate.id === postId && candidate.status !== "deleted");
          if (!targetPost) {
            continue;
          }

          const createdAt = nowIso();
          const review: Review = {
            id: `review_seed_${randomUUID().slice(0, 8)}`,
            postId,
            userId: liker.id,
            rating: 4 + ((liker.id.length + owner.id.length + postId.length) % 2),
            content: `${liker.nickname}가 남긴 ${owner.nickname} 글 테스트 리뷰입니다.`,
            photos: [],
            createdAt,
            updatedAt: createdAt
          };
          reviews.unshift(review);
          recalculatePostRating(targetPost);
          gainByUser.set(owner.id, (gainByUser.get(owner.id) ?? 0) + 3);
          reviewsSeeded += 1;

          const pool = getPool();
          if (pool) {
            await pool.query(
              `insert into reviews (id, post_id, user_id, rating, content, photos, created_at, updated_at)
               values ($1, $2, $3, $4, $5, $6::text[], $7, $7)
               on conflict (post_id, user_id) do nothing`,
              [review.id, review.postId, review.userId, review.rating, review.content, review.photos, review.createdAt]
            );
            await pool.query(
              `update posts
               set average_rating = $1,
                   review_count = $2,
                   updated_at = now()
               where id = $3`,
              [targetPost.averageRating, targetPost.reviewCount, targetPost.id]
            );
          }
        }
      }
    }

    const pool = getPool();
    for (const user of createdUsers) {
      const delta = gainByUser.get(user.id) ?? 0;
      if (delta <= 0) {
        continue;
      }

      user.kgScore = Math.max(0, user.kgScore + delta);
      user.titleId = resolveTitle(user.kgScore).id;
      upsertUserCache(user);

      if (pool) {
        const titleId = await getDbTitleId(user.kgScore);
        await pool.query(
          `update users
           set kg_score = $1,
               title_id = $2
           where id = $3`,
          [user.kgScore, titleId, user.id]
        );
      }
    }

    res.status(201).json({
      ok: true,
      users_count: createdUsers.length,
      posts_per_user: 5,
      likes_seeded: likesSeeded,
      reviews_seeded: reviewsSeeded,
      kg_score_seeded: [...gainByUser.values()].reduce((sum, value) => sum + value, 0),
      note: "현재 카테고리 4종이라 5개 글 중 1개 카테고리는 순환 중복됩니다."
    });
  });
}
