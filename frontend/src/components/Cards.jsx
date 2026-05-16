import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  restaurants,
  activities,
} from "../data/dummyData";
import { apiRequest } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";
import { getLevelProgress } from "../utils/levels.js";
import LevelGauge from "./LevelGauge.jsx";

import {
  Star,
  ThumbsUp,
  ShieldCheck,
  MapPin,
  ChevronRight,
} from "lucide-react";

const categoryIconById = {
  all: "▦",
  western: "W",
  chinese: "C",
  japanese: "J",
  pub: "P",
};

function fallbackImage(seed) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/420`;
}

function useCategories() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    apiRequest("/categories")
      .then((result) => {
        const apiCategories = result.categories ?? [];
        setCategories([
          { id: "all", name: "전체", icon: categoryIconById.all, path: "/" },
          ...apiCategories.map((category) => ({
            id: category.id,
            name: category.name,
            icon: categoryIconById[category.id] ?? category.name.slice(0, 1),
            path: `/category/${category.id}`,
            postCount: category.post_count,
          })),
        ]);
      })
      .catch(() => setCategories([{ id: "all", name: "전체", icon: categoryIconById.all, path: "/" }]));
  }, []);

  return categories;
}

function usePosts(path = "/posts?limit=12&sort=popular") {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiRequest(path)
      .then((result) => setPosts(result.posts ?? []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [path]);

  return { posts, loading };
}

function useRankings(limit) {
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    apiRequest("/rankings/users")
      .then((result) => setRankings((result.rankings ?? []).slice(0, limit)))
      .catch(() => setRankings([]));
  }, [limit]);

  return rankings;
}

export function CategoryStrip() {
  const navigate = useNavigate();
  const categories = useCategories();

  return (
    <div className="category-strip">
      {categories.map((c) => (
        <button
          key={c.id}
          onClick={() => navigate(c.path)}
          className="category-item"
        >
          <span>{c.icon}</span>
          <b>{c.name}</b>
        </button>
      ))}
    </div>
  );
}

export function ReviewRankingList({ limit = 5 }) {
  const navigate = useNavigate();
  const { posts, loading } = usePosts(`/posts?limit=${limit}&sort=popular`);

  return (
    <section className="panel review-panel">
      <div className="section-title">
        <div>
          <h2>오늘의 리뷰 랭킹 🔥</h2>
          <p>오늘 가장 뜨거운 리뷰 TOP 5</p>
        </div>

        <button onClick={() => navigate("/ranking/popular")}>
          더보기
          <ChevronRight size={16} />
        </button>
      </div>

      {loading && <p className="empty-state">게시글을 불러오는 중입니다.</p>}

      {!loading && posts.map((post, index) => {
        const image = post.photos?.[0] || fallbackImage(post.id);

        return (
          <article
            className="review-rank-card"
            key={post.id}
            onClick={() => navigate(`/restaurant/${post.id}`)}
          >
            <div className={`rank-badge rank-${index + 1}`}>
              {index + 1}
            </div>

            <div className="review-main">
              <p className="review-text">"{post.title}"</p>

              <div className="review-meta">
                <span>
                  <Star size={15} fill="currentColor" />
                  {post.average_rating}
                </span>

                <span>
                  <ThumbsUp size={15} fill="currentColor" />
                  {post.like_count}
                </span>

                <span>
                  <ShieldCheck size={15} />
                  리뷰 {post.review_count}
                </span>

                <span>{post.restaurant_name}</span>

                <span>{new Date(post.created_at).toLocaleDateString("ko-KR")}</span>
              </div>
            </div>

            <div className="restaurant-mini">
              <img src={image} alt={post.restaurant_name} />

              <b>{post.restaurant_name}</b>

              <small>{post.category_id}</small>

              <small>
                <MapPin size={12} />
                가천대 주변
              </small>
            </div>
          </article>
        );
      })}
    </section>
  );
}

export function RightSidebar() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const rankings = useRankings(5);
  const kg = user?.kg_score ?? user?.kg ?? 0;
  const levelProgress = getLevelProgress(kg);

  const stats = [
    { label: "내가 쓴 글", value: user?.posted_count ?? 0, icon: "글", path: "/my/activity" },
    { label: "북마크", value: user?.clip_count ?? 0, icon: "북", path: "/my/saved" },
    { label: "추천한 글", value: user?.recommended_count ?? 0, icon: "추", path: "/recommended" },
  ];

  return (
    <aside className="right-sidebar">
      <section className="panel">
        <div className="section-title">
          <h3>쩝쩝 랭킹 TOP 5</h3>

          <button onClick={() => navigate("/ranking")}>더보기</button>
        </div>

        {rankings.map((r, i) => (
          <button
            className="ranking-row"
            key={r.userId}
            onClick={() => navigate("/ranking")}
          >
            <b>{i + 1}</b>
            <span>{r.rank}</span>
            <strong>{r.nickname}</strong>
            <em>{r.kgScore}kg</em>
          </button>
        ))}
      </section>

      <section className="profile-panel">
        <div className="profile-head">
          <span>🧑‍🍳</span>

          <div>
            <b>
              {user?.nickname ?? "로그인 사용자"} {user?.title ?? "새내기"}
            </b>

            <p>맛집 히어로가 되는 중이에요!</p>
          </div>
        </div>

        <div className="trust-box">
          <small>내 신뢰도 점수</small>

          <b>{kg}kg</b>

          <LevelGauge levelProgress={levelProgress} />

          <small>{levelProgress.next ? `다음 레벨까지 ${levelProgress.remainingKg}kg` : "최고 레벨 구간입니다."}</small>
        </div>

        <div className="quick-stats">
          {stats.map((s) => (
            <button key={s.label} onClick={() => navigate(s.path)}>
              <span>{s.icon}</span>
              <b>{s.label}</b>
              <em>{s.value}</em>
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3>최근 활동</h3>

        {activities.map((a) => (
          <button
            className="activity-row"
            key={a.restaurant}
            onClick={() => navigate("/my/activity")}
          >
            <img src={a.image} />

            <span>
              <b>{a.restaurant}</b>

              <small>
                ⭐ {a.rating} · 댓글 {a.comment}
              </small>
            </span>

            <em>{a.date}</em>
          </button>
        ))}
      </section>
    </aside>
  );
}

export function RestaurantGrid() {
  const navigate = useNavigate();
  const { posts, loading } = usePosts("/posts?limit=12&sort=rating");

  const cards = useMemo(() => {
    if (posts.length > 0) {
      return posts.map((post) => ({
        id: post.id,
        name: post.restaurant_name,
        category: [post.category_id],
        rating: post.average_rating,
        likes: post.like_count,
        image: post.photos?.[0] || fallbackImage(post.id),
        desc: post.content,
      }));
    }

    return restaurants;
  }, [posts]);

  return (
    <div className="card-grid">
      {loading && <p className="empty-state">맛집을 불러오는 중입니다.</p>}
      {!loading && cards.map((r) => (
        <button
          className="restaurant-card"
          key={r.id}
          onClick={() => navigate(`/restaurant/${r.id}`)}
        >
          <img src={r.image} alt={r.name} />

          <div>
            <b>{r.name}</b>

            <small>{r.category.join(" · ")}</small>

            <p>{r.desc}</p>

            <span>
              ⭐ {r.rating} · 👍 {r.likes}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}
