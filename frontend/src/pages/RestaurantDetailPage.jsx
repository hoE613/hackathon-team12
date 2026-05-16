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
  const { accessToken, user, refreshMe } = useAuth();
  const [detail, setDetail] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewForm, setReviewForm] = useState({ rating: 5, content: "" });
  const [status, setStatus] = useState("");
  const [isScrapped, setIsScrapped] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [isPostMenuOpen, setIsPostMenuOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

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

  useEffect(() => {
    if (!accessToken || !id) {
      setIsScrapped(false);
      setIsLiked(false);
      return;
    }

    Promise.all([
      apiRequest("/users/clip", { method: "GET" }, accessToken),
      apiRequest("/users/recommended", { method: "GET" }, accessToken),
    ])
      .then(([clipResult, recommendedResult]) => {
        setIsScrapped((clipResult.clips ?? []).some((clip) => clip.post_id === id));
        setIsLiked((recommendedResult.recommended ?? []).some((item) => item.post_id === id));
      })
      .catch(() => {
        setIsScrapped(false);
        setIsLiked(false);
      });
  }, [accessToken, id]);

  const post = detail?.post;
  const author = detail?.author;
  const heroImage = post?.photos?.[0] || `https://picsum.photos/seed/${id}/900/520`;
  const isOwnPost = user?.id && author?.id === user.id;

  const handleLike = async () => {
    if (!accessToken || !post) return;
    try {
      const method = isLiked ? "DELETE" : "POST";
      const result = await apiRequest(`/posts/${post.id}/like`, { method }, accessToken);
      setIsLiked(!isLiked);
      setDetail((prev) => prev ? { ...prev, like_count: result.likeCount ?? prev.like_count } : prev);
      await refreshMe();
      setStatus(isLiked ? "추천을 취소했습니다." : "추천한 글에 추가했습니다.");
      loadDetail();
    } catch (error) {
      setStatus(`추천 실패: ${error.message}`);
    }
  };

  const handleScrap = async () => {
    if (!accessToken || !post) return;
    try {
      const method = isScrapped ? "DELETE" : "POST";
      await apiRequest(`/posts/${post.id}/scrap`, { method }, accessToken);
      setIsScrapped(!isScrapped);
      await refreshMe();
      setStatus(isScrapped ? "북마크를 취소했습니다." : "북마크 완료");
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

  const startEditPost = () => {
    if (!post) return;
    setEditForm({
      title: post.title ?? "",
      content: post.content ?? "",
    });
    setIsPostMenuOpen(false);
  };

  const savePostEdit = async () => {
    if (!accessToken || !post || !editForm) return;

    try {
      await apiRequest(
        `/posts/${post.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: editForm.title,
            content: editForm.content,
          }),
        },
        accessToken
      );
      setEditForm(null);
      await loadDetail();
      setStatus("게시글을 수정했습니다.");
    } catch (error) {
      setStatus(`수정 실패: ${error.message}`);
    }
  };

  const deletePost = async () => {
    if (!accessToken || !post) return;

    const confirmed = window.confirm("이 게시글을 삭제할까요?");
    if (!confirmed) return;

    try {
      await apiRequest(`/posts/${post.id}`, { method: "DELETE" }, accessToken);
      await refreshMe();
      navigate("/posts", { replace: true });
    } catch (error) {
      setStatus(`삭제 실패: ${error.message}`);
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

        <button
          className={`floating bookmark detail-bookmark-button ${isScrapped ? "active" : ""}`}
          onClick={handleScrap}
          aria-label={isScrapped ? "북마크 취소" : "북마크"}
          aria-pressed={isScrapped}
        >
          <Bookmark fill={isScrapped ? "currentColor" : "none"} />
        </button>

        <div className="detail-more-wrap">
          <button
            className="floating more"
            onClick={() => {
              if (!isOwnPost) {
                setStatus("내가 쓴 글만 수정하거나 삭제할 수 있습니다.");
                return;
              }
              setIsPostMenuOpen((current) => !current);
            }}
            aria-label="게시글 메뉴"
            aria-expanded={isPostMenuOpen}
          >
            <MoreHorizontal />
          </button>

          {isPostMenuOpen && isOwnPost && (
            <div className="post-menu detail-post-menu">
              <button onClick={startEditPost}>수정하기</button>
              <button className="danger" onClick={deletePost}>삭제하기</button>
            </div>
          )}
        </div>

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

        {editForm ? (
          <article className="detail-edit-form">
            <label>
              <span>제목</span>
              <input
                value={editForm.title}
                onChange={(event) => setEditForm((prev) => ({ ...prev, title: event.target.value }))}
              />
            </label>
            <label>
              <span>내용</span>
              <textarea
                value={editForm.content}
                onChange={(event) => setEditForm((prev) => ({ ...prev, content: event.target.value }))}
              />
            </label>
            <div>
              <button className="primary" onClick={savePostEdit}>저장</button>
              <button onClick={() => setEditForm(null)}>취소</button>
            </div>
          </article>
        ) : (
          <>
            {post.title && <h2 className="detail-post-title">{post.title}</h2>}
            <p className="desc">
              {post.content}
            </p>
          </>
        )}

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
          <article className="detail-review review-write-card">
            <div className="reviewer">
              <b>리뷰 작성</b>
            </div>
            <div className="rating-input-row">
              <span>평점</span>
              <div className="half-star-rating" aria-label={`평점 ${reviewForm.rating}점`}>
                {[1, 2, 3, 4, 5].map((star) => {
                  const fill = Number(reviewForm.rating) >= star ? 100 : Number(reviewForm.rating) >= star - 0.5 ? 50 : 0;

                  return (
                    <span className="star-control" key={star}>
                      <span className="star-icon" style={{ "--fill": `${fill}%` }}>★</span>
                      <button
                        type="button"
                        aria-label={`${star - 0.5}점`}
                        onClick={() => setReviewForm((prev) => ({ ...prev, rating: star - 0.5 }))}
                      />
                      <button
                        type="button"
                        aria-label={`${star}점`}
                        onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}
                      />
                    </span>
                  );
                })}
              </div>
              <strong>{reviewForm.rating}점</strong>
            </div>
            <label className="review-content-field">
              <span>내용</span>
              <textarea
                value={reviewForm.content}
                onChange={(event) => setReviewForm((prev) => ({ ...prev, content: event.target.value }))}
                placeholder="리뷰 내용을 입력하세요"
              />
            </label>
            <button className="primary review-submit-button" onClick={handleReview}>리뷰 등록</button>
          </article>
        )}

        <div className="detail-actions">
          <button className={`primary like-toggle-button ${isLiked ? "active" : ""}`} onClick={handleLike}>
            {isLiked ? "추천 취소" : "추천하기"} {detail.like_count}
          </button>

          <button
            className={`detail-bookmark-button ${isScrapped ? "active" : ""}`}
            onClick={handleScrap}
            aria-label={isScrapped ? "북마크 취소" : "북마크"}
            aria-pressed={isScrapped}
          >
            <Bookmark fill={isScrapped ? "currentColor" : "none"} />
          </button>
        </div>
      </section>
    </div>
  );
}
