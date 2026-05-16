export type Title = {
  id: string;
  name: string;
  minKg: number;
  maxKg: number | null;
  badgeUrl: string;
  description: string;
};

export type Category = {
  id: string;
  name: string;
  parentId: string | null;
  sortOrder: number;
  isActive: boolean;
  postCount: number;
};

export type User = {
  id: string;
  nickname: string;
  profileImage: string | null;
  trustScore: number;
  kgScore: number;
  titleId: string;
  role: "user" | "admin";
  preferredCategories: string[];
  createdAt: string;
};

export type Restaurant = {
  id: string;
  name: string;
  categoryId: string;
  address: string;
  lat: number;
  lng: number;
  phone: string;
  priceRange: string;
  businessHours: string;
};

export type Post = {
  id: string;
  userId: string;
  restaurantId: string;
  categoryId: string;
  title: string;
  content: string;
  averageRating: number;
  reviewCount: number;
  photoCount: number;
  likeCount: number;
  kgScore: number;
  status: "published" | "draft" | "deleted";
  createdAt: string;
  updatedAt: string;
  photos: string[];
};

export type Review = {
  id: string;
  postId: string;
  userId: string;
  rating: number;
  content: string;
  photos: string[];
  createdAt: string;
  updatedAt: string;
};

export type RankingItem = {
  rank: number;
  userId: string;
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

export type SeedPost = {
  id: string;
  title: string;
  restaurantName: string;
  averageRating: number;
  reviewCount: number;
  kgScore: number;
  summary: string;
};

export type SeedResponse = {
  categories: Array<{ id: string; name: string; postCount: number }>;
  posts: SeedPost[];
  rankings: RankingItem[];
  aiRecommendations: AiRecommendation[];
};

export const titles: Title[] = [
  { id: "title_beg", name: "입문자", minKg: 0, maxKg: 9, badgeUrl: "/badges/title-beg.svg", description: "첫 발을 뗀 쩝쩝러" },
  { id: "title_exp", name: "탐험가", minKg: 10, maxKg: 29, badgeUrl: "/badges/title-exp.svg", description: "새로운 맛집을 넓게 탐색" },
  { id: "title_taste", name: "맛잘알", minKg: 30, maxKg: 49, badgeUrl: "/badges/title-taste.svg", description: "맛의 기준이 있는 사용자" },
  { id: "title_eater", name: "쩝쩝러", minKg: 50, maxKg: 99, badgeUrl: "/badges/title-eater.svg", description: "자주 기록하고 추천하는 사용자" },
  { id: "title_master", name: "쩝쩝박사", minKg: 100, maxKg: null, badgeUrl: "/badges/title-master.svg", description: "누적 활동이 높은 핵심 유저" }
];

export const categories: Category[] = [
  { id: "western", name: "양식", parentId: null, sortOrder: 1, isActive: true, postCount: 156 },
  { id: "chinese", name: "중식", parentId: null, sortOrder: 2, isActive: true, postCount: 89 },
  { id: "japanese", name: "일식", parentId: null, sortOrder: 3, isActive: true, postCount: 234 },
  { id: "pub", name: "술집", parentId: null, sortOrder: 4, isActive: true, postCount: 412 }
];

export const restaurants: Restaurant[] = [
  {
    id: "rest_001",
    name: "오므라이스 연구소",
    categoryId: "western",
    address: "성남시 수정구 가천로 1",
    lat: 37.4501,
    lng: 127.1284,
    phone: "031-000-0001",
    priceRange: "10,000-15,000",
    businessHours: "11:00-21:00"
  },
  {
    id: "rest_002",
    name: "스시 하루",
    categoryId: "japanese",
    address: "성남시 수정구 복정동 2",
    lat: 37.4532,
    lng: 127.1267,
    phone: "031-000-0002",
    priceRange: "12,000-25,000",
    businessHours: "11:30-22:00"
  },
  {
    id: "rest_003",
    name: "광진구 스시 바",
    categoryId: "japanese",
    address: "서울시 광진구 3",
    lat: 37.5451,
    lng: 127.0822,
    phone: "02-000-0003",
    priceRange: "20,000-40,000",
    businessHours: "12:00-23:00"
  }
];

export const users: User[] = [
  {
    id: "user_001",
    nickname: "쩝쩝박사",
    profileImage: null,
    trustScore: 92,
    kgScore: 250,
    titleId: "title_master",
    role: "user",
    preferredCategories: ["japanese", "western"],
    createdAt: "2026-05-01T09:00:00.000Z"
  },
  {
    id: "user_123",
    nickname: "맛잘알",
    profileImage: null,
    trustScore: 71,
    kgScore: 45,
    titleId: "title_taste",
    role: "user",
    preferredCategories: ["japanese", "pub"],
    createdAt: "2026-05-03T09:00:00.000Z"
  },
  {
    id: "user_456",
    nickname: "탐험가",
    profileImage: null,
    trustScore: 64,
    kgScore: 31,
    titleId: "title_taste",
    role: "user",
    preferredCategories: ["western", "chinese"],
    createdAt: "2026-05-05T09:00:00.000Z"
  }
];

export const posts: Post[] = [
  {
    id: "post_001",
    userId: "user_001",
    restaurantId: "rest_001",
    categoryId: "western",
    title: "가천대 근처 숨은 오므라이스 맛집",
    content: "가천대 근처에서 안정적인 맛과 분위기를 동시에 챙길 수 있는 양식 맛집입니다.",
    averageRating: 4.7,
    reviewCount: 42,
    photoCount: 3,
    likeCount: 28,
    kgScore: 128,
    status: "published",
    createdAt: "2026-05-10T09:00:00.000Z",
    updatedAt: "2026-05-10T09:00:00.000Z",
    photos: ["https://picsum.photos/seed/post001/640/480"]
  },
  {
    id: "post_002",
    userId: "user_123",
    restaurantId: "rest_002",
    categoryId: "japanese",
    title: "혼밥하기 좋은 담백한 초밥집",
    content: "가볍게 식사하기 좋고, 사진 리뷰가 많은 일식 중심 추천 글입니다.",
    averageRating: 4.6,
    reviewCount: 28,
    photoCount: 2,
    likeCount: 19,
    kgScore: 95,
    status: "published",
    createdAt: "2026-05-11T09:00:00.000Z",
    updatedAt: "2026-05-11T09:00:00.000Z",
    photos: ["https://picsum.photos/seed/post002/640/480"]
  }
];

export const reviews: Review[] = [];

export const aiRecommendations: AiRecommendation[] = [
  {
    id: "rest_456",
    name: "신당역 오마카세",
    category: "일식",
    distanceKm: 0.8,
    averageRating: 4.6,
    reason: "현재 위치에서 가깝고, 일식 선호와 맞으며, 리뷰 반응이 좋은 편입니다.",
    confidence: 0.92
  },
  {
    id: "rest_789",
    name: "광진구 스시 바",
    category: "일식",
    distanceKm: 1.2,
    averageRating: 4.3,
    reason: "가벼운 점심과 저녁 모두 잘 맞는 구조이며, Kg가 높은 유저들이 자주 추천했습니다.",
    confidence: 0.85
  }
];

export function resolveTitle(kgScore: number): Title {
  return titles.find((title) => kgScore >= title.minKg && (title.maxKg === null || kgScore <= title.maxKg)) ?? titles[0];
}

export function buildUserRankings(sourceUsers: User[] = users): RankingItem[] {
  return [...sourceUsers]
    .sort((left, right) => right.kgScore - left.kgScore)
    .map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      nickname: user.nickname,
      kgScore: user.kgScore,
      title: resolveTitle(user.kgScore).name
    }));
}

