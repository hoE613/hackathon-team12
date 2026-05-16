import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";

export default function PostsPage() {
  const navigate = useNavigate();
  const { accessToken, refreshMe } = useAuth();

  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage, setPostsPerPage] = useState(12);
  const [posts, setPosts] = useState([]);
  const [totalPosts, setTotalPosts] = useState(0);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);
  const [openMenuPostId, setOpenMenuPostId] = useState(null);
  const [editingPost, setEditingPost] = useState(null);
  const [status, setStatus] = useState("");

  useEffect(() => {
    const updatePostsPerPage = () => {
      if (window.innerWidth >= 1400) {
        setPostsPerPage(12);
      } else if (window.innerWidth >= 900) {
        setPostsPerPage(8);
      } else {
        setPostsPerPage(5);
      }
    };

    updatePostsPerPage();

    window.addEventListener("resize", updatePostsPerPage);

    return () => {
      window.removeEventListener("resize", updatePostsPerPage);
    };
  }, []);

  const loadPosts = () => {
    setStatus("게시글을 불러오는 중입니다.");
    return apiRequest(`/posts?page=${currentPage}&limit=${postsPerPage}&sort=latest`)
      .then((result) => {
        setPosts(result.posts ?? []);
        setTotalPosts(result.paging?.total ?? result.posts?.length ?? 0);
        setStatus("");
      })
      .catch((error) => setStatus(`게시글 로딩 실패: ${error.message}`));
  };

  useEffect(() => {
    loadPosts();
  }, [currentPage, postsPerPage]);

  useEffect(() => {
    if (!accessToken) {
      setBookmarkedPosts([]);
      return;
    }

    apiRequest("/users/clip", { method: "GET" }, accessToken)
      .then((result) => {
        const nextIds = (result.clips ?? [])
          .map((clip) => clip.post_id)
          .filter(Boolean);
        setBookmarkedPosts(nextIds);
      })
      .catch(() => setBookmarkedPosts([]));
  }, [accessToken]);

  const totalPages = Math.max(1, Math.ceil(totalPosts / postsPerPage));

  const currentPosts = useMemo(() => {
    return posts;
  }, [posts]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const toggleBookmark = async (postId) => {
    if (!accessToken) {
      setStatus("북마크는 로그인이 필요합니다.");
      return;
    }

    const isBookmarked = bookmarkedPosts.includes(postId);

    try {
      if (isBookmarked) {
        await apiRequest(`/posts/${postId}/scrap`, { method: "DELETE" }, accessToken);
        setBookmarkedPosts((prev) => prev.filter((id) => id !== postId));
        setStatus("북마크를 취소했습니다.");
      } else {
        await apiRequest(`/posts/${postId}/scrap`, { method: "POST" }, accessToken);
        setBookmarkedPosts((prev) => (prev.includes(postId) ? prev : [...prev, postId]));
        setStatus("북마크에 저장했습니다.");
      }
      await refreshMe();
    } catch (error) {
      if (error.message === "cannot_scrap_own_post") {
        setStatus("본인 글은 북마크할 수 없습니다.");
      } else {
        setStatus(`북마크 실패: ${error.message}`);
      }
    }
  };

  const startEdit = (post) => {
    setEditingPost({
      id: post.id,
      title: post.title,
      content: post.content,
    });
    setOpenMenuPostId(null);
  };

  const saveEdit = async () => {
    if (!accessToken || !editingPost) return;

    try {
      await apiRequest(
        `/posts/${editingPost.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            title: editingPost.title,
            content: editingPost.content,
          }),
        },
        accessToken
      );
      setEditingPost(null);
      await loadPosts();
      setStatus("게시글을 수정했습니다.");
    } catch (error) {
      setStatus(`수정 실패: ${error.message}`);
    }
  };

  const deletePost = async (postId) => {
    if (!accessToken) return;

    try {
      await apiRequest(`/posts/${postId}`, { method: "DELETE" }, accessToken);
      setOpenMenuPostId(null);
      await refreshMe();
      await loadPosts();
      setStatus("게시글을 삭제했습니다.");
    } catch (error) {
      setStatus(`삭제 실패: ${error.message}`);
    }
  };

  return (
    <section className="panel posts-page">
      <div className="posts-header">
        <div>
          <h1>게시글</h1>
          <p>{status || "맛집 정보, 질문, 추천 글을 자유롭게 확인하는 페이지입니다."}</p>
        </div>
      </div>

      <div className="posts-list">
        {currentPosts.map((post) => {
          const isBookmarked = bookmarkedPosts.includes(post.id);
          const isEditing = editingPost?.id === post.id;

          return (
            <article
              className="post-card clickable-post-card"
              key={post.id}
              onClick={() => navigate(`/restaurant/${post.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  navigate(`/restaurant/${post.id}`);
                }
              }}
            >
              <div className="post-card-top">
                <span>{post.category_id}</span>

                <div className="post-card-tools">
                  <button
                    className={`bookmark-button ${isBookmarked ? "active" : ""}`}
                    aria-label={isBookmarked ? "북마크 취소" : "북마크"}
                    aria-pressed={isBookmarked}
                    onClick={(event) => {
                      event.stopPropagation();
                      toggleBookmark(post.id);
                    }}
                  >
                    {isBookmarked ? "★" : "☆"}
                  </button>

                  <div className="post-menu-wrap">
                    <button
                      className="post-more-button"
                      aria-label="게시글 메뉴"
                      onClick={(event) => {
                        event.stopPropagation();
                        setOpenMenuPostId((current) => (current === post.id ? null : post.id));
                      }}
                    >
                      ...
                    </button>

                    {openMenuPostId === post.id && (
                      <div className="post-menu" onClick={(event) => event.stopPropagation()}>
                        <button onClick={() => startEdit(post)}>수정하기</button>
                        <button className="danger" onClick={() => deletePost(post.id)}>삭제하기</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {isEditing ? (
                <div className="post-edit-form" onClick={(event) => event.stopPropagation()}>
                  <input
                    value={editingPost.title}
                    onChange={(event) => setEditingPost((prev) => ({ ...prev, title: event.target.value }))}
                  />
                  <textarea
                    value={editingPost.content}
                    onChange={(event) => setEditingPost((prev) => ({ ...prev, content: event.target.value }))}
                  />
                  <div>
                    <button className="primary" onClick={saveEdit}>저장</button>
                    <button onClick={() => setEditingPost(null)}>취소</button>
                  </div>
                </div>
              ) : (
                <>
                  <h2>{post.title}</h2>

                  <p>{post.content}</p>

                  <div className="post-meta">
                    <b>{post.restaurant_name}</b>
                    <em>평점 {post.average_rating} · 리뷰 {post.review_count} · 추천 {post.like_count}</em>
                  </div>
                </>
              )}
            </article>
          );
        })}
      </div>

      <div className="posts-pagination">
        <button
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          이전
        </button>

        {Array.from({ length: totalPages }, (_, index) => index + 1).map(
          (page) => (
            <button
              key={page}
              className={currentPage === page ? "active" : ""}
              onClick={() => setCurrentPage(page)}
            >
              {page}
            </button>
          )
        )}

        <button
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          다음
        </button>
      </div>

      <div className="posts-write-area">
        <button
          className="primary posts-write-button"
          onClick={() => navigate("/review/new")}
        >
          게시글 작성하기
        </button>
      </div>
    </section>
  );
}
