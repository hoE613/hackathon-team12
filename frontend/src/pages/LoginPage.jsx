import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  const handleLogin = () => {
    localStorage.setItem("jjeop-login", "true");
    navigate("/");
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-small-logo">🧑‍🍳</div>

        <h1>쩝쩝박사</h1>

        <p>가천대 맛집, 우리끼리 편리뷰 🧡</p>

        <div className="login-mascot-box">
          <div className="login-sparkle left">✦</div>
          <div className="login-mascot">🧑‍🍳</div>
          <div className="login-sparkle right">✦</div>
        </div>

        <button className="login-main-button" onClick={handleLogin}>
          로그인 / 회원가입
        </button>

        <button className="login-social-button" onClick={handleLogin}>
          <span className="kakao-icon">💬</span>
          카카오로 시작하기
        </button>

        <button className="login-social-button" onClick={handleLogin}>
          <span className="gachon-icon">G</span>
          가천대학교 계정으로 시작
        </button>
      </section>
    </main>
  );
}
