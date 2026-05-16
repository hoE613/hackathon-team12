import { fullRankings } from "../data/dummyData";

export default function RankingPage() {
  const topThree = fullRankings.slice(0, 3);

  return (
    <section className="ranking-page hall-of-fame-page">
      <div className="hall-header">
        <span>🏆 Hall of Fame</span>
        <h1>쩝쩝 명예의 전당</h1>
        <p>100위까지 확인할 수 있는 전체 리뷰어 랭킹입니다.</p>
      </div>

      <div className="hall-podium">
        <div className="hall-player second-place">
          <div className="hall-avatar">🥈</div>
          <strong>{topThree[1].name}</strong>
          <b>{topThree[1].kg}kg</b>
          <span>2위</span>
        </div>

        <div className="hall-player first-place">
          <div className="hall-crown">👑</div>
          <div className="hall-avatar">🥇</div>
          <strong>{topThree[0].name}</strong>
          <b>{topThree[0].kg}kg</b>
          <span>1위</span>
        </div>

        <div className="hall-player third-place">
          <div className="hall-avatar">🥉</div>
          <strong>{topThree[2].name}</strong>
          <b>{topThree[2].kg}kg</b>
          <span>3위</span>
        </div>
      </div>

      <div className="hall-board">
        <div className="hall-board-title">
          <h2>전체 랭킹</h2>
          <span>TOP 100</span>
        </div>

        <div className="hall-ranking-scroll">
          {fullRankings.map((r) => (
            <button className={`hall-row rank-${r.rank}`} key={r.rank}>
              <div className="hall-rank-number">{r.rank}</div>

              <div className="hall-user">
                <span>{r.icon}</span>
                <strong>{r.name}</strong>
              </div>

              <div className="hall-score">{r.kg}kg</div>
            </button>
          ))}
        </div>

        <p className="hall-note">
          상위권 리뷰어일수록 추천 수, 신뢰도, 활동량이 높게 반영됩니다.
        </p>
      </div>
    </section>
  );
}
