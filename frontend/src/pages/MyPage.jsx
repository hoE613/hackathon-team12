import { useNavigate } from "react-router-dom";
import { activities } from "../data/dummyData";
import { useAuth } from "../auth/AuthContext.jsx";

export default function MyPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const kg = user?.kg_score ?? user?.kg ?? 0;
  const trust = user?.trust_score ?? 0;
  const title = user?.title ?? "새내기";
  const nextKg = kg <= 5 ? 6 : kg <= 10 ? 11 : kg <= 30 ? 31 : kg <= 50 ? 51 : kg <= 70 ? 71 : kg <= 90 ? 91 : kg;
  const progress = nextKg ? Math.min(100, Math.round((kg / nextKg) * 100)) : 100;

  const myStats = [
    { label: "내가 쓴 글", value: user?.posted_count ?? 0, icon: "글", path: "/my/activity" },
    { label: "북마크", value: user?.clip_count ?? 0, icon: "북", path: "/my/saved" },
    { label: "추천한 글", value: user?.recommended_count ?? 0, icon: "추", path: "/recommended" },
  ];

  return (
    <section className="my-page refined-my-page">
      <div className="my-profile-card">
        <div className="my-profile-top">
          <div className="my-avatar">쩝</div>

          <div className="my-info">
            <h1>{user?.nickname ?? "로그인 사용자"} {title}</h1>

            <button
              className="my-level-text-link"
              onClick={() => navigate("/my/level")}
            >
              현재 kg: {kg}kg
            </button>
          </div>

          <button
            className="my-setting-button"
            onClick={logout}
          >
            로그아웃
          </button>
        </div>

        <div className="my-trust-section">
          <span>내 신뢰도 점수</span>
          <strong>{trust}점</strong>

          <div className="progress">
            <i style={{ width: `${progress}%` }} />
          </div>

          <p>{nextKg > kg ? `다음 레벨까지 ${nextKg - kg}kg` : "최고 레벨 구간입니다."}</p>
        </div>

        <div className="my-stat-grid">
          {myStats.map((s) => (
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
