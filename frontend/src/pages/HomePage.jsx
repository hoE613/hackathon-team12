import { useNavigate } from "react-router-dom";

import {
  CategoryStrip,
  ReviewRankingList,
  RightSidebar,
} from "../components/Cards.jsx";

import { restaurants } from "../data/dummyData";

export default function HomePage() {
  const navigate = useNavigate();

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
                <img src={restaurants[0].image} alt="미식의 신" />
              </div>

              <div className="winner-box">
                <div>
                  <span className="winner-rank">2</span>
                  <b>미식의 신</b>
                </div>
                <strong>98kg</strong>
              </div>
            </button>

            <button
              className="podium-winner first"
              onClick={() => navigate("/my/profile")}
            >
              <div className="winner-food">
                <span className="winner-crown gold">♛</span>
                <img src={restaurants[1].image} alt="쩝쩝박사" />
              </div>

              <div className="winner-box">
                <div>
                  <span className="winner-rank">1</span>
                  <b>쩝쩝박사</b>
                </div>
                <strong>128kg</strong>
              </div>
            </button>

            <button
              className="podium-winner third"
              onClick={() => navigate("/my/profile")}
            >
              <div className="winner-food">
                <span className="winner-crown bronze">♛</span>
                <img src={restaurants[4].image} alt="맛집헌터" />
              </div>

              <div className="winner-box">
                <div>
                  <span className="winner-rank">3</span>
                  <b>맛집헌터</b>
                </div>
                <strong>76kg</strong>
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
