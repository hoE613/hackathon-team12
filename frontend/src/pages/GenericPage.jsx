import { RestaurantGrid, ReviewRankingList } from "../components/Cards.jsx";

import { activities, user } from "../data/dummyData";

export default function GenericPage({ title, subtitle, type }) {
  return (
    <section className="panel generic-page">
      <h1>{title}</h1>

      <p>{subtitle}</p>

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

          <b>{user.trustScore}kg</b>

          <div className="progress">
            <i style={{ width: "78%" }} />
          </div>

          <small>다음 레벨까지 2kg!</small>
        </div>
      )}

      {type === "reviews" && <ReviewRankingList limit={3} />}

      {type === "activity" &&
        activities.map((a) => (
          <div className="activity-row static" key={a.restaurant}>
            <img src={a.image} />

            <span>
              <b>{a.restaurant}</b>

              <small>
                ⭐ {a.rating} · 댓글 {a.comment}
              </small>
            </span>

            <em>{a.date}</em>
          </div>
        ))}
    </section>
  );
}
