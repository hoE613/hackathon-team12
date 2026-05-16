import { useNavigate } from "react-router-dom";

import { user, activities } from "../data/dummyData";

export default function MyPage() {
  const navigate = useNavigate();

  return (
    <section className="my-page refined-my-page">
      <div className="my-profile-card">
        <div className="my-profile-top">
          <div className="my-avatar">🧑‍🍳</div>

          <div className="my-info">
            <h1>쩝쩝박사 48kg</h1>

            <button
              className="my-level-text-link"
              onClick={() => navigate("/my/level")}
            >
              맛집 히어로가 되는 중이에요!
            </button>
          </div>

          <button
            className="my-setting-button"
            onClick={() => navigate("/my/profile")}
          >
            ⚙️
          </button>
        </div>

        <div className="my-trust-section">
          <span>내 신뢰도 점수</span>
          <strong>48kg</strong>

          <div className="progress">
            <i style={{ width: "78%" }} />
          </div>

          <p>다음 레벨까지 2kg!</p>
        </div>

        <div className="my-stat-grid">
          {user.stats.map((s) => (
            <button key={s.label} onClick={() => navigate(s.path)}>
              <span>{s.icon}</span>
              <b>{s.label}</b>
              <em>{s.value}</em>
            </button>
          ))}
        </div>
      </div>

      <div className="my-activity-card">
        <div className="my-section-title">
          <h2>최근 활동</h2>
          <button onClick={() => navigate("/my/activity")}>전체 보기</button>
        </div>

        <div className="my-activity-list">
          {activities.map((a) => (
            <button
              className="my-activity-item"
              key={a.restaurant}
              onClick={() => navigate("/my/activity")}
            >
              <img src={a.image} alt={a.restaurant} />

              <div>
                <b>{a.restaurant}</b>
                <span>
                  ⭐ {a.rating} · 댓글 {a.comment}
                </span>
              </div>

              <em>{a.date}</em>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
