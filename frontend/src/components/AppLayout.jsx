import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Bell,
  Search,
  Home,
  Grid3X3,
  Trophy,
  User,
  PlusCircle,
  X,
  Send,
  Sparkles,
  Minimize2,
} from "lucide-react";

const navs = [
  { label: "홈", path: "/", icon: Home },
  { label: "카테고리", path: "/category", icon: Grid3X3 },
  { label: "맛집 등록", path: "/register", icon: PlusCircle },
  { label: "쩝쩝 랭킹", path: "/ranking", icon: Trophy },
  { label: "마이페이지", path: "/my", icon: User },
];

export default function AppLayout() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
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

  return (
    <div className="app-shell">
      <aside className="left-sidebar">
        <button
          className="brand large brand-button"
          onClick={() => navigate("/")}
        >
          🧑‍🍳 <b>쩝쩝박사</b>
        </button>

        <div className="mascot-card">
          <div className="mascot">🧑‍🍳</div>
          <h2>쩝쩝박사</h2>
          <p>가천대 맛집, 우리가 리뷰한다! 🧡</p>
        </div>

        <nav className="side-nav">
          {navs.map(({ label, path, icon: Icon }) => (
            <NavLink key={path} to={path}>
              <Icon size={19} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <button className="guide-card" onClick={() => navigate("/verified")}>
          <b>✨ 인증 맛집이란?</b>
          <span>영수증 인증을 완료한 맛집이에요!</span>
          <em>자세히 보기</em>
        </button>
      </aside>

      <main className="main-area">
        <header className={`topbar ${scrolled ? "topbar-scrolled" : ""}`}>
          <button className="mobile-logo" onClick={() => navigate("/")}>
            🧑‍🍳 쩝쩝박사
          </button>

          <nav className="desktop-nav">
            <NavLink to="/">홈</NavLink>
            <NavLink to="/search">맛집</NavLink>
            <NavLink to="/ranking">랭킹</NavLink>
            <NavLink to="/review/new">리뷰 작성</NavLink>
            <NavLink to="/my">마이페이지</NavLink>
          </nav>

          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="맛집, 메뉴, 지역을 검색해보세요"
              onFocus={() => navigate("/search")}
            />
          </div>

          <button className="icon-button">
            <Bell size={20} />
          </button>

          <button
            className="ai-assistant-chip"
            onClick={() => setAssistantOpen(true)}
          >
            <Sparkles size={18} />
            <span>쩝쩝비서</span>
          </button>
        </header>

        <Outlet />
      </main>

      {assistantOpen && (
        <div className="assistant-chat">
          <div className="assistant-chat-header">
            <button
              className="assistant-back"
              onClick={() => setAssistantOpen(false)}
            >
              <Minimize2 size={18} />
            </button>

            <div className="assistant-profile">
              <div className="assistant-avatar">🤖</div>
              <div>
                <b>쩝쩝비서</b>
                <span>AI 맛집 추천 도우미</span>
              </div>
            </div>

            <button
              className="assistant-close"
              onClick={() => setAssistantOpen(false)}
            >
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
    </div>
  );
}
