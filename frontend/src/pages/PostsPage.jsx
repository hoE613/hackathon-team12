import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const types = ["맛집 추천", "질문", "같이 먹어요", "자유글"];

const authors = ["쩝쩝박사", "미식탐험가", "맛집헌터", "학식러버", "가성비왕"];

const titles = [
  "가성비 좋은 한식집 추천합니다",
  "혼밥하기 좋은 곳 있을까요?",
  "오늘 저녁 같이 먹을 사람?",
  "카페 포근 디저트 괜찮네요",
  "가천대역 근처 야식 추천받아요",
  "데이트하기 좋은 양식집 있나요?",
  "분식 맛집 공유합니다",
  "점심시간 웨이팅 적은 곳 추천",
  "조용히 공부하기 좋은 카페",
  "매운 음식 잘하는 곳 있나요?",
];

const posts = Array.from({ length: 80 }, (_, index) => {
  const id = index + 1;
  const type = types[index % types.length];

  return {
    id,
    title: titles[index % titles.length],
    type,
    author: authors[index % authors.length],
    content:
      "가천대 주변 맛집 정보와 추천 내용을 공유하는 게시글입니다. 댓글로 의견 남겨주세요.",
    tag:
      type === "맛집 추천"
        ? "#가성비 #한식"
        : type === "질문"
        ? "#질문 #추천"
        : type === "같이 먹어요"
        ? "#같이먹어요 #모집"
        : "#자유글 #맛집",
    bookmarked: index % 5 === 0,
  };
});

export default function PostsPage() {
  const navigate = useNavigate();

  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage, setPostsPerPage] = useState(12);
  const [bookmarkedPosts, setBookmarkedPosts] = useState(
    posts.filter((post) => post.bookmarked).map((post) => post.id)
  );

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

  const totalPages = Math.ceil(posts.length / postsPerPage);

  const currentPosts = useMemo(() => {
    const start = (currentPage - 1) * postsPerPage;
    return posts.slice(start, start + postsPerPage);
  }, [currentPage, postsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const toggleBookmark = (postId) => {
    setBookmarkedPosts((prev) =>
      prev.includes(postId)
        ? prev.filter((id) => id !== postId)
        : [...prev, postId]
    );
  };

  return (
    <section className="panel posts-page">
      <div className="posts-header">
        <div>
          <h1>게시글</h1>
          <p>맛집 정보, 질문, 추천 글을 자유롭게 확인하는 페이지입니다.</p>
        </div>
      </div>

      <div className="posts-list">
        {currentPosts.map((post) => {
          const isBookmarked = bookmarkedPosts.includes(post.id);

          return (
            <article className="post-card" key={post.id}>
              <div className="post-card-top">
                <span>{post.type}</span>

                <button
                  className={`bookmark-button ${isBookmarked ? "active" : ""}`}
                  aria-label="북마크"
                  onClick={() => toggleBookmark(post.id)}
                >
                  {isBookmarked ? "★" : "☆"}
                </button>
              </div>

              <h2>{post.title}</h2>

              <p>{post.content}</p>

              <div className="post-meta">
                <b>{post.author}</b>
                <em>{post.tag}</em>
              </div>
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