export function buildCategoryRankings(categoryId: string): RankingItem[] {
  const categoryPosts = posts.filter((post) => post.categoryId === categoryId && post.status !== "deleted");
  const scoreByUser = new Map<string, number>();

  for (const post of categoryPosts) {
    const currentScore = scoreByUser.get(post.userId) ?? 0;
    scoreByUser.set(post.userId, currentScore + 10 + post.photoCount * 3 + post.reviewCount);
  }

  return [...scoreByUser.entries()]
    .sort((left, right) => right[1] - left[1])
    .map(([userId, kgScore], index) => {
      const user = users.find((candidate) => candidate.id === userId);
      return {
        rank: index + 1,
        userId,
        nickname: user?.nickname ?? userId,
        kgScore,
        title: resolveTitle(kgScore).name
      };
    });
}

export function buildSeedResponse(): SeedResponse {
  return {
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      postCount: posts.filter((post) => post.categoryId === category.id && post.status !== "deleted").length
    })),
    posts: posts
      .filter((post) => post.status !== "deleted")
      .map((post) => {
        const restaurant = restaurants.find((candidate) => candidate.id === post.restaurantId);
        return {
          id: post.id,
          title: post.title,
          restaurantName: restaurant?.name ?? post.restaurantId,
          averageRating: post.averageRating,
          reviewCount: post.reviewCount,
          kgScore: post.kgScore,
          summary: post.content
        };
      }),
    rankings: buildUserRankings(),
    aiRecommendations
  };
}
