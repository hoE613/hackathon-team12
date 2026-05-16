import { useNavigate } from "react-router-dom";
import {
  categories,
  restaurants,
  reviews,
  rankings,
  user,
  activities,
} from "../data/dummyData";

import {
  Star,
  ThumbsUp,
  ShieldCheck,
  MapPin,
  ChevronRight,
} from "lucide-react";

export function CategoryStrip() {
  const navigate = useNavigate();

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

      {reviews.slice(0, limit).map((review) => {
        const restaurant = restaurants.find(
          (r) => r.id === review.restaurantId
        );

        return (
          <article
            className="review-rank-card"
            key={review.id}
            onClick={() => navigate(`/restaurant/${restaurant.id}`)}
          >
            <div className={`rank-badge rank-${review.rank}`}>
              {review.rank}
            </div>

            <div className="review-main">
              <p className="review-text">“{review.text}”</p>

              <div className="review-meta">
                <span>
                  <Star size={15} fill="currentColor" />
                  {review.rating}
                </span>

                <span>
                  <ThumbsUp size={15} fill="currentColor" />
                  {review.likes}
                </span>

                <span>
                  <ShieldCheck size={15} />
                  신뢰도 {review.trust}점
                </span>

                <span>
                  {review.reviewerIcon} {review.reviewer}
                </span>

                <span>{review.time}</span>
              </div>
            </div>

            <div className="restaurant-mini">
              <img src={restaurant.image} alt={restaurant.name} />

              <b>{restaurant.name}</b>

              <small>{restaurant.category.join(" · ")}</small>

              <small>
                <MapPin size={12} />
                {restaurant.distance}
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
            key={r.name}
            onClick={() => navigate("/ranking")}
          >
            <b>{i + 1}</b>
            <span>{r.icon}</span>
            <strong>{r.name}</strong>
            <em>{r.kg}kg</em>
          </button>
        ))}
      </section>

      <section className="profile-panel">
        <div className="profile-head">
          <span>🧑‍🍳</span>

          <div>
            <b>
              {user.name} {user.level}
            </b>

            <p>맛집 히어로가 되는 중이에요!</p>
          </div>
        </div>

        <div className="trust-box">
          <small>내 신뢰도 점수</small>

          <b>{user.trustScore}kg</b>

          <div className="progress">
            <i style={{ width: "78%" }} />
          </div>

          <small>다음 레벨까지 2kg!</small>
        </div>

        <div className="quick-stats">
          {user.stats.map((s) => (
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

  return (
    <div className="card-grid">
      {restaurants.map((r) => (
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
