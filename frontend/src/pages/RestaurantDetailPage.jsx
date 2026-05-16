import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";

import {
  ArrowLeft,
  Bookmark,
  MoreHorizontal,
  Star,
  ThumbsUp,
  MapPin,
  ShieldCheck,
} from "lucide-react";

export default function RestaurantDetailPage() {
  const { id } = useParams();

  const navigate = useNavigate();
  const { accessToken, user } = useAuth();
  const [detail, setDetail] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: "" });
  const [status, setStatus] = useState("");

  const loadDetail = useMemo(() => async () => {
    if (!id) return;
    setStatus("상세 정보를 불러오는 중입니다.");
    try {
      const [postDetail, reviewResult] = await Promise.all([
        apiRequest(`/posts/${id}`),
        apiRequest(`/posts/${id}/reviews`),
      ]);
      setDetail(postDetail);
      setReviews(reviewResult.reviews ?? []);
      setStatus("");
    } catch (error) {
      setStatus(`상세 로딩 실패: ${error.message}`);
    }
  }, [id]);

  useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  const post = detail?.post;
  const author = detail?.author;
  const heroImage = post?.photos?.[0] || `https://picsum.photos/seed/${id}/900/520`;
  const isOwnPost = user?.id && author?.id === user.id;

  const handleLike = async () => {
    if (!accessToken || !post) return;
    try {
      await apiRequest(`/posts/${post.id}/like`, { method: "POST" }, accessToken);
      loadDetail();
    } catch (error) {
      setStatus(`추천 실패: ${error.message}`);
    }
  };

  const handleScrap = async () => {
    if (!accessToken || !post) return;
    try {
      await apiRequest(`/posts/${post.id}/scrap`, { method: "POST" }, accessToken);
      setStatus("북마크 완료");
    } catch (error) {
      setStatus(`북마크 실패: ${error.message}`);
    }
  };

  const handleReview = async () => {
    if (!accessToken || !post) {
      setStatus("로그인이 필요합니다.");
      return;
    }
    try {
      await apiRequest(
        `/posts/${post.id}/reviews`,
        {
          method: "POST",
          body: JSON.stringify({
            rating: Number(reviewForm.rating),
            content: reviewForm.content,
            photos: [],
          }),
        },
        accessToken
      );
      setReviewForm({ rating: 5, content: "" });
      loadDetail();
    } catch (error) {
      setStatus(`리뷰 작성 실패: ${error.message}`);
    }
  };

  if (!post) {
    return (
      <section className="panel detail-body">
        <button onClick={() => navigate(-1)}>뒤로</button>
        <p>{status || "게시글을 찾을 수 없습니다."}</p>
      </section>
    );
  }

  return (
    <div className="detail-page">
      <section className="detail-hero">
        <img src={heroImage} alt={post.restaurant_name} />

        <button className="floating left" onClick={() => navigate(-1)}>
          <ArrowLeft />
        </button>

        <button className="floating bookmark" onClick={handleScrap}>
          <Bookmark />
        </button>

        <button className="floating more">
          <MoreHorizontal />
        </button>

        <span className="image-count">1/6</span>
      </section>

      <section className="detail-body panel">
        <div className="detail-title">
          <div>
            <h1>{post.restaurant_name}</h1>

            <p>
              <span>{post.category_id}</span>
              <span>{author?.nickname ?? "unknown"}</span>
            </p>
          </div>

          <button onClick={() => navigate("/verified")}>
            ✅<b>인증 맛집</b>
          </button>
        </div>

        <div className="detail-meta">
          <span>
            <Star size={17} fill="currentColor" />
            {detail.avg_rating}({post.review_count})
          </span>

          <span>
            <ThumbsUp size={17} fill="currentColor" />
            {detail.like_count}
          </span>
        </div>

        <div className="location-row">
          <MapPin size={18} />
          가천대 주변

          <button onClick={() => navigate("/map")}>지도보기</button>
        </div>

        <p className="desc">
          {post.content}
        </p>

        {status && <p className="empty-state">{status}</p>}

        <h3>리뷰</h3>

        {reviews.length === 0 && <p className="empty-state">아직 등록된 리뷰가 없습니다.</p>}

        {reviews.map((review) => (
          <article className="detail-review" key={review.id}>
            <div className="reviewer">
              <b>
                {review.user_id}
                <em>{review.rating}점</em>
              </b>
            </div>

            <small>{new Date(review.created_at).toLocaleDateString("ko-KR")}</small>

            <p>{review.content}</p>

            <div>
              <ShieldCheck size={16} />
              DB 리뷰
            </div>
          </article>
        ))}

        {!isOwnPost && (
          <article className="detail-review">
            <div className="reviewer">
              <b>리뷰 작성</b>
            </div>
            <label>
              평점
              <input
                type="number"
                min="1"
                max="5"
                value={reviewForm.rating}
                onChange={(event) => setReviewForm((prev) => ({ ...prev, rating: event.target.value }))}
              />
            </label>
            <label>
              내용
              <textarea
                value={reviewForm.content}
                onChange={(event) => setReviewForm((prev) => ({ ...prev, content: event.target.value }))}
                placeholder="리뷰 내용을 입력하세요"
              />
            </label>
            <button onClick={handleReview}>리뷰 등록</button>
          </article>
        )}

        <div className="detail-actions">
          <button className="primary" onClick={handleLike}>
            추천하기 {detail.like_count}
          </button>

          <button onClick={handleScrap}>
            <Bookmark />
          </button>
        </div>
      </section>
    </div>
  );
}
