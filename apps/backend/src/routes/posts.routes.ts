import type { Express, Request, Response } from "express";
import { randomUUID } from "node:crypto";
import { requireAuth } from "../auth.js";
import { categories, posts, restaurants, resolveTitle, reviews, users, type Post, type Review } from "../data.js";
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
  const categorySlugByName = Object.fromEntries(Object.entries(categoryNameBySlug).map(([slug, name]) => [name, slug]));

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

  const removePostActionsFromMemory = (postId: string) => {
    let removedLikes = 0;
    let removedScraps = 0;

    for (let index = postLikes.length - 1; index >= 0; index -= 1) {
      if (postLikes[index].postId === postId) {
        postLikes.splice(index, 1);
        removedLikes += 1;
      }
    }

    for (let index = postScraps.length - 1; index >= 0; index -= 1) {
      if (postScraps[index].postId === postId) {
        postScraps.splice(index, 1);
        removedScraps += 1;
      }
    }

    return { removedLikes, removedScraps };
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

  register(app, "get", "/posts", async (req: Request, res: Response) => {
    const q = normalizeText(req.query.q);
    const categoryId = normalizeText(req.query.category);
    const page = parsePage(req.query.page, 1);
    const limit = parseLimit(req.query.limit, 10);
    const sort = normalizeText(req.query.sort);

    const memoryPosts = posts.filter((post) => post.status !== "deleted").map(serializePost);
    let dbPosts: typeof memoryPosts = [];
    const pool = getPool();

    if (pool) {
      const result = await pool.query<{
        id: string;
        user_id: string;
        restaurant_id: string;
        category_name: string | null;
        title: string;
        content: string;
        average_rating: string;
        review_count: number;
        photo_count: number;
        like_count: number;
        status: "published" | "draft" | "deleted";
        created_at: string | Date;
        updated_at: string | Date;
        restaurant_name: string | null;
        photos: string[];
      }>(
        `select p.id,
                p.user_id,
                p.restaurant_id,
                c.name as category_name,
                p.title,
                p.content,
                p.average_rating,
                p.review_count,
                p.photo_count,
                p.like_count,
                p.status,
                p.created_at,
                p.updated_at,
                r.name as restaurant_name,
                p.photos
         from posts p
         left join categories c on c.id = p.category_id
         left join restaurants r on r.id = p.restaurant_id
         where p.status <> 'deleted'`
      );

      dbPosts = result.rows.map((post) => ({
        id: post.id,
        user_id: post.user_id,
        restaurant_id: post.restaurant_id,
        category_id: post.category_name ? categorySlugByName[post.category_name] ?? post.category_name : "",
        title: post.title,
        content: post.content,
        average_rating: Number(post.average_rating),
        review_count: post.review_count,
        photo_count: post.photo_count,
        like_count: post.like_count,
        status: post.status,
        created_at: new Date(post.created_at).toISOString(),
        updated_at: new Date(post.updated_at).toISOString(),
        restaurant_name: post.restaurant_name ?? post.restaurant_id,
        photos: post.photos ?? []
      }));
    }

    let filtered = [...memoryPosts, ...dbPosts].filter(
      (post, index, source) => source.findIndex((candidate) => candidate.id === post.id) === index
    );

    if (q) {
      const lower = q.toLowerCase();
      filtered = filtered.filter((post) => {
        return [post.title, post.content, post.restaurant_name ?? ""].some((value) => value.toLowerCase().includes(lower));
      });
    }

    if (categoryId) {
      filtered = filtered.filter((post) => post.category_id === categoryId);
    }

    if (sort === "popular") {
      filtered = [...filtered].sort((left, right) => right.like_count - left.like_count || right.review_count - left.review_count);
    } else if (sort === "rating") {
      filtered = [...filtered].sort((left, right) => right.average_rating - left.average_rating || right.review_count - left.review_count);
    } else {
      filtered = [...filtered].sort((left, right) => right.created_at.localeCompare(left.created_at));
    }

    const total = filtered.length;
    const offset = (page - 1) * limit;
    const pageItems = filtered.slice(offset, offset + limit);

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

  register(app, "get", "/posts/:postId", async (req: Request<{ postId: string }>, res: Response) => {
    const detail = buildPostDetail(req.params.postId);
    if (detail) {
      res.json(detail);
      return;
    }

    const pool = getPool();
    if (!pool) {
      res.status(404).json({ error: "post_not_found" });
      return;
    }

    const result = await pool.query<{
      id: string;
      user_id: string;
      restaurant_id: string;
      category_name: string | null;
      title: string;
      content: string;
      average_rating: string;
      review_count: number;
      photo_count: number;
      like_count: number;
      status: "published" | "draft" | "deleted";
      created_at: string;
      updated_at: string;
      restaurant_name: string | null;
      photos: string[];
      nickname: string | null;
      profile_image: string | null;
      trust_score: number | null;
      kg_score: number | null;
      role: "user" | "admin" | null;
      preferred_categories: number[] | null;
    }>(
      `select p.id,
              p.user_id,
              p.restaurant_id,
              c.name as category_name,
              p.title,
              p.content,
              p.average_rating,
              p.review_count,
              p.photo_count,
              p.like_count,
              p.status,
              p.created_at,
              p.updated_at,
              r.name as restaurant_name,
              p.photos,
              u.nickname,
              u.profile_image,
              u.trust_score,
              u.kg_score,
              u.role,
              u.preferred_categories
       from posts p
       left join categories c on c.id = p.category_id
       left join restaurants r on r.id = p.restaurant_id
       left join users u on u.id = p.user_id
       where p.id = $1 and p.status <> 'deleted'
       limit 1`,
      [req.params.postId]
    );

    const row = result.rows[0];
    if (!row) {
      res.status(404).json({ error: "post_not_found" });
      return;
    }

    const avgRating = Number(row.average_rating);
    res.json({
      post: {
        id: row.id,
        user_id: row.user_id,
        restaurant_id: row.restaurant_id,
        category_id: row.category_name ?? "",
        title: row.title,
        content: row.content,
        average_rating: avgRating,
        review_count: row.review_count,
        photo_count: row.photo_count,
        like_count: row.like_count,
        status: row.status,
        created_at: row.created_at,
        updated_at: row.updated_at,
        restaurant_name: row.restaurant_name ?? row.restaurant_id,
        photos: row.photos ?? []
      },
      author: row.nickname
        ? {
            id: row.user_id,
            nickname: row.nickname,
            profile_image: row.profile_image,
            trust_score: row.kg_score ?? 0,
            kg_score: row.kg_score ?? 0,
            role: row.role ?? "user",
            title: resolveTitle(row.kg_score ?? 0).name,
            title_id: resolveTitle(row.kg_score ?? 0).id,
            preferred_categories: []
          }
        : null,
      avg_rating: avgRating,
      like_count: row.like_count,
      photos: row.photos ?? []
    });
  });

  register(app, "get", "/posts/:postId/reviews", async (req: Request<{ postId: string }>, res: Response) => {
    const post = posts.find((candidate) => candidate.id === req.params.postId && candidate.status !== "deleted");
    if (!post) {
      const pool = getPool();
      if (!pool) {
        res.status(404).json({ error: "post_not_found" });
        return;
      }

      const postResult = await pool.query<{ id: string }>(
        `select id from posts where id = $1 and status <> 'deleted' limit 1`,
        [req.params.postId]
      );
      if (!postResult.rows[0]) {
        res.status(404).json({ error: "post_not_found" });
        return;
      }

      const reviewResult = await pool.query<{
        id: string;
        post_id: string;
        user_id: string;
        rating: string;
        content: string;
        photos: string[];
        created_at: string;
        updated_at: string;
      }>(
        `select id, post_id, user_id, rating, content, photos, created_at, updated_at
         from reviews
         where post_id = $1
         order by created_at desc`,
        [req.params.postId]
      );
      res.json({
        reviews: reviewResult.rows.map((review) => ({
          id: review.id,
          post_id: review.post_id,
          user_id: review.user_id,
          rating: Number(review.rating),
          content: review.content,
          photos: review.photos ?? [],
          created_at: review.created_at,
          updated_at: review.updated_at
        }))
      });
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
    if (!Number.isFinite(rating) || rating < 0.5 || rating > 5 || rating * 2 !== Math.round(rating * 2) || !content) {
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

  register(app, "patch", "/posts/:postId", async (req: Request<{ postId: string }>, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    const post = posts.find((candidate) => candidate.id === req.params.postId && candidate.status !== "deleted");
    if (!post) {
      const pool = getPool();
      if (!pool) {
        res.status(404).json({ error: "post_not_found" });
        return;
      }

      const existing = await pool.query<{ user_id: string }>(
        `select user_id from posts where id = $1 and status <> 'deleted' limit 1`,
        [req.params.postId]
      );
      if (!existing.rows[0]) {
        res.status(404).json({ error: "post_not_found" });
        return;
      }
      if (existing.rows[0].user_id !== user.id) {
        res.status(403).json({ error: "forbidden" });
        return;
      }

      const body = req.body as PostBody;
      const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : null;
      const content = typeof body.content === "string" && body.content.trim() ? body.content.trim() : null;
      const photos = Array.isArray(body.photos) ? body.photos.filter((photo) => typeof photo === "string") : null;

      const result = await pool.query(
        `update posts
         set title = coalesce($1, title),
             content = coalesce($2, content),
             photos = coalesce($3::text[], photos),
             photo_count = case when $3::text[] is null then photo_count else cardinality($3::text[]) end,
             updated_at = now()
         where id = $4
         returning id`,
        [title, content, photos, req.params.postId]
      );
      res.json({ ok: true, postId: result.rows[0]?.id ?? req.params.postId });
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
    const pool = getPool();
    if (pool) {
      await pool.query(
        `update posts
         set title = $1,
             content = $2,
             photos = $3::text[],
             photo_count = $4,
             updated_at = now()
         where id = $5`,
        [post.title, post.content, post.photos, post.photoCount, post.id]
      );
    }
    res.json({ post: serializePost(post) });
  });

  register(app, "delete", "/posts/:postId", async (req: Request<{ postId: string }>, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    const post = posts.find((candidate) => candidate.id === req.params.postId && candidate.status !== "deleted");
    if (!post) {
      const pool = getPool();
      if (!pool) {
        res.status(404).json({ error: "post_not_found" });
        return;
      }

      const existing = await pool.query<{ user_id: string }>(
        `select user_id from posts where id = $1 and status <> 'deleted' limit 1`,
        [req.params.postId]
      );
      if (!existing.rows[0]) {
        res.status(404).json({ error: "post_not_found" });
        return;
      }
      if (existing.rows[0].user_id !== user.id) {
        res.status(403).json({ error: "forbidden" });
        return;
      }

      const likeCountResult = await pool.query<{ count: string }>(
        `select count(*)::text as count from post_likes where post_id = $1`,
        [req.params.postId]
      );
      const removedLikes = Number(likeCountResult.rows[0]?.count ?? 0);

      await pool.query("begin");
      try {
        await pool.query(`delete from post_likes where post_id = $1`, [req.params.postId]);
        await pool.query(`delete from post_scraps where post_id = $1`, [req.params.postId]);
        const authorResult = await pool.query<{ kg_score: number }>(
          `update users
           set kg_score = greatest(0, kg_score - $1),
               trust_score = greatest(0, kg_score - $1)
           where id = $2
           returning kg_score`,
          [removedLikes * 10, existing.rows[0].user_id]
        );
        const titleId = await getDbTitleId(authorResult.rows[0]?.kg_score ?? 0);
        await pool.query(`update users set title_id = $1 where id = $2`, [titleId, existing.rows[0].user_id]);
        await pool.query(`update posts set status = 'deleted', like_count = 0, updated_at = now() where id = $1`, [req.params.postId]);
        await pool.query("commit");
      } catch (error) {
        await pool.query("rollback");
        throw error;
      }

      res.json({ ok: true, removedLikes });
      return;
    }

    if (post.userId !== user.id) {
      res.status(403).json({ error: "forbidden" });
      return;
    }

    const removedActions = removePostActionsFromMemory(post.id);
    const previousLikeCount = Math.max(post.likeCount, removedActions.removedLikes);

    post.status = "deleted";
    post.updatedAt = nowIso();
    post.likeCount = 0;
    updateUserScore(user.id, -(10 + post.photoCount * 3 + previousLikeCount * 10));
    recalculateUserTrust(user.id);
    const pool = getPool();
    if (pool) {
      await pool.query("begin");
      try {
        await pool.query(`delete from post_likes where post_id = $1`, [post.id]);
        await pool.query(`delete from post_scraps where post_id = $1`, [post.id]);
        const titleId = await getDbTitleId(user.kgScore);
        await pool.query(
          `update users
           set kg_score = $1,
               trust_score = $1,
               title_id = $2
           where id = $3`,
          [user.kgScore, titleId, user.id]
        );
        await pool.query(`update posts set status = 'deleted', like_count = 0, updated_at = now() where id = $1`, [post.id]);
        await pool.query("commit");
      } catch (error) {
        await pool.query("rollback");
        throw error;
      }
    }
    res.json({ ok: true, removedLikes: previousLikeCount, removedScraps: removedActions.removedScraps });
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
      updateUserScore(post.userId, 10, 0);
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
      } else {
        const authorResult = await pool.query<{ kg_score: number }>(
          `update users
           set kg_score = kg_score + 10
           where id = $1
           returning kg_score`,
          [post.userId]
        );
        const titleId = await getDbTitleId(authorResult.rows[0]?.kg_score ?? 0);
        await pool.query(`update users set title_id = $1 where id = $2`, [titleId, post.userId]);
      }
    }

    res.json({ ok: true, likeCount: post.likeCount });
  });

  register(app, "delete", "/posts/:postId/like", async (req: Request<{ postId: string }>, res: Response) => {
    const user = requireAuth(req, res);
    if (!user) {
      return;
    }

    const post = posts.find((candidate) => candidate.id === req.params.postId && candidate.status !== "deleted");
    if (!post) {
      res.status(404).json({ error: "post_not_found" });
      return;
    }

    const previousLength = postLikes.length;
    for (let index = postLikes.length - 1; index >= 0; index -= 1) {
      const like = postLikes[index];
      if (like.userId === user.id && like.postId === post.id) {
        postLikes.splice(index, 1);
      }
    }

    if (previousLength !== postLikes.length) {
      post.likeCount = Math.max(0, post.likeCount - 1);
      updateUserScore(post.userId, -10, 0);
    }

    const pool = getPool();
    if (pool) {
      await pool.query(
        `delete from post_likes
         where user_id = $1 and post_id = $2`,
        [user.id, post.id]
      );
      await pool.query(`update posts set like_count = $1, updated_at = now() where id = $2`, [post.likeCount, post.id]);
      const postAuthor = users.find((candidate) => candidate.id === post.userId);
      if (postAuthor) {
        const titleId = await getDbTitleId(postAuthor.kgScore);
        await pool.query(`update users set kg_score = $1, title_id = $2 where id = $3`, [postAuthor.kgScore, titleId, postAuthor.id]);
      } else {
        const authorResult = await pool.query<{ kg_score: number }>(
          `update users
           set kg_score = greatest(0, kg_score - 10)
           where id = $1
           returning kg_score`,
          [post.userId]
        );
        const titleId = await getDbTitleId(authorResult.rows[0]?.kg_score ?? 0);
        await pool.query(`update users set title_id = $1 where id = $2`, [titleId, post.userId]);
      }
    }

    res.json({ ok: true, likeCount: post.likeCount, removed: previousLength !== postLikes.length });
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
      const pool = getPool();
      if (!pool) {
        res.status(404).json({ error: "post_not_found" });
        return;
      }

      const existing = await pool.query<{ id: string }>(
        `select id from posts where id = $1 and status <> 'deleted' limit 1`,
        [req.params.postId]
      );
      if (!existing.rows[0]) {
        await pool.query(
          `delete from post_scraps
           where user_id = $1 and post_id = $2`,
          [user.id, req.params.postId]
        );
        res.json({ ok: true, removed: true });
        return;
      }

      const result = await pool.query(
        `delete from post_scraps
         where user_id = $1 and post_id = $2`,
        [user.id, req.params.postId]
      );
      res.json({ ok: true, removed: (result.rowCount ?? 0) > 0 });
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

  register(app, "get", "/users/posts", async (req: Request, res: Response) => {
    const targetUserId = resolveTargetUserId(req, res);
    if (!targetUserId) {
      return;
    }

    const memoryPosts = posts
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

    let dbPosts: typeof memoryPosts = [];
    const pool = getPool();
    if (pool) {
      const result = await pool.query<{
        post_id: string;
        restaurant_id: string;
        category_name: string | null;
        restaurant_name: string | null;
        title: string;
        content: string;
        photos: string[];
      }>(
        `select p.id as post_id,
                p.restaurant_id,
                c.name as category_name,
                r.name as restaurant_name,
                p.title,
                p.content,
                p.photos
         from posts p
         left join categories c on c.id = p.category_id
         left join restaurants r on r.id = p.restaurant_id
         where p.user_id = $1 and p.status <> 'deleted'
         order by p.created_at desc`,
        [targetUserId]
      );
      dbPosts = result.rows.map((post) => ({
        post_id: post.post_id,
        restaurant_id: post.restaurant_id,
        category_id: post.category_name ?? "",
        restaurant_name: post.restaurant_name ?? post.restaurant_id,
        title: post.title,
        content: post.content,
        photos: post.photos ?? []
      }));
    }

    const userPosts = [...memoryPosts, ...dbPosts].filter(
      (post, index, source) => source.findIndex((candidate) => candidate.post_id === post.post_id) === index
    );

    res.json({ posts: userPosts });
  });

  register(app, "get", "/users/clip", async (req: Request, res: Response) => {
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

    let dbClips: typeof clips = [];
    const pool = getPool();
    if (pool) {
      const result = await pool.query<{
        post_id: string;
        restaurant_id: string;
        category_name: string | null;
        restaurant_name: string | null;
        title: string;
        content: string;
        photos: string[];
      }>(
        `select p.id as post_id,
                p.restaurant_id,
                c.name as category_name,
                r.name as restaurant_name,
                p.title,
                p.content,
                p.photos
         from post_scraps ps
         join posts p on p.id = ps.post_id
         left join categories c on c.id = p.category_id
         left join restaurants r on r.id = p.restaurant_id
         where ps.user_id = $1 and p.status <> 'deleted'
         order by ps.created_at desc`,
        [targetUserId]
      );

      dbClips = result.rows.map((post) => ({
        post_id: post.post_id,
        restaurant_id: post.restaurant_id,
        category_id: post.category_name ?? "",
        restaurant_name: post.restaurant_name ?? post.restaurant_id,
        title: post.title,
        content: post.content,
        photos: post.photos ?? []
      }));
    }

    const mergedClips = [...clips, ...dbClips].filter(
      (clip, index, source) => source.findIndex((candidate) => candidate.post_id === clip.post_id) === index
    );

    res.json({ clips: mergedClips });
  });

  register(app, "get", "/users/recommended", async (req: Request, res: Response) => {
    const targetUserId = resolveTargetUserId(req, res);
    if (!targetUserId) {
      return;
    }

    let likedPostIds = postLikes.filter((action) => action.userId === targetUserId).map((action) => action.postId);
    const pool = getPool();
    if (pool) {
      const result = await pool.query<{ post_id: string }>(
        `select post_id
         from post_likes
         where user_id = $1
         order by created_at desc`,
        [targetUserId]
      );
      likedPostIds = [...likedPostIds, ...result.rows.map((row) => row.post_id)];
    }

    const uniquePostIds = [...new Set(likedPostIds)];
    const memoryRecommended = uniquePostIds
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

    let dbRecommended: typeof memoryRecommended = [];
    if (pool) {
      const result = await pool.query<{
        post_id: string;
        restaurant_id: string;
        category_name: string | null;
        restaurant_name: string | null;
        title: string;
        content: string;
        photos: string[];
      }>(
        `select p.id as post_id,
                p.restaurant_id,
                c.name as category_name,
                r.name as restaurant_name,
                p.title,
                p.content,
                p.photos
         from post_likes pl
         join posts p on p.id = pl.post_id
         left join categories c on c.id = p.category_id
         left join restaurants r on r.id = p.restaurant_id
         where pl.user_id = $1 and p.status <> 'deleted'
         order by pl.created_at desc`,
        [targetUserId]
      );

      dbRecommended = result.rows.map((post) => ({
        post_id: post.post_id,
        restaurant_id: post.restaurant_id,
        category_id: post.category_name ?? "",
        restaurant_name: post.restaurant_name ?? post.restaurant_id,
        title: post.title,
        content: post.content,
        photos: post.photos ?? []
      }));
    }

    const recommended = [...memoryRecommended, ...dbRecommended].filter(
      (item, index, source) => source.findIndex((candidate) => candidate.post_id === item.post_id) === index
    );

    res.json({ recommended });
  });
}
