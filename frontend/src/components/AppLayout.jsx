import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Bell,
  Search,
  Home,
  Grid3X3,
  Trophy,
  User,
  PlusCircle,
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

  return (
    <div className="app-shell">
      <aside className="left-sidebar">
        <div className="brand large">
          🧑‍🍳 <b>쩝쩝박사</b>
        </div>

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
        <header className="topbar">
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

          <div className="search-box" onClick={() => navigate("/search")}>
            <Search size={18} />
            <span>맛집, 메뉴, 지역을 검색해보세요</span>
          </div>

          <button className="icon-button">
            <Bell size={20} />
          </button>

          <button className="profile-chip" onClick={() => navigate("/my")}>
            🧑‍🍳 쩝쩝박사 48kg
          </button>
        </header>

        <Outlet />
      </main>
    </div>
  );
}
