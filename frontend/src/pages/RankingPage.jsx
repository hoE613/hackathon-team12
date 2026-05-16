import { rankings } from "../data/dummyData";

export default function RankingPage() {
  return (
    <section className="panel ranking-page">
      <h1>랭킹 페이지</h1>

      <div className="podium ranking-podium">
        {rankings.slice(0, 3).map((r, i) => (
          <div
            className={"podium-card " + (i === 0 ? "big" : "small")}
            key={r.name}
          >
            <span>{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>

            <b>{r.name}</b>

            <em>{r.kg}kg</em>
          </div>
        ))}
      </div>

      <div className="ranking-list">
        {rankings.map((r, i) => (
          <div key={r.name}>
            <b>{i + 1}</b>

            <span>{r.icon}</span>

            <strong>{r.name}</strong>

            <em>{r.kg}kg</em>
          </div>
        ))}
      </div>
    </section>
  );
}
