import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  CategoryStrip,
  ReviewRankingList,
  RightSidebar,
} from "../components/Cards.jsx";

import { apiRequest } from "../api/client.js";

function podiumImage(seed) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/420/300`;
}

export default function HomePage() {
  const navigate = useNavigate();
  const [rankings, setRankings] = useState([]);

  useEffect(() => {
    apiRequest("/rankings/users")
      .then((result) => setRankings(result.rankings ?? []))
      .catch(() => setRankings([]));
  }, []);

  const topThree = rankings.length >= 3 ? rankings.slice(0, 3) : [
    { nickname: "쩝쩝박사", kgScore: 128 },
    { nickname: "미식의 신", kgScore: 98 },
    { nickname: "맛집헌터", kgScore: 76 },
  ];

  return (
    <div className="home-layout">
      <div className="content-column">
        <section className="hero-banner">
          <div className="hero-copy">
            <span>🏆 이번주 리뷰 랭킹</span>

            <h1>
              이번주 가장 많은 사랑을 받은
              <br />
              리뷰 TOP 3
            </h1>

            <button onClick={() => navigate("/ranking")}>전체 랭킹 보기</button>
          </div>

          <div className="podium-stage">
            <button
              className="podium-winner second"
              onClick={() => navigate("/my/profile")}
            >
              <div className="winner-food">
                <span className="winner-crown silver">♛</span>
                <img src={podiumImage(topThree[1].nickname)} alt={topThree[1].nickname} />
              </div>

              <div className="winner-box">
                <div>
                  <span className="winner-rank">2</span>
                  <b>{topThree[1].nickname}</b>
                </div>
                <strong>{topThree[1].kgScore}kg</strong>
              </div>
            </button>

            <button
              className="podium-winner first"
              onClick={() => navigate("/my/profile")}
            >
              <div className="winner-food">
                <span className="winner-crown gold">♛</span>
                <img src={podiumImage(topThree[0].nickname)} alt={topThree[0].nickname} />
              </div>

              <div className="winner-box">
                <div>
                  <span className="winner-rank">1</span>
                  <b>{topThree[0].nickname}</b>
                </div>
                <strong>{topThree[0].kgScore}kg</strong>
              </div>
            </button>

            <button
              className="podium-winner third"
              onClick={() => navigate("/my/profile")}
            >
              <div className="winner-food">
                <span className="winner-crown bronze">♛</span>
                <img src={podiumImage(topThree[2].nickname)} alt={topThree[2].nickname} />
              </div>

              <div className="winner-box">
                <div>
                  <span className="winner-rank">3</span>
                  <b>{topThree[2].nickname}</b>
                </div>
                <strong>{topThree[2].kgScore}kg</strong>
              </div>
            </button>
          </div>
        </section>

        <CategoryStrip />

        <ReviewRankingList />
      </div>

      <RightSidebar />
    </div>
  );
}
