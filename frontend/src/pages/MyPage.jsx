import { useNavigate } from "react-router-dom";

import { user, activities } from "../data/dummyData";

export default function MyPage() {
  const navigate = useNavigate();

  return (
    <section className="my-page">
      <div className="profile-panel wide">
        <div className="profile-head">
          <span>🧑‍🍳</span>

          <div>
            <b>쩝쩝박사 48kg</b>

            <p>맛집 히어로가 되는 중이에요!</p>
          </div>

          <button onClick={() => navigate("/my/profile")}>⚙️</button>
        </div>

        <div className="trust-box">
          <small>내 신뢰도 점수</small>

          <b>48kg</b>

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
      </div>

      <section className="panel">
        <h2>최근 활동</h2>

        {activities.map((a) => (
          <button
            className="activity-row"
            onClick={() => navigate("/my/activity")}
            key={a.restaurant}
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
    </section>
  );
}
