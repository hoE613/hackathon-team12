import { restaurants, resolveTitle, type Post, type Review, type User } from "./data.js";

export function serializeUser(user: User) {
  const title = resolveTitle(user.kgScore);
  return {
    id: user.id,
    nickname: user.nickname,
    profile_image: user.profileImage,
    trust_score: user.trustScore,
    kg_score: user.kgScore,
    role: user.role,
    title: title.name,
    title_id: user.titleId,
    preferred_categories: user.preferredCategories
  };
}

export function serializePost(post: Post) {
  const restaurant = restaurants.find((candidate) => candidate.id === post.restaurantId);
  return {
    id: post.id,
    user_id: post.userId,
    restaurant_id: post.restaurantId,
    category_id: post.categoryId,
    title: post.title,
    content: post.content,
    average_rating: post.averageRating,
    review_count: post.reviewCount,
    photo_count: post.photoCount,
    like_count: post.likeCount,
    status: post.status,
    created_at: post.createdAt,
    updated_at: post.updatedAt,
    restaurant_name: restaurant?.name ?? post.restaurantId,
    photos: post.photos
  };
}

export function serializeReview(review: Review) {
  return {
    id: review.id,
    post_id: review.postId,
    user_id: review.userId,
    rating: review.rating,
    content: review.content,
    photos: review.photos,
    created_at: review.createdAt,
    updated_at: review.updatedAt
  };
}
