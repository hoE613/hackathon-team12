import { useNavigate } from "react-router-dom";

const levels = [
  {
    id: 1,
    name: "쩝쩝학사",
    range: "0kg ~ 19kg",
    badge: "🎓",
    desc: "맛집 탐험을 막 시작한 단계입니다.",
    guide: [
      "리뷰 작성과 방문 인증을 통해 kg를 쌓을 수 있어요.",
      "추천을 많이 받을수록 성장 속도가 빨라져요.",
      "아직은 기본 활동량이 중요한 단계입니다.",
    ],
  },
  {
    id: 2,
    name: "쩝쩝석사",
    range: "20kg ~ 39kg",
    badge: "📘",
    desc: "맛집 리뷰 경험이 쌓이기 시작한 단계입니다.",
    guide: [
      "사진이 포함된 리뷰를 작성하면 신뢰도가 올라가요.",
      "저장한 맛집과 추천 활동도 레벨 성장에 반영돼요.",
      "꾸준한 활동이 다음 단계 진입의 핵심입니다.",
    ],
  },
  {
    id: 3,
    name: "쩝쩝박사",
    range: "40kg ~ 69kg",
    badge: "🧑‍🍳",
    desc: "신뢰도 높은 리뷰어로 인정받는 단계입니다.",
    guide: [
      "방문 인증과 상세한 리뷰가 높은 평가를 받아요.",
      "다른 사용자의 추천을 많이 받을수록 kg가 빠르게 올라요.",
      "맛집 추천 영향력이 커지는 단계입니다.",
    ],
  },
  {
    id: 4,
    name: "쩝쩝교수",
    range: "70kg 이상",
    badge: "👑",
    desc: "쩝쩝박사의 최상위 맛집 전문가 단계입니다.",
    guide: [
      "높은 신뢰도와 꾸준한 리뷰 활동이 필요한 단계입니다.",
      "랭킹 상위권에 노출될 가능성이 높아져요.",
      "가천대 맛집 생태계에 큰 영향력을 가진 리뷰어입니다.",
    ],
  },
];

export default function LevelPage() {
  const navigate = useNavigate();
  const currentKg = 48;
  const currentLevel = levels[2];
  const nextLevel = levels[3];
  const progress = 48;

  return (
    <section className="level-page">
      <button className="level-back" onClick={() => navigate("/my")}>
        ← 마이페이지로 돌아가기
      </button>

      <div className="level-hero">
        <div className="level-tabs">
          {levels.map((level) => (
            <button
              key={level.id}
              className={level.id === currentLevel.id ? "active" : ""}
            >
              {level.name.replace("쩝쩝", "")}
            </button>
          ))}
        </div>

        <div className="level-badge-card">
          <div className="level-badge-glow">
            <div className="level-badge">
              <span>{currentLevel.badge}</span>
              <strong>{currentLevel.id}</strong>
            </div>
          </div>

          <p>현재 레벨</p>
          <h1>{currentLevel.name}</h1>
          <b>{currentKg}kg</b>
        </div>
      </div>

      <div className="level-progress-card">
        <div>
          <h2>다음 레벨에 도전해봐요!</h2>
          <p>
            다음 단계는 <b>{nextLevel.name}</b>입니다.
          </p>
        </div>

        <div className="level-progress-bar">
          <i style={{ width: `${progress}%` }} />
        </div>

        <span>다음 레벨까지 22kg 남았어요.</span>
      </div>

      <div className="level-guide-card">
        <h2>전체 레벨 가이드</h2>

        <div className="level-list">
          {levels.map((level) => (
            <article
              key={level.id}
              className={level.id === currentLevel.id ? "current" : ""}
            >
              <div className="level-number">{level.id}</div>

              <div>
                <h3>{level.name}</h3>
                <strong>{level.range}</strong>
                <p>{level.desc}</p>

                <ul>
                  {level.guide.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
