import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RestaurantGrid, ReviewRankingList } from "../components/Cards.jsx";

import { useAuth } from "../auth/AuthContext.jsx";
import { apiRequest } from "../api/client.js";
import { getLevelProgress } from "../utils/levels.js";
import LevelGauge from "../components/LevelGauge.jsx";

export default function GenericPage({ title, subtitle, type }) {
  const navigate = useNavigate();
  const { accessToken, user } = useAuth();
  const [userItems, setUserItems] = useState([]);
  const [status, setStatus] = useState("");
  const kg = user?.kg_score ?? user?.kg ?? 0;
  const levelProgress = getLevelProgress(kg);
  const emptyMessageByType = {
    "my-posts": "아직 작성한 게시글이 없습니다.",
    activity: "아직 최근 활동이 없습니다.",
    saved: "아직 북마크한 게시글이 없습니다.",
    recommended: "아직 추천한 게시글이 없습니다.",
  };

  useEffect(() => {
    if (!accessToken) return;

    const pathByType = {
      "my-posts": "/users/posts",
      saved: "/users/clip",
      recommended: "/users/recommended",
    };
    const path = pathByType[type];
    if (!path) return;

    setStatus("내 데이터를 불러오는 중입니다.");
    apiRequest(path, { method: "GET" }, accessToken)
      .then((result) => {
        setUserItems(result.posts ?? result.clips ?? result.recommended ?? []);
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

          <b>{kg}kg</b>

          <LevelGauge levelProgress={levelProgress} />

          <small>{levelProgress.next ? `다음 레벨까지 ${levelProgress.remainingKg}kg` : "최고 레벨 구간입니다."}</small>
        </div>
      )}

      {type === "reviews" && <ReviewRankingList limit={3} />}

      {(type === "my-posts" || type === "activity" || type === "saved" || type === "recommended") && (
        userItems.length > 0 ? (
          userItems.map((a, index) => (
            <button
              className="activity-row static"
              key={a.post_id ?? a.title ?? index}
              onClick={() => {
                if (a.post_id) {
                  navigate(`/restaurant/${a.post_id}`);
                }
              }}
            >
              <img src={a.image ?? `https://picsum.photos/seed/${a.title ?? index}/240/180`} />

              <span>
                <b>{a.title}</b>

                <small>
                  {a.restaurant_name ? `${a.restaurant_name} · ${a.category_id}` : a.category_id}
                </small>
              </span>

              <em>DB</em>
            </button>
          ))
        ) : (
          <div className="empty-list-state">
            <strong>{emptyMessageByType[type]}</strong>
            <small>게시글을 둘러보고 활동을 시작해보세요.</small>
          </div>
        )
      )}
    </section>
  );
}
