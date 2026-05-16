import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { getLevelProgress } from "../utils/levels.js";
import LevelGauge from "../components/LevelGauge.jsx";

const levels = [
  {
    id: 1,
    name: "새내기",
    minKg: 0,
    maxKg: 5,
    range: "1kg ~ 5kg",
    badge: "1",
    desc: "맛집 탐험을 막 시작한 단계입니다.",
    guide: [
      "리뷰 작성과 방문 인증을 통해 kg를 쌓을 수 있어요.",
      "추천을 많이 받을수록 성장 속도가 빨라져요.",
      "아직은 기본 활동량이 중요한 단계입니다.",
    ],
  },
  {
    id: 2,
    name: "쩝쩝 학사",
    minKg: 6,
    maxKg: 10,
    range: "6kg ~ 10kg",
    badge: "2",
    desc: "맛집 리뷰 경험이 쌓이기 시작한 단계입니다.",
    guide: [
      "사진이 포함된 리뷰를 작성하면 신뢰도가 올라가요.",
      "저장한 맛집과 추천 활동도 레벨 성장에 반영돼요.",
      "꾸준한 활동이 다음 단계 진입의 핵심입니다.",
    ],
  },
  {
    id: 3,
    name: "석사",
    minKg: 11,
    maxKg: 30,
    range: "11kg ~ 30kg",
    badge: "3",
    desc: "맛집 기록 경험이 쌓인 단계입니다.",
    guide: [
      "방문 인증과 상세한 리뷰가 높은 평가를 받아요.",
      "다른 사용자의 추천을 많이 받을수록 kg가 빠르게 올라요.",
      "맛집 추천 영향력이 커지는 단계입니다.",
    ],
  },
  {
    id: 4,
    name: "박사",
    minKg: 31,
    maxKg: 50,
    range: "31kg ~ 50kg",
    badge: "4",
    desc: "신뢰도 높은 리뷰어로 인정받는 단계입니다.",
    guide: [
      "높은 신뢰도와 꾸준한 리뷰 활동이 필요한 단계입니다.",
      "랭킹 상위권에 노출될 가능성이 높아져요.",
      "가천대 맛집 생태계에 큰 영향력을 가진 리뷰어입니다.",
    ],
  },
  {
    id: 5,
    name: "교수",
    minKg: 51,
    maxKg: 70,
    range: "51kg ~ 70kg",
    badge: "5",
    desc: "추천 영향력이 커지는 단계입니다.",
    guide: [
      "꾸준한 게시글과 스크랩 반응이 중요해요.",
      "다른 사용자의 추천과 리뷰가 성장에 반영돼요.",
      "카테고리별 랭킹에서 눈에 띄기 시작합니다.",
    ],
  },
  {
    id: 6,
    name: "총장",
    minKg: 71,
    maxKg: 90,
    range: "71kg ~ 90kg",
    badge: "6",
    desc: "상위권 활동량을 가진 핵심 리뷰어입니다.",
    guide: [
      "높은 신뢰도와 폭넓은 카테고리 활동이 필요해요.",
      "추천받는 글을 꾸준히 쌓아보세요.",
      "맛집 생태계에서 영향력이 큰 단계입니다.",
    ],
  },
  {
    id: 7,
    name: "쩝신",
    minKg: 91,
    maxKg: 100,
    range: "91kg ~ 100kg",
    badge: "7",
    desc: "최고 등급의 쩝쩝 전문가 단계입니다.",
    guide: [
      "최상위 랭킹을 유지하는 단계입니다.",
      "추천, 리뷰, 신뢰도 모두 높은 수준이 필요해요.",
      "가천대 맛집 추천의 기준이 됩니다.",
    ],
  },
];

export default function LevelPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const currentKg = user?.kg_score ?? 0;
  const currentLevel = levels.find((level) => currentKg >= level.minKg && currentKg <= level.maxKg) ?? levels[levels.length - 1];
  const nextLevel = levels.find((level) => level.minKg > currentKg);
  const levelProgress = getLevelProgress(currentKg);

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
              {level.name}
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
            {nextLevel ? <>다음 단계는 <b>{nextLevel.name}</b>입니다.</> : "현재 최고 단계입니다."}
          </p>
        </div>

        <LevelGauge levelProgress={levelProgress} className="level-page-gauge" />

        <span>{nextLevel ? `다음 레벨까지 ${levelProgress.remainingKg}kg 남았어요.` : "최고 레벨 구간입니다."}</span>
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
