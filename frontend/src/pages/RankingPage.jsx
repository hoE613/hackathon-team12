import { useEffect, useState } from "react";
import { apiRequest } from "../api/client.js";

export default function RankingPage() {
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    apiRequest("/rankings/users")
      .then((result) => setRankings(result.rankings ?? []))
      .catch(() => setRankings([]));
  }, []);

  const fullRankings = rankings.length > 0 ? rankings : [
    { rank: 1, nickname: "쩝쩝박사", kgScore: 100, title: "쩝신" },
    { rank: 2, nickname: "미식의 신", kgScore: 90, title: "총장" },
    { rank: 3, nickname: "맛집헌터", kgScore: 76, title: "총장" },
  ];
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
          <strong>{topThree[1]?.nickname}</strong>
          <b>{topThree[1]?.kgScore}kg</b>
          <span>2위</span>
        </div>

        <div className="hall-player first-place">
          <div className="hall-crown">👑</div>
          <div className="hall-avatar">🥇</div>
          <strong>{topThree[0]?.nickname}</strong>
          <b>{topThree[0]?.kgScore}kg</b>
          <span>1위</span>
        </div>

        <div className="hall-player third-place">
          <div className="hall-avatar">🥉</div>
          <strong>{topThree[2]?.nickname}</strong>
          <b>{topThree[2]?.kgScore}kg</b>
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
            <button className={`hall-row rank-${r.rank}`} key={r.userId ?? r.rank}>
              <div className="hall-rank-number">{r.rank}</div>

              <div className="hall-user">
                <span>{r.rank}</span>
                <strong>{r.nickname} {r.title}</strong>
              </div>

              <div className="hall-score">{r.kgScore}kg</div>
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
