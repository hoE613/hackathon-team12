import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { CategoryStrip, RestaurantGrid } from "../components/Cards.jsx";
import { apiRequest } from "../api/client.js";

export default function CategoryPage() {
  const { id } = useParams();
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    apiRequest("/categories")
      .then((result) => setCategories(result.categories ?? []))
      .catch(() => setCategories([]));
  }, []);

  const current = categories.find((c) => c.id === id);

  return (
    <section className="panel category-page">
      <h1>{current ? `${current.icon} ${current.name}` : "카테고리"}</h1>

      <p>원하는 음식 카테고리를 선택하고 맛집을 확인하세요.</p>

      <CategoryStrip />

      <RestaurantGrid />
    </section>
  );
}
