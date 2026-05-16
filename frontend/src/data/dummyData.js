export const user = {
  name: "쩝쩝박사",
  level: "48kg",
  nextLevel: "미식탐험가",
  nextLevelKg: "50kg",
  trustScore: 48,
  profileImage: "🧑‍🍳",
  stats: [
    { label: "내가 쓴 글", value: 12, icon: "📝", path: "/my/reviews" },
    { label: "저장한 맛집", value: 28, icon: "🔖", path: "/my/saved" },
    { label: "추천한 글", value: 56, icon: "👍", path: "/recommended" },
    { label: "방문 인증", value: 9, icon: "📷", path: "/verify-photo" },
  ],
};

export const categories = [
  { id: "all", name: "전체", icon: "▦", path: "/" },
  { id: "korean", name: "한식", icon: "🍚", path: "/category/korean" },
  { id: "chinese", name: "중식", icon: "🥡", path: "/category/chinese" },
  { id: "japanese", name: "일식", icon: "🍣", path: "/category/japanese" },
  { id: "western", name: "양식", icon: "🍽️", path: "/category/western" },
  { id: "cafe", name: "카페", icon: "☕", path: "/category/cafe" },
  { id: "pub", name: "술집", icon: "🍺", path: "/category/pub" },
  { id: "dessert", name: "디저트", icon: "🍰", path: "/category/dessert" },
  { id: "late-night", name: "야식", icon: "🌙", path: "/category/late-night" },
  { id: "fusion", name: "혼밥", icon: "🍜", path: "/category/fusion" },
  { id: "date", name: "데이트", icon: "💛", path: "/category/date" },
  { id: "value", name: "가성비", icon: "🔥", path: "/category/value" },
];

export const restaurants = [
  {
    id: 1,
    name: "떡볶이의 정석",
    category: ["한식", "분식"],
    rating: 4.6,
    reviews: 128,
    likes: 152,
    distance: "가천대역 도보 7분",
    image:
      "https://images.unsplash.com/photo-1635363638580-c2809d049eee?auto=format&fit=crop&w=600&q=80",
    desc: "소스가 진하고 양도 많은 가성비 분식 맛집입니다.",
    menu: [
      { name: "떡볶이", price: "5,500원" },
      { name: "튀김 세트", price: "4,500원" },
      { name: "순대", price: "5,000원" },
    ],
  },
  {
    id: 2,
    name: "보니또 파스타",
    category: ["양식", "파스타"],
    rating: 4.5,
    reviews: 98,
    likes: 128,
    distance: "가천대역 도보 5분",
    image:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=600&q=80",
    desc: "크림이 진하고 분위기가 좋은 파스타 맛집입니다.",
    menu: [
      { name: "크림 파스타", price: "9,000원" },
      { name: "토마토 파스타", price: "8,500원" },
    ],
  },
  {
    id: 3,
    name: "카페 포근",
    category: ["카페", "디저트"],
    rating: 4.7,
    reviews: 84,
    likes: 112,
    distance: "가천대역 도보 3분",
    image:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=600&q=80",
    desc: "디저트 비주얼이 좋고 조용한 카페입니다.",
    menu: [
      { name: "딸기 케이크", price: "7,000원" },
      { name: "아메리카노", price: "4,000원" },
    ],
  },
  {
    id: 4,
    name: "경양식집 오렌지",
    category: ["양식", "돈까스"],
    rating: 4.6,
    reviews: 72,
    likes: 98,
    distance: "수원역 도보 10분",
    image:
      "https://images.unsplash.com/photo-1604909052743-94e838986d24?auto=format&fit=crop&w=600&q=80",
    desc: "돈까스가 바삭하고 소스가 달달한 경양식 맛집입니다.",
    menu: [
      { name: "돈까스", price: "7,500원" },
      { name: "치즈돈까스", price: "8,500원" },
      { name: "오므라이스", price: "7,000원" },
    ],
  },
  {
    id: 5,
    name: "가천분식",
    category: ["분식", "야식"],
    rating: 4.4,
    reviews: 62,
    likes: 86,
    distance: "가천대역 도보 6분",
    image:
      "https://images.unsplash.com/photo-1625938144755-652e08e359b7?auto=format&fit=crop&w=600&q=80",
    desc: "야식으로 먹기 좋은 분식집입니다.",
    menu: [
      { name: "김밥", price: "3,500원" },
      { name: "라면", price: "4,000원" },
    ],
  },
];

