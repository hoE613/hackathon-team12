import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { Bell, Search, X, Send, Sparkles, Minimize2, Menu } from "lucide-react";

export default function AppLayout() {
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantMinimized, setAssistantMinimized] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [message, setMessage] = useState("");

  const [messages, setMessages] = useState([
    {
      type: "bot",
      text: "안녕하세요! 저는 쩝쩝비서예요. 오늘 먹고 싶은 메뉴나 상황을 말해주시면 가천대 주변 맛집을 추천해드릴게요.",
    },
    {
      type: "bot",
      text: "예시: 혼밥하기 좋은 곳 추천해줘 / 가성비 좋은 한식 알려줘 / 데이트하기 좋은 카페 추천해줘",
    },
  ]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleSend = () => {
    if (!message.trim()) return;

    const userText = message.trim();

    setMessages((prev) => [
      ...prev,
      { type: "user", text: userText },
      {
        type: "bot",
        text: "현재는 백엔드 연결 전이라 임시 응답이에요. 추후 AI 추천 기능이 연결되면 입력한 조건에 맞춰 맛집, 메뉴, 거리, 신뢰도 점수를 기준으로 추천해드릴 예정입니다.",
      },
    ]);

    setMessage("");
  };

  const openAssistant = () => {
    setAssistantOpen(true);
    setAssistantMinimized(false);
  };

  const minimizeAssistant = () => {
    setAssistantMinimized(true);
  };

  const closeAssistant = () => {
    setAssistantOpen(false);
    setAssistantMinimized(false);
  };

  const goPage = (path) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="app-shell">
      <main className="main-area">
        <header className={`topbar ${scrolled ? "topbar-scrolled" : ""}`}>
          <button
            className="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="메뉴 열기"
          >
            <Menu size={22} />
          </button>

          <nav className="desktop-nav">
            <NavLink to="/" className="brand-nav-link">
              쩝쩝박사
            </NavLink>

            <NavLink to="/search">맛집</NavLink>
            <NavLink to="/ranking">랭킹</NavLink>
            <NavLink to="/posts">게시글</NavLink>
            <NavLink to="/my">마이페이지</NavLink>
          </nav>

          <button className="mobile-logo" onClick={() => navigate("/")}>
            쩝쩝박사
          </button>

          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="맛집, 메뉴, 지역을 검색해보세요"
              onFocus={() => navigate("/search")}
            />
          </div>

          <button className="icon-button" aria-label="알림">
            <Bell size={20} />
          </button>

          <button className="ai-assistant-chip" onClick={openAssistant}>
            <Sparkles size={18} />
            <span>쩝쩝비서</span>
          </button>
        </header>

        <Outlet />
      </main>

      {mobileMenuOpen && (
        <div
          className="mobile-menu-dim"
          onClick={() => setMobileMenuOpen(false)}
        >
          <aside
            className="mobile-menu-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-menu-head">
              <b>쩝쩝박사</b>

              <button
                onClick={() => setMobileMenuOpen(false)}
                aria-label="메뉴 닫기"
              >
                <X size={22} />
              </button>
            </div>

            <nav className="mobile-menu-list">
              <button onClick={() => goPage("/")}>홈</button>
              <button onClick={() => goPage("/search")}>맛집</button>
              <button onClick={() => goPage("/ranking")}>랭킹</button>
              <button onClick={() => goPage("/posts")}>게시글</button>
              <button onClick={() => goPage("/my")}>마이페이지</button>
            </nav>

            <button
              className="mobile-menu-write"
              onClick={() => goPage("/review/new")}
            >
              게시글 작성하기
            </button>
          </aside>
        </div>
      )}

      {assistantOpen && !assistantMinimized && (
        <div className="assistant-chat">
          <div className="assistant-chat-header">
            <button className="assistant-back" onClick={minimizeAssistant}>
              <Minimize2 size={18} />
            </button>

            <div className="assistant-profile">
              <div className="assistant-avatar">🤖</div>

              <div>
                <b>쩝쩝비서</b>
                <span>AI 맛집 추천 도우미</span>
              </div>
            </div>

            <button className="assistant-close" onClick={closeAssistant}>
              <X size={20} />
            </button>
          </div>

          <div className="assistant-chat-body">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`chat-message ${
                  msg.type === "user" ? "user-message" : "bot-message"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <div className="assistant-quick-buttons">
            <button onClick={() => setMessage("가성비 좋은 맛집 추천해줘")}>
              가성비 맛집
            </button>

            <button onClick={() => setMessage("혼밥하기 좋은 곳 알려줘")}>
              혼밥 추천
            </button>

            <button onClick={() => setMessage("데이트하기 좋은 카페 추천해줘")}>
              데이트 카페
            </button>
          </div>

          <div className="assistant-input-area">
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="쩝쩝비서에게 메시지 입력..."
            />

            <button onClick={handleSend}>
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      {assistantOpen && assistantMinimized && (
        <button
          className="assistant-mini-bubble"
          onClick={() => setAssistantMinimized(false)}
        >
          <span>🤖</span>
          <b>쩝쩝비서</b>
        </button>
      )}
    </div>
  );
}
