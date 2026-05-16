import type { Express, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { requireAuth } from "../auth.js";
import { categories, posts, restaurants, reviews, users, type Post, type Review } from "../data.js";
import { getPool } from "../db.js";
import { register } from "../http.js";
import type { PostBody, ReviewBody } from "../request-types.js";
import { serializePost, serializeReview } from "../serializers.js";
import { buildPostDetail, getCategoryById, getRestaurantById, recalculateUserTrust, updateUserScore } from "../services/posts.js";
import { postLikes, postScraps } from "../state.js";
import { normalizeText, nowIso, parseLimit, parsePage } from "../utils.js";

export function registerPostsRoutes(app: Express) {
  const categoryNameBySlug: Record<string, string> = {
    western: "양식",
    chinese: "중식",
    japanese: "일식",
    pub: "술집"
  };

  const resolveTargetUserId = (req: Request, res: Response) => {
    const requester = requireAuth(req, res);
    if (!requester) {
      return null;
    }

    const requestedUserId = normalizeText(req.query.user_id);
    const targetUserId = requestedUserId || requester.id;
    if (targetUserId !== requester.id && requester.role !== "admin") {
      res.status(403).json({ error: "forbidden" });
      return null;
    }

    return targetUserId;
  };

  const recalculatePostRating = (post: Post) => {
    const postReviews = reviews.filter((review) => review.postId === post.id);
    post.reviewCount = postReviews.length;
    post.averageRating =
      postReviews.length === 0 ? 0 : Number((postReviews.reduce((sum, review) => sum + review.rating, 0) / postReviews.length).toFixed(1));
  };

  const getDbTitleId = async (kgScore: number) => {
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
  };

  const getDbCategoryId = async (categoryId: string) => {
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
      [categoryNameBySlug[categoryId] ?? categoryId]
    );

    return result.rows[0]?.id ?? null;
  };

  const ensureDbRestaurant = async (restaurantId: string) => {
    const pool = getPool();
    if (!pool) {
      return;
    }

    const restaurant = getRestaurantById(restaurantId);
    if (!restaurant) {
      return;
    }

    const dbCategoryId = await getDbCategoryId(restaurant.categoryId);
    if (!dbCategoryId) {
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
      [restaurant.id, restaurant.name, dbCategoryId, restaurant.address, restaurant.phone, restaurant.priceRange, restaurant.businessHours]
    );
  };

  const ensureDbUser = async (userId: string) => {
    const pool = getPool();
    if (!pool) {
      return true;
    }

    const user = users.find((candidate) => candidate.id === userId);
    if (!user) {
      return false;
    }

    const titleId = await getDbTitleId(user.kgScore);
    const preferredCategoryIds = (
      await Promise.all(user.preferredCategories.map((categoryId) => getDbCategoryId(categoryId)))
    ).filter((value): value is number => typeof value === "number");

    await pool.query(
      `insert into users (id, nickname, profile_image, trust_score, kg_score, role, title_id, preferred_categories, created_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8::integer[], $9)
       on conflict (id) do update set
         nickname = excluded.nickname,
         profile_image = excluded.profile_image,
         trust_score = excluded.trust_score,
         kg_score = excluded.kg_score,
         role = excluded.role,
         title_id = excluded.title_id,
         preferred_categories = excluded.preferred_categories`,
      [user.id, user.nickname, user.profileImage, user.trustScore, user.kgScore, user.role, titleId, preferredCategoryIds, user.createdAt]
    );

    return true;
  };

  const insertDbPost = async (post: Post) => {
    const pool = getPool();
    if (!pool) {
      return true;
    }

    const userInserted = await ensureDbUser(post.userId);
    if (!userInserted) {
      return false;
    }

    await ensureDbRestaurant(post.restaurantId);
    const dbCategoryId = await getDbCategoryId(post.categoryId);
    if (!dbCategoryId) {
      return false;
    }

    await pool.query(
      `insert into posts (
         id, user_id, restaurant_id, category_id, title, content, average_rating, review_count,
         photo_count, like_count, kg_score, status, created_at, updated_at, photos
       )
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15::text[])
       on conflict (id) do nothing`,
      [
        post.id,
        post.userId,
        post.restaurantId,
        dbCategoryId,
        post.title,
        post.content,
        post.averageRating,
        post.reviewCount,
        post.photoCount,
        post.likeCount,
        post.kgScore,
        post.status,
        post.createdAt,
        post.updatedAt,
        post.photos
      ]
    );

    return true;
  };

  register(app, "get", "/categories", (_req: Request, res: Response) => {
    res.json({
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        parent_id: category.parentId,
        sort_order: category.sortOrder,
        is_active: category.isActive,
        post_count: posts.filter((post) => post.categoryId === category.id && post.status !== "deleted").length
      }))
    });
  });

  register(app, "get", "/posts", (req: Request, res: Response) => {
    const q = normalizeText(req.query.q);
    const categoryId = normalizeText(req.query.category);
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 10);
    const sort = normalizeText(req.query.sort);

    let filtered = posts.filter((post) => post.status !== "deleted");

    if (q) {
      const lower = q.toLowerCase();
      filtered = filtered.filter((post) => {
        const restaurant = restaurants.find((candidate) => candidate.id === post.restaurantId);
        return [post.title, post.content, restaurant?.name ?? ""].some((value) => value.toLowerCase().includes(lower));
      });
    }

    if (categoryId) {
      filtered = filtered.filter((post) => post.categoryId === categoryId);
    }

    if (sort === "popular") {
      filtered = [...filtered].sort((left, right) => right.likeCount - left.likeCount || right.reviewCount - left.reviewCount);
    } else if (sort === "rating") {
      filtered = [...filtered].sort((left, right) => right.averageRating - left.averageRating || right.reviewCount - left.reviewCount);
    } else {
      filtered = [...filtered].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    }

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const pageItems = filtered.slice(offset, offset + limit).map(serializePost);

    res.json({
      posts: pageItems,
      paging: {
        page,
        limit,
        total,
        hasMore: offset + limit < total
      }
    });
  });

  register(app, "post", "/posts", async (req: Request, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    const body = req.body as PostBody;
    const restaurantId = normalizeText(body.restaurant_id);
    const categoryId = normalizeText(body.category_id);
    const title = normalizeText(body.title);
    const content = normalizeText(body.content);
    const photos = Array.isArray(body.photos) ? body.photos.filter((photo) => typeof photo === "string") : [];

    const restaurant = getRestaurantById(restaurantId);
    const category = getCategoryById(categoryId);

    if (!restaurant || !category || !title || !content) {
      res.status(400).json({ error: "invalid_post_payload" });
      return;
    }

    const id = `post_${randomUUID().slice(0, 8)}`;
    const createdAt = nowIso();
    const post: Post = {
      id,
      userId: user.id,
      restaurantId,
      categoryId,
      title,
      content,
      averageRating: 0,
      reviewCount: 0,
      photoCount: photos.length,
      likeCount: 0,
      kgScore: 0,
      status: "published",
      createdAt,
      updatedAt: createdAt,
      photos
    };

    const dbInserted = await insertDbPost(post);
    if (!dbInserted) {
      res.status(400).json({ error: "invalid_post_category" });
      return;
    }

    posts.unshift(post);
    res.status(201).json({ postId: id });
  });

  register(app, "get", "/posts/:postId", (req: Request<{ postId: string }>, res: Response) => {
    const detail = buildPostDetail(req.params.postId);
    if (!detail) {
      res.status(404).json({ error: "post_not_found" });
      return;
    }

    res.json(detail);
  });

  register(app, "get", "/posts/:postId/reviews", (req: Request<{ postId: string }>, res: Response) => {
    const post = posts.find((candidate) => candidate.id === req.params.postId && candidate.status !== "deleted");
    if (!post) {
      res.status(404).json({ error: "post_not_found" });
      return;
    }

    const postReviews = reviews
      .filter((review) => review.postId === post.id)
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt))
      .map(serializeReview);

    res.json({ reviews: postReviews });
  });

  register(app, "post", "/posts/:postId/reviews", async (req: Request<{ postId: string }>, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    const post = posts.find((candidate) => candidate.id === req.params.postId && candidate.status !== "deleted");
    if (!post) {
      res.status(404).json({ error: "post_not_found" });
      return;
    }
    if (post.userId === user.id) {
      res.status(400).json({ error: "cannot_review_own_post" });
      return;
    }

    const body = req.body as ReviewBody;
    const rating = Number(body.rating);
    const content = normalizeText(body.content);
    const photos = Array.isArray(body.photos) ? body.photos.filter((photo) => typeof photo === "string") : [];
    if (!Number.isInteger(rating) || rating < 1 || rating > 5 || !content) {
      res.status(400).json({ error: "invalid_review_payload" });
      return;
    }

    const alreadyReviewed = reviews.some((review) => review.userId === user.id && review.postId === post.id);
    if (alreadyReviewed) {
      res.status(409).json({ error: "review_exists" });
      return;
    }

    const createdAt = nowIso();
    const review: Review = {
      id: `review_${randomUUID().slice(0, 8)}`,
      postId: post.id,
      userId: user.id,
      rating,
      content,
      photos,
      createdAt,
      updatedAt: createdAt
    };
    reviews.unshift(review);
    recalculatePostRating(post);
    updateUserScore(post.userId, 3, 0);
    recalculateUserTrust(post.userId);

    const postAuthor = users.find((candidate) => candidate.id === post.userId);
    const pool = getPool();
    if (pool) {
      const dbInserted = await insertDbPost(post);
      if (!dbInserted) {
        res.status(400).json({ error: "invalid_post_for_db" });
        return;
      }

      const titleId = await getDbTitleId(postAuthor?.kgScore ?? 0);
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
        [post.averageRating, post.reviewCount, post.id]
      );
      if (postAuthor) {
        await pool.query(`update users set kg_score = $1, title_id = $2 where id = $3`, [postAuthor.kgScore, titleId, postAuthor.id]);
      }
    }

    res.status(201).json({ reviewId: review.id, review: serializeReview(review) });
  });

  register(app, "patch", "/posts/:postId", (req: Request<{ postId: string }>, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    const post = posts.find((candidate) => candidate.id === req.params.postId && candidate.status !== "deleted");
    if (!post) {
      res.status(404).json({ error: "post_not_found" });
      return;
    }

    if (post.userId !== user.id) {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    const body = req.body as PostBody;
    if (typeof body.title === "string" && body.title.trim()) {
      post.title = body.title.trim();
    }
    if (typeof body.content === "string" && body.content.trim()) {
      post.content = body.content.trim();
    }
    if (Array.isArray(body.photos)) {
      const previousPhotoCount = post.photos.length;
      post.photos = body.photos.filter((photo) => typeof photo === "string");
      post.photoCount = post.photos.length;
      post.kgScore += (post.photoCount - previousPhotoCount) * 3;
      updateUserScore(user.id, (post.photoCount - previousPhotoCount) * 3);
    }

    post.updatedAt = nowIso();
    res.json({ post: serializePost(post) });
  });

  register(app, "delete", "/posts/:postId", (req: Request<{ postId: string }>, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    const post = posts.find((candidate) => candidate.id === req.params.postId && candidate.status !== "deleted");
    if (!post) {
      res.status(404).json({ error: "post_not_found" });
      return;
    }

    if (post.userId !== user.id) {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    post.status = "deleted";
    post.updatedAt = nowIso();
    updateUserScore(user.id, -(10 + post.photoCount * 3));
    recalculateUserTrust(user.id);
    res.json({ ok: true });
  });

  register(app, "post", "/posts/:postId/like", async (req: Request<{ postId: string }>, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    const post = posts.find((candidate) => candidate.id === req.params.postId && candidate.status !== "deleted");
    if (!post) {
      res.status(404).json({ error: "post_not_found" });
      return;
    }

    if (post.userId === user.id) {
      res.status(400).json({ error: "cannot_like_own_post" });
      return;
    }

    const alreadyLiked = postLikes.some((action) => action.userId === user.id && action.postId === post.id);
    if (alreadyLiked) {
      res.json({ ok: true, likeCount: post.likeCount, already_liked: true });
      return;
    }

    post.likeCount += 1;
    const createdAt = nowIso();
    postLikes.push({ userId: user.id, postId: post.id, createdAt });
    const postAuthor = users.find((candidate) => candidate.id === post.userId);
    if (postAuthor) {
      updateUserScore(post.userId, 1, 0);
      recalculateUserTrust(post.userId);
    }

    const pool = getPool();
    if (pool) {
      const dbInserted = await insertDbPost(post);
      if (!dbInserted) {
        res.status(400).json({ error: "invalid_post_for_db" });
        return;
      }

      await pool.query(
        `insert into post_likes (user_id, post_id, created_at)
         values ($1, $2, $3)
         on conflict (user_id, post_id) do nothing`,
        [user.id, post.id, createdAt]
      );
      await pool.query(`update posts set like_count = $1, updated_at = now() where id = $2`, [post.likeCount, post.id]);
      if (postAuthor) {
        const titleId = await getDbTitleId(postAuthor.kgScore);
        await pool.query(`update users set kg_score = $1, title_id = $2 where id = $3`, [postAuthor.kgScore, titleId, postAuthor.id]);
      }
    }

    res.json({ ok: true, likeCount: post.likeCount });
  });

  register(app, "post", "/posts/:postId/scrap", async (req: Request<{ postId: string }>, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    const post = posts.find((candidate) => candidate.id === req.params.postId && candidate.status !== "deleted");
    if (!post) {
      res.status(404).json({ error: "post_not_found" });
      return;
    }

    if (post.userId === user.id) {
      res.status(400).json({ error: "cannot_scrap_own_post" });
      return;
    }

    const alreadyScrapped = postScraps.some((action) => action.userId === user.id && action.postId === post.id);
    if (alreadyScrapped) {
      res.json({ ok: true, already_scrapped: true });
      return;
    }

    const createdAt = nowIso();
    postScraps.push({ userId: user.id, postId: post.id, createdAt });

    const postAuthor = users.find((candidate) => candidate.id === post.userId);
    if (postAuthor) {
      updateUserScore(post.userId, 2, 0);
      recalculateUserTrust(post.userId);
    }

    const pool = getPool();
    if (pool) {
      const dbInserted = await insertDbPost(post);
      if (!dbInserted) {
        res.status(400).json({ error: "invalid_post_for_db" });
        return;
      }

      await pool.query(
        `insert into post_scraps (user_id, post_id, created_at)
         values ($1, $2, $3)
         on conflict (user_id, post_id) do nothing`,
        [user.id, post.id, createdAt]
      );
    }

    res.json({ ok: true });
  });

  register(app, "delete", "/posts/:postId/scrap", async (req: Request<{ postId: string }>, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    const post = posts.find((candidate) => candidate.id === req.params.postId && candidate.status !== "deleted");
    if (!post) {
      res.status(404).json({ error: "post_not_found" });
      return;
    }

    const previousLength = postScraps.length;
    for (let index = postScraps.length - 1; index >= 0; index -= 1) {
      const scrap = postScraps[index];
      if (scrap.userId === user.id && scrap.postId === post.id) {
        postScraps.splice(index, 1);
      }
    }

    const pool = getPool();
    if (pool) {
      await pool.query(
        `delete from post_scraps
         where user_id = $1 and post_id = $2`,
        [user.id, post.id]
      );
    }

    res.json({ ok: true, removed: previousLength !== postScraps.length });
  });

  register(app, "get", "/users/posts", (req: Request, res: Response) => {
    const targetUserId = resolveTargetUserId(req, res);
    if (!targetUserId) {
      return;
    }

    const userPosts = posts
      .filter((post) => post.userId === targetUserId && post.status !== "deleted")
      .map((post) => ({
        post_id: post.id,
        restaurant_id: post.restaurantId,
        category_id: post.categoryId,
        restaurant_name: restaurants.find((restaurant) => restaurant.id === post.restaurantId)?.name ?? post.restaurantId,
        title: post.title,
        content: post.content,
        photos: post.photos
      }));

    res.json({ posts: userPosts });
  });

  register(app, "get", "/users/clip", (req: Request, res: Response) => {
    const targetUserId = resolveTargetUserId(req, res);
    if (!targetUserId) {
      return;
    }

    const clippedPostIds = postScraps.filter((action) => action.userId === targetUserId).map((action) => action.postId);
    const uniquePostIds = [...new Set(clippedPostIds)];
    const clips = uniquePostIds
      .map((postId) => posts.find((post) => post.id === postId && post.status !== "deleted"))
      .filter((post): post is Post => Boolean(post))
      .map((post) => ({
        post_id: post.id,
        restaurant_id: post.restaurantId,
        category_id: post.categoryId,
        restaurant_name: restaurants.find((restaurant) => restaurant.id === post.restaurantId)?.name ?? post.restaurantId,
        title: post.title,
        content: post.content,
        photos: post.photos
      }));

    res.json({ clips });
  });
}