export const reviews = [
  {
    id: 1,
    rank: 1,
    restaurantId: 1,
    reviewer: "쩝쩝박사",
    reviewerIcon: "🧑‍🍳",
    text: "소스가 진짜 미쳤어요! 달콤하면서 매콤해서 계속 손이 가요 ㅠㅠ 양도 많고 가성비 최고!",
    rating: 4.6,
    likes: 152,
    trust: 48,
    time: "1시간 전",
  },
  {
    id: 2,
    rank: 2,
    restaurantId: 2,
    reviewer: "미식탐험가",
    reviewerIcon: "🧑🏻‍💼",
    text: "크림이 진하고 면도 탱글해서 정말 맛있었어요. 분위기도 좋아서 데이트 장소로 추천합니다!",
    rating: 4.5,
    likes: 128,
    trust: 32,
    time: "3시간 전",
  },
  {
    id: 3,
    rank: 3,
    restaurantId: 3,
    reviewer: "학식헌터",
    reviewerIcon: "👩‍🍳",
    text: "디저트 비주얼도 예쁘고 맛도 최고! 특히 딸기 케이크는 꼭 드셔보세요.",
    rating: 4.7,
    likes: 112,
    trust: 25,
    time: "5시간 전",
  },
  {
    id: 4,
    rank: 4,
    restaurantId: 4,
    reviewer: "맛집사냥꾼",
    reviewerIcon: "🧑🏻",
    text: "돈까스가 바삭하고 소스가 진짜 맛있어요. 재방문 의사 100%!",
    rating: 4.6,
    likes: 98,
    trust: 18,
    time: "7시간 전",
  },
  {
    id: 5,
    rank: 5,
    restaurantId: 5,
    reviewer: "분식러버",
    reviewerIcon: "🧒",
    text: "야식으로 최고예요! 튀김이 바삭하고 떡볶이도 꾸덕하니 맛있어요.",
    rating: 4.4,
    likes: 86,
    trust: 12,
    time: "9시간 전",
  },
];

export const rankings = [
  { name: "쩝쩝박사", kg: 128, icon: "🧑‍🍳" },
  { name: "미식의 신", kg: 98, icon: "🧑🏻‍💼" },
  { name: "맛집헌터", kg: 76, icon: "👩‍🍳" },
  { name: "학식헌터", kg: 74, icon: "🦸" },
  { name: "맛잘알", kg: 62, icon: "🧑" },
];

export const activities = [
  {
    restaurant: "경양식집 오렌지",
    rating: 4.6,
    comment: 12,
    date: "05.20",
    image: restaurants[3].image,
  },
  {
    restaurant: "카페 포근",
    rating: 4.7,
    comment: 8,
    date: "05.20",
    image: restaurants[2].image,
  },
  {
    restaurant: "보니또 파스타",

    rating: 4.5,

    comment: 6,

    date: "05.19",

    image:
      "https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?auto=format&fit=crop&w=300&q=80",
  },
];
export const fullRankings = Array.from({ length: 100 }, (_, index) => {
  const baseNames = [
    "쩝쩝박사",
    "미식의 신",
    "맛집헌터",
    "학식헌터",
    "맛잘알",
    "분식러버",
    "카페요정",
    "야식대장",
    "혼밥마스터",
    "가성비왕",
  ];

  const icons = ["🧑‍🍳", "🧑🏻‍💼", "👩‍🍳", "🦸", "🧑", "🍜", "☕", "🌙", "🍚", "🔥"];

  const rank = index + 1;

  return {
    rank,
    name: rank <= 10 ? baseNames[index] : `쩝쩝러 ${rank}`,
    kg: Math.max(10, 128 - index),
    icon: icons[index % icons.length],
  };
});
