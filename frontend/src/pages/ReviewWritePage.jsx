import { useNavigate } from "react-router-dom";

export default function ReviewWritePage() {
  const navigate = useNavigate();

  return (
    <section className="panel form-page">
      <h1>글 작성</h1>

      <p>백엔드 연결 전까지는 입력 화면만 구성합니다.</p>

      <div className="photo-row">
        <span>🍽️</span>
        <span>🍝</span>
        <span>🥘</span>

        <button>＋</button>
      </div>

      <label>
        가게 이름
        <input placeholder="가게 이름을 입력해주세요" />
      </label>

      <label>
        카테고리
        <select>
          <option>한식</option>
          <option>양식</option>
          <option>카페</option>
        </select>
      </label>

      <label>
        위치
        <input placeholder="가천대역 근처" />
      </label>

      <label>
        별점
        <div className="stars">★★★★★</div>
      </label>

      <label>
        추천 이유
        <textarea placeholder="맛집에 대한 추천 이유를 작성해주세요 :)" />
      </label>

      <label className="file-box">📷 영수증 인증 / 사진 업로드</label>

      <button className="primary" onClick={() => navigate("/")}>
        등록
      </button>
    </section>
  );
}
