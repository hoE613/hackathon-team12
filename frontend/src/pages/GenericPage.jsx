import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RestaurantGrid, ReviewRankingList } from "../components/Cards.jsx";

import { activities } from "../data/dummyData";
import { useAuth } from "../auth/AuthContext.jsx";
import { apiRequest } from "../api/client.js";

export default function GenericPage({ title, subtitle, type }) {
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();
  const [userItems, setUserItems] = useState([]);
  const [status, setStatus] = useState("");

  useEffect(() => {
    if (!accessToken) return;

    const pathByType = {
      activity: "/users/posts",
      saved: "/users/clip",
    };
    const path = pathByType[type];
    if (!path) return;

    setStatus("내 데이터를 불러오는 중입니다.");
    apiRequest(path, { method: "GET" }, accessToken)
      .then((result) => {
        setUserItems(result.posts ?? result.clips ?? []);
        setStatus("");
      })
      .catch((error) => setStatus(`내 데이터 로딩 실패: ${error.message}`));
  }, [accessToken, type]);

  return (
    <section className="panel generic-page">
      <h1>{title}</h1>

      <p>{status || subtitle}</p>

      {type === "ranking" && <ReviewRankingList />}

      {(type === "cards" || type === "search" || type === "verified") && (
        <RestaurantGrid />
      )}

      {type === "form" && (
        <div className="placeholder-form">
          <input placeholder="이름 또는 제목" />

          <textarea placeholder="내용을 입력하세요" />

          <button className="primary">저장</button>
        </div>
      )}

      {type === "map" && (
        <div className="map-placeholder">
          🗺️ 지도 영역
          <br />
          <small>백엔드/API 연결 후 지도 SDK를 연결합니다.</small>
        </div>
      )}

      {(type === "trust" || type === "profile") && (
        <div className="trust-box standalone">
          <small>내 신뢰도 점수</small>

          <b>{user?.trust_score ?? 0}점</b>

          <div className="progress">
            <i style={{ width: "78%" }} />
          </div>

          <small>다음 레벨까지 2kg!</small>
        </div>
      )}

      {type === "reviews" && <ReviewRankingList limit={3} />}

      {(type === "activity" || type === "saved") &&
        (userItems.length > 0 ? userItems : activities).map((a, index) => (
          <button
            className="activity-row static"
            key={a.post_id ?? a.title ?? a.restaurant ?? index}
            onClick={() => {
              if (a.post_id) {
                navigate(`/restaurant/${a.post_id}`);
              }
            }}
          >
            <img src={a.image ?? `https://picsum.photos/seed/${a.title ?? a.restaurant ?? index}/240/180`} />

            <span>
              <b>{a.title ?? a.restaurant}</b>

              <small>
                {a.restaurant_name ? `${a.restaurant_name} · ${a.category_id}` : a.category_id ?? `⭐ ${a.rating} · 댓글 ${a.comment}`}
              </small>
            </span>

            <em>{a.date ?? "DB"}</em>
          </button>
        ))}
    </section>
  );
}
