export type AuthAccount = {
  id: string;
  userId: string;
  provider: string;
  providerUserId: string;
  email: string | null;
  accessTokenEnc: string;
  refreshTokenEnc: string;
  createdAt: string;
};

export type AiRecommendationLog = {
  id: string;
  userId: string;
  requestContext: Record<string, unknown>;
  candidateRestaurantIds: string[];
  finalRecommendation: {
    candidates: Array<{ id: string; score: number; reason: string }>;
    meta: {
      recommendation_id: string;
      model_name: string;
      prompt_version: string;
    };
  };
  modelName: string;
  promptVersion: string;
  createdAt: string;
};

export type UserPostAction = {
  userId: string;
  postId: string;
  createdAt: string;
};

export const authAccounts: AuthAccount[] = [];
export const accessTokenToUserId = new Map<string, string>();
export const refreshTokenToUserId = new Map<string, string>();
export const aiRecommendationLogs: AiRecommendationLog[] = [];
export const postLikes: UserPostAction[] = [];
export const postScraps: UserPostAction[] = [];
