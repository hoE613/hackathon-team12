export type Category = {
  id: string;
  name: string;
  postCount: number;
};

export type PostSeed = {
  id: string;
  title: string;
  restaurantName: string;
  averageRating: number;
  reviewCount: number;
  kgScore: number;
  summary: string;
};

export type RankingItem = {
  rank: number;
  nickname: string;
  kgScore: number;
  title: string;
};

export type AiRecommendation = {
  id: string;
  name: string;
  category: string;
  distanceKm: number;
  averageRating: number;
  reason: string;
  confidence: number;
};

export type SeedResponse = {
  categories: Category[];
  posts: PostSeed[];
  rankings: RankingItem[];
  aiRecommendations: AiRecommendation[];
};

export type ApiUser = {
  id: string;
  nickname: string;
  trust_score: number;
  kg_score: number;
  title: string;
  preferred_categories: string[];
};

export type ApiPost = {
  id: string;
  title: string;
  content: string;
  restaurant_name: string;
  category_id: string;
  average_rating: number;
  review_count: number;
  like_count: number;
  created_at: string;
};

export type ApiPostDetail = {
  post: ApiPost;
  author: ApiUser | null;
  avg_rating: number;
  review_count: number;
  photos: string[];
};

export type ApiReview = {
  id: string;
  user_id: string;
  rating: number;
  content: string;
  created_at: string;
};
