import { useEffect, useMemo, useState } from "react";
import { accessTokenKey, apiBaseUrl, apiRequest, refreshTokenKey } from "./api/client";
import type { ApiPost, ApiPostDetail, ApiReview, ApiUser, SeedResponse } from "./types";

export default function App() {
  const [seed, setSeed] = useState<SeedResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(() => localStorage.getItem(accessTokenKey));
  const [refreshToken, setRefreshToken] = useState<string | null>(() => localStorage.getItem(refreshTokenKey));
  const [me, setMe] = useState<ApiUser | null>(null);
  const [authStatus, setAuthStatus] = useState<string>("");
  const [loginCode, setLoginCode] = useState("demo");
  const [loginNickname, setLoginNickname] = useState("해커톤유저");
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [postStatus, setPostStatus] = useState<string>("");
  const [selectedPostId, setSelectedPostId] = useState<string>("");
  const [postDetail, setPostDetail] = useState<ApiPostDetail | null>(null);
  const [reviews, setReviews] = useState<ApiReview[]>([]);
  const [newPost, setNewPost] = useState({
    restaurantId: "rest_001",
    categoryId: "western",
    title: "",
    content: "",
    photos: ""
  });
  const [newReview, setNewReview] = useState({ rating: 5, content: "", photos: "" });
  const [aiStatus, setAiStatus] = useState<string>("");
  const [aiResult, setAiResult] = useState<string>("");
  const [aiForm, setAiForm] = useState({
    intent: "점심",
    budget: "15000",
    category: "japanese",
    lat: "37.45",
    lng: "127.12"
  });

  useEffect(() => {
    fetch(`${apiBaseUrl}/api/seed`)
      .then((response) => response.json())
      .then((json: SeedResponse) => setSeed(json))
      .catch(() => setSeed(null))
      .finally(() => setLoading(false));
  }, []);

  const categoryOptions = useMemo(() => seed?.categories ?? [], [seed]);

  const handleLogin = async () => {
    setAuthStatus("로그인 중...");
    try {
      const result = await apiRequest<{
        access_token: string;
        refresh_token: string;
        user: ApiUser;
      }>("/auth/gachon/login", {
        method: "POST",
        body: JSON.stringify({
          code: loginCode,
          nickname: loginNickname
        })
      });
      localStorage.setItem(accessTokenKey, result.access_token);
      localStorage.setItem(refreshTokenKey, result.refresh_token);
      setAccessToken(result.access_token);
      setRefreshToken(result.refresh_token);
      setMe(result.user);
      setAuthStatus("로그인 완료");
    } catch (error) {
      setAuthStatus(`로그인 실패: ${(error as Error).message}`);
    }
  };

  const handleFetchMe = async () => {
    if (!accessToken) {
      setAuthStatus("토큰이 없습니다.");
      return;
    }
    setAuthStatus("내 정보 조회 중...");
    try {
      const result = await apiRequest<ApiUser>("/users/me", { method: "GET" }, accessToken);
      setMe(result);
      setAuthStatus("내 정보 갱신 완료");
    } catch (error) {
      setAuthStatus(`내 정보 실패: ${(error as Error).message}`);
    }
  };

  const handleLogout = async () => {
    if (!refreshToken) {
      setAuthStatus("refresh_token 없음");
      return;
    }
    try {
      await apiRequest("/auth/logout", {
        method: "POST",
        body: JSON.stringify({ refresh_token: refreshToken })
      }, accessToken);
    } catch {
      // Ignore logout errors.
    }
    localStorage.removeItem(accessTokenKey);
    localStorage.removeItem(refreshTokenKey);
    setAccessToken(null);
    setRefreshToken(null);
    setMe(null);
    setAuthStatus("로그아웃 완료");
  };

  const loadPosts = async () => {
    setPostStatus("게시글 로딩 중...");
    try {
      const result = await apiRequest<{ posts: ApiPost[] }>("/posts?limit=8&sort=popular", { method: "GET" });
      setPosts(result.posts);
      setPostStatus("게시글 로딩 완료");
    } catch (error) {
      setPostStatus(`게시글 실패: ${(error as Error).message}`);
    }
  };

  const loadPostDetail = async (postId: string) => {
    setSelectedPostId(postId);
    setPostStatus("상세 로딩 중...");
    try {
      const detail = await apiRequest<ApiPostDetail>(`/posts/${postId}`, { method: "GET" });
      const reviewResult = await apiRequest<{ reviews: ApiReview[] }>(`/posts/${postId}/reviews`, { method: "GET" });
      setPostDetail(detail);
      setReviews(reviewResult.reviews);
      setPostStatus("상세 로딩 완료");
    } catch (error) {
      setPostStatus(`상세 실패: ${(error as Error).message}`);
    }
  };

  const handleCreatePost = async () => {
    if (!accessToken) {
      setPostStatus("로그인 필요");
      return;
    }
    setPostStatus("게시글 생성 중...");
    try {
      const photos = newPost.photos
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const result = await apiRequest<{ postId: string }>("/posts", {
        method: "POST",
        body: JSON.stringify({
          restaurant_id: newPost.restaurantId,
          category_id: newPost.categoryId,
          title: newPost.title,
          content: newPost.content,
          photos
        })
      }, accessToken);
      setPostStatus(`생성 완료: ${result.postId}`);
      setNewPost({ ...newPost, title: "", content: "", photos: "" });
      loadPosts();
    } catch (error) {
      setPostStatus(`생성 실패: ${(error as Error).message}`);
    }
  };

  const handleCreateReview = async () => {
    if (!accessToken) {
      setPostStatus("로그인 필요");
      return;
    }
    if (!selectedPostId) {
      setPostStatus("게시글 선택 필요");
      return;
    }
    setPostStatus("리뷰 작성 중...");
    try {
      const photos = newReview.photos
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      await apiRequest(`/posts/${selectedPostId}/reviews`, {
        method: "POST",
        body: JSON.stringify({
          rating: newReview.rating,
          content: newReview.content,
          photos
        })
      }, accessToken);
      setNewReview({ rating: 5, content: "", photos: "" });
      loadPostDetail(selectedPostId);
    } catch (error) {
      setPostStatus(`리뷰 실패: ${(error as Error).message}`);
    }
  };

  const handleAiRecommend = async () => {
    if (!accessToken) {
      setAiStatus("로그인 필요");
      return;
    }
    setAiStatus("AI 추천 요청 중...");
    try {
      const body = {
        intent: aiForm.intent,
        budget: Number(aiForm.budget) || undefined,
        filters: aiForm.category ? [{ field: "category", value: aiForm.category }] : [],
        location: aiForm.lat && aiForm.lng ? { lat: Number(aiForm.lat), lng: Number(aiForm.lng) } : undefined
      };
      const result = await apiRequest<{ candidates: Array<{ id: string; score: number; reason: string }>; meta: Record<string, unknown> }>(
        "/ai/recommendations",
        {
          method: "POST",
          body: JSON.stringify(body)
        },
        accessToken
      );
      setAiResult(JSON.stringify(result, null, 2));
      setAiStatus("AI 추천 완료");
    } catch (error) {
      setAiStatus(`AI 실패: ${(error as Error).message}`);
    }
  };

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">쩝</div>
          <div>
            <p className="eyebrow">JjepjepSecretary</p>
            <h1>쩝쩝비서</h1>
          </div>
        </div>

        <section className="hero-card">
          <p className="hero-label">상황 맞춤형 추천</p>
          <h2>지금 땡기는 맛집, Kg 기반으로 골라주는 AI 비서</h2>
          <p>
            가천아이디 · 카카오로그인 · 추천 글 · 사진 리뷰 · 카테고리 랭킹을 하나의
            흐름으로 묶었습니다.
          </p>
        </section>

        <section className="status-card">
          <div>
            <span>Backend</span>
            <strong>{loading ? "연결 중" : "연결 완료"}</strong>
          </div>
          <div>
            <span>Port</span>
            <strong>4000 / 5173</strong>
          </div>
          <div>
            <span>Score</span>
            <strong>kg_score</strong>
          </div>
        </section>
      </aside>

      <main className="content">
        <header className="topbar">
          <div>
            <p className="section-label">Main Feed</p>
            <h2>오늘의 추천과 랭킹</h2>
          </div>
          <button className="primary-button" onClick={handleAiRecommend}>쩝쩝비서에게 물어보기</button>
        </header>

        <section className="grid two">
          <article className="panel accent">
            <div className="panel-head">
              <h3>카테고리</h3>
              <span>양식 · 중식 · 일식 · 술집</span>
            </div>
            <div className="chips">
              {seed?.categories.map((category) => (
                <div key={category.id} className="chip">
                  <strong>{category.name}</strong>
                  <span>{category.postCount} posts</span>
                </div>
              ))}
            </div>
          </article>

          <article className="panel">
            <div className="panel-head">
              <h3>유저 랭킹</h3>
              <span>Kg 기반 타이틀</span>
            </div>
            <div className="ranking-list">
              {seed?.rankings.map((item) => (
                <div key={item.nickname} className="ranking-row">
                  <div>
                    <strong>#{item.rank} {item.nickname}</strong>
                    <p>{item.title}</p>
                  </div>
                  <span>{item.kgScore} kg</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid two">
          <article className="panel">
            <div className="panel-head">
              <h3>인기 맛집 글</h3>
              <span>사진 리뷰와 함께</span>
            </div>
            <div className="post-list">
              {seed?.posts.map((post) => (
                <div key={post.id} className="post-card">
                  <div className="post-meta">
                    <strong>{post.title}</strong>
                    <span>{post.restaurantName}</span>
                  </div>
                  <p>{post.summary}</p>
                  <div className="post-stats">
                    <span>평점 {post.averageRating}</span>
                    <span>리뷰 {post.reviewCount}</span>
                    <span>Kg {post.kgScore}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="panel accent-soft">
            <div className="panel-head">
              <h3>쩝쩝비서 추천</h3>
              <span>Gemini 연동 예정</span>
            </div>
            <div className="recommendation-list">
              {seed?.aiRecommendations.map((item) => (
                <div key={item.id} className="recommendation-card">
                  <div className="recommendation-header">
                    <strong>{item.name}</strong>
                    <span>{item.distanceKm} km</span>
                  </div>
                  <p>{item.reason}</p>
                  <div className="recommendation-footer">
                    <span>{item.category}</span>
                    <span>confidence {Math.round(item.confidence * 100)}%</span>
                    <span>평점 {item.averageRating}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid two">
          <article className="panel">
            <div className="panel-head">
              <h3>로그인 / 내 정보</h3>
              <span>{authStatus || "인증 상태"}</span>
            </div>
            <div className="post-list">
              <label>
                로그인 코드
                <input value={loginCode} onChange={(event) => setLoginCode(event.target.value)} placeholder="demo" />
              </label>
              <label>
                닉네임
                <input value={loginNickname} onChange={(event) => setLoginNickname(event.target.value)} />
              </label>
              <div>
                <button className="primary-button" onClick={handleLogin}>로그인</button>
                <button onClick={handleFetchMe}>내 정보 갱신</button>
                <button onClick={handleLogout}>로그아웃</button>
              </div>
              {me && (
                <div>
                  <strong>{me.nickname}</strong>
                  <p>Kg {me.kg_score} · Trust {me.trust_score} · {me.title}</p>
                </div>
              )}
            </div>
          </article>

          <article className="panel">
            <div className="panel-head">
              <h3>게시글 목록</h3>
              <span>{postStatus || "목록 상태"}</span>
            </div>
            <div className="post-list">
              <button onClick={loadPosts}>게시글 불러오기</button>
              {posts.map((post) => (
                <div key={post.id} className="post-card">
                  <div className="post-meta">
                    <strong>{post.title}</strong>
                    <span>{post.restaurant_name}</span>
                  </div>
                  <p>{post.content}</p>
                  <div className="post-stats">
                    <span>평점 {post.average_rating}</span>
                    <span>리뷰 {post.review_count}</span>
                  </div>
                  <button onClick={() => loadPostDetail(post.id)}>상세 보기</button>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="grid two">
          <article className="panel">
            <div className="panel-head">
              <h3>게시글 작성</h3>
              <span>로그인 필요</span>
            </div>
            <div className="post-list">
              <label>
                restaurant_id
                <input value={newPost.restaurantId} onChange={(event) => setNewPost({ ...newPost, restaurantId: event.target.value })} />
              </label>
              <label>
                category_id
                <select value={newPost.categoryId} onChange={(event) => setNewPost({ ...newPost, categoryId: event.target.value })}>
                  {categoryOptions.map((category) => (
                    <option key={category.id} value={category.id}>{category.id}</option>
                  ))}
                </select>
              </label>
              <label>
                title
                <input value={newPost.title} onChange={(event) => setNewPost({ ...newPost, title: event.target.value })} />
              </label>
              <label>
                content
                <textarea value={newPost.content} onChange={(event) => setNewPost({ ...newPost, content: event.target.value })} />
              </label>
              <label>
                photos (comma)
                <input value={newPost.photos} onChange={(event) => setNewPost({ ...newPost, photos: event.target.value })} />
              </label>
              <button onClick={handleCreatePost}>작성</button>
            </div>
          </article>

          <article className="panel">
            <div className="panel-head">
              <h3>게시글 상세/리뷰</h3>
              <span>{selectedPostId || "게시글 선택"}</span>
            </div>
            <div className="post-list">
              {postDetail ? (
                <div className="post-card">
                  <strong>{postDetail.post.title}</strong>
                  <p>{postDetail.post.content}</p>
                  <p>작성자: {postDetail.author?.nickname ?? "unknown"}</p>
                  <p>평점 {postDetail.avg_rating} · 리뷰 {postDetail.review_count}</p>
                </div>
              ) : (
                <p>상세를 불러오려면 게시글을 선택하세요.</p>
              )}

              <div>
                <strong>리뷰 목록</strong>
                {reviews.map((review) => (
                  <div key={review.id} className="ranking-row">
                    <div>
                      <strong>{review.user_id}</strong>
                      <p>{review.content}</p>
                    </div>
                    <span>{review.rating}점</span>
                  </div>
                ))}
              </div>

              <div>
                <strong>리뷰 작성</strong>
                <label>
                  rating
                  <input type="number" value={newReview.rating} onChange={(event) => setNewReview({ ...newReview, rating: Number(event.target.value) })} min={1} max={5} />
                </label>
                <label>
                  content
                  <textarea value={newReview.content} onChange={(event) => setNewReview({ ...newReview, content: event.target.value })} />
                </label>
                <label>
                  photos (comma)
                  <input value={newReview.photos} onChange={(event) => setNewReview({ ...newReview, photos: event.target.value })} />
                </label>
                <button onClick={handleCreateReview}>리뷰 작성</button>
              </div>
            </div>
          </article>
        </section>

        <section className="grid two">
          <article className="panel">
            <div className="panel-head">
              <h3>AI 추천 요청</h3>
              <span>{aiStatus || "AI 상태"}</span>
            </div>
            <div className="post-list">
              <label>
                intent
                <input value={aiForm.intent} onChange={(event) => setAiForm({ ...aiForm, intent: event.target.value })} />
              </label>
              <label>
                budget
                <input value={aiForm.budget} onChange={(event) => setAiForm({ ...aiForm, budget: event.target.value })} />
              </label>
              <label>
                category filter
                <input value={aiForm.category} onChange={(event) => setAiForm({ ...aiForm, category: event.target.value })} />
              </label>
              <label>
                lat
                <input value={aiForm.lat} onChange={(event) => setAiForm({ ...aiForm, lat: event.target.value })} />
              </label>
              <label>
                lng
                <input value={aiForm.lng} onChange={(event) => setAiForm({ ...aiForm, lng: event.target.value })} />
              </label>
              <button onClick={handleAiRecommend}>AI 추천 호출</button>
              {aiResult && (
                <pre>{aiResult}</pre>
              )}
            </div>
          </article>
        </section>
      </main>
    </div>
  );
}
