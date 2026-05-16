import { useParams, useNavigate } from "react-router-dom";

import { restaurants, reviews } from "../data/dummyData";

import {
  ArrowLeft,
  Bookmark,
  MoreHorizontal,
  Star,
  ThumbsUp,
  MapPin,
  ShieldCheck,
} from "lucide-react";

export default function RestaurantDetailPage() {
  const { id } = useParams();

  const navigate = useNavigate();

  const restaurant =
    restaurants.find((r) => String(r.id) === id) || restaurants[0];

  const review =
    reviews.find((r) => r.restaurantId === restaurant.id) || reviews[0];

  return (
    <div className="detail-page">
      <section className="detail-hero">
        <img src={restaurant.image} alt={restaurant.name} />

        <button className="floating left" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </button>

        <button className="floating bookmark">
          <Bookmark />
        </button>

        <button className="floating more">
          <MoreHorizontal />
        </button>

        <span className="image-count">1/6</span>
      </section>

      <section className="detail-body panel">
        <div className="detail-title">
          <div>
            <h1>{restaurant.name}</h1>

            <p>
              {restaurant.category.map((c) => (
                <span key={c}>{c}</span>
              ))}
            </p>
          </div>

          <button onClick={() => navigate("/verified")}>
            ✅<b>인증 맛집</b>
          </button>
        </div>

        <div className="detail-meta">
          <span>
            <Star size={17} fill="currentColor" />
            {restaurant.rating}({restaurant.reviews})
          </span>

          <span>
            <ThumbsUp size={17} fill="currentColor" />
            {restaurant.likes}
          </span>
        </div>

        <div className="location-row">
          <MapPin size={18} />
          {restaurant.distance}

          <button onClick={() => navigate("/map")}>지도보기</button>
        </div>

        <p className="desc">
          {restaurant.desc}
          학생들도 많이 가는 가성비 맛집입니다.
        </p>

        <h3>대표 메뉴</h3>

        <div className="menu-list">
          {restaurant.menu.map((m) => (
            <div key={m.name}>
              <span>{m.name}</span>
              <b>{m.price}</b>
            </div>
          ))}
        </div>

        <article className="detail-review">
          <div className="reviewer">
            🧑‍🍳
            <b>
              {review.reviewer}
              <em>48kg</em>
            </b>
            <button>팔로우</button>
          </div>

          <small>2024.05.20 방문</small>

          <p>{review.text}</p>

          <div>
            <ShieldCheck size={16} />
            신뢰도 {review.trust}점
          </div>
        </article>

        <div className="detail-actions">
          <button className="primary" onClick={() => navigate("/recommended")}>
            👍 추천하기 {restaurant.likes}
          </button>

          <button onClick={() => navigate("/my/saved")}>
            <Bookmark />
          </button>
        </div>
      </section>
    </div>
  );
}
