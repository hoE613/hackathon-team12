export type PostBody = {
  restaurant_id?: string;
  category_id?: string;
  title?: string;
  content?: string;
  photos?: string[];
};

export type ReviewBody = {
  rating?: number;
  content?: string;
  photos?: string[];
};

export type LoginBody = {
  code?: string;
};

export type SignupBody = {
  code?: string;
  nickname?: string;
  email?: string;
  preferred_categories?: string[];
};

export type AdminCreateUserBody = {
  code?: string;
  nickname?: string;
  email?: string;
  preferred_categories?: string[];
  role?: "user" | "admin";
};

export type UserProfileBody = {
  nickname?: string;
  email?: string;
  preferred_categories?: string[];
};

export type RefreshBody = {
  refresh_token?: string;
};

export type AiRecommendationBody = {
  location?: { lat?: number; lng?: number };
  time?: string;
  budget?: number;
  people?: number;
  intent?: string;
  filters?: Array<{ field: string; value: string }>;
};

export type ContentBody = {
  text?: string;
  limit?: number;
};
