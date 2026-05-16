import { useNavigate } from "react-router-dom";

export default function ReviewWritePage() {
  const navigate = useNavigate();

  return (
    <section className="panel form-page">
      <h1>게시글 작성</h1>

      <p>자유롭게 맛집 정보, 질문, 추천 글을 작성하는 페이지입니다.</p>

      <label>
        게시글 제목
        <input placeholder="제목을 입력해주세요" />
      </label>

      <label>
        게시글 유형
        <select>
          <option>자유글</option>
          <option>맛집 추천</option>
          <option>질문</option>
          <option>같이 먹어요</option>
        </select>
      </label>

      <label>
        내용
        <textarea placeholder="게시글 내용을 입력해주세요" />
      </label>

      <label>
        관련 맛집 선택
        <input placeholder="관련 맛집을 입력하거나 검색해주세요" />
      </label>

      <label>
        태그
        <input placeholder="#가성비 #혼밥 #데이트" />
      </label>

      <div className="photo-row">
        <span>🖼️</span>
        <span>🍽️</span>
        <span>📷</span>
        <button>＋</button>
      </div>

      <label className="file-box">📎 사진 첨부</label>

      <button className="primary" onClick={() => navigate("/")}>
        등록
      </button>
    </section>
  );
}
