import { useNavigate } from "react-router-dom";

import {
  CategoryStrip,
  ReviewRankingList,
  RightSidebar,
} from "../components/Cards.jsx";

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="home-layout">
      <div className="content-column">
        <section className="hero-banner">
          <div>
            <span>🏆 이번주 리뷰 랭킹</span>

            <h1>
              이번주 가장 많은 사랑을 받은
              <br />
              리뷰 TOP 3
            </h1>

            <button onClick={() => navigate("/ranking")}>전체 랭킹 보기</button>
          </div>

          <div className="podium">
            <div className="podium-card small">
              🥈
              <b>미식의 신</b>
              <span>98kg</span>
            </div>

            <div className="podium-card big">
              🥇
              <b>쩝쩝박사</b>
              <span>128kg</span>
            </div>

            <div className="podium-card small">
              🥉
              <b>맛집헌터</b>
              <span>76kg</span>
            </div>
          </div>
        </section>

        <CategoryStrip />

        <ReviewRankingList />
      </div>

      <RightSidebar />
    </div>
  );
}
