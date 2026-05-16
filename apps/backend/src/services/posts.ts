import { categories, posts, restaurants, resolveTitle, users } from "../data.js";
import { serializePost, serializeUser } from "../serializers.js";
import { nowIso } from "../utils.js";

export function updateUserScore(userId: string, deltaKg: number, deltaTrust = 0) {
  const user = users.find((candidate) => candidate.id === userId);
  if (!user) {
    return;
  }

  user.kgScore = Math.max(0, user.kgScore + deltaKg);
  user.trustScore = Math.max(0, Math.min(100, user.trustScore + deltaTrust));
  user.titleId = resolveTitle(user.kgScore).id;
}

export function recalculateUserTrust(userId: string) {
  const userPosts = posts.filter((post) => post.userId === userId && post.status !== "deleted");
  const totalPhotos = userPosts.reduce((sum, post) => sum + post.photos.length, 0);
  const trustScore = Math.min(100, 40 + userPosts.length * 3 + totalPhotos * 2);
  const user = users.find((candidate) => candidate.id === userId);
  if (user) {
    user.trustScore = trustScore;
  }
}

export function getCategoryById(categoryId: string) {
  return categories.find((category) => category.id === categoryId) ?? null;
}

export function getRestaurantById(restaurantId: string) {
  return restaurants.find((restaurant) => restaurant.id === restaurantId) ?? null;
}

export function buildPostDetail(postId: string) {
  const post = posts.find((candidate) => candidate.id === postId && candidate.status !== "deleted");
  if (!post) {
    return null;
  }

  const author = users.find((candidate) => candidate.id === post.userId) ?? null;

  return {
    post: serializePost(post),
    author: author ? serializeUser(author) : null,
    avg_rating: post.averageRating,
    like_count: post.likeCount,
    photos: post.photos
  };
}
