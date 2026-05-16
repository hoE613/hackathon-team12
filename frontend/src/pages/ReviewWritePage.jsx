import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";

const restaurantOptions = [
  { id: "rest_001", name: "오므라이스 연구소" },
  { id: "rest_002", name: "스시 하루" },
  { id: "rest_003", name: "광진구 스시 바" },
];

export default function ReviewWritePage() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    title: "",
    category_id: "western",
    content: "",
    restaurant_id: "rest_001",
    photos: "",
  });
  const [status, setStatus] = useState("");

  useEffect(() => {
    apiRequest("/categories")
      .then((result) => {
        const nextCategories = result.categories ?? [];
        setCategories(nextCategories);
        if (nextCategories[0]) {
          setForm((prev) => ({ ...prev, category_id: nextCategories[0].id }));
        }
      })
      .catch(() => setCategories([]));
  }, []);

  const updateForm = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSuggestCategory = async () => {
    if (!accessToken || !form.content.trim()) return;
    try {
      const result = await apiRequest(
        "/ai/content/category",
        { method: "POST", body: JSON.stringify({ text: `${form.title} ${form.content}` }) },
        accessToken
      );
      if (result.category_id) {
        updateForm("category_id", result.category_id);
        setStatus(`AI 추천 카테고리: ${result.category_id}`);
      }
    } catch (error) {
      setStatus(`AI 분류 실패: ${error.message}`);
    }
  };

  const handleSubmit = async () => {
    if (!accessToken) {
      setStatus("로그인이 필요합니다.");
      return;
    }
    setStatus("게시글 등록 중...");
    try {
      const photos = form.photos
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const result = await apiRequest(
        "/posts",
        {
          method: "POST",
          body: JSON.stringify({
            restaurant_id: form.restaurant_id,
            category_id: form.category_id,
            title: form.title,
            content: form.content,
            photos,
          }),
        },
        accessToken
      );
      navigate(`/restaurant/${result.postId}`);
    } catch (error) {
      setStatus(`등록 실패: ${error.message}`);
    }
  };

  return (
    <section className="panel form-page">
      <h1>게시글 작성</h1>

      <p>{status || "자유롭게 맛집 정보, 질문, 추천 글을 작성하는 페이지입니다."}</p>

      <label>
        게시글 제목
        <input value={form.title} onChange={(event) => updateForm("title", event.target.value)} placeholder="제목을 입력해주세요" />
      </label>

      <label>
        카테고리
        <select value={form.category_id} onChange={(event) => updateForm("category_id", event.target.value)}>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </label>

      <label>
        내용
        <textarea value={form.content} onChange={(event) => updateForm("content", event.target.value)} placeholder="게시글 내용을 입력해주세요" />
      </label>

      <label>
        관련 맛집 선택
        <select value={form.restaurant_id} onChange={(event) => updateForm("restaurant_id", event.target.value)}>
          {restaurantOptions.map((restaurant) => (
            <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>
          ))}
        </select>
      </label>

      <label>
        사진 URL
        <input value={form.photos} onChange={(event) => updateForm("photos", event.target.value)} placeholder="쉼표로 여러 URL 입력" />
      </label>

      <div className="photo-row">
        <span>🖼️</span>
        <span>🍽️</span>
        <span>📷</span>
        <button type="button" onClick={handleSuggestCategory}>AI 카테고리 추천</button>
      </div>

      <label className="file-box">📎 사진 첨부</label>

      <button className="primary" onClick={handleSubmit}>
        등록
      </button>
    </section>
  );
}
