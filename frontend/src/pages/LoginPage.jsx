import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const navigate = useNavigate();

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-logo">🧑‍🍳</div>

        <h1>쩝쩝박사</h1>

        <p>가천대 맛집, 우리가 리뷰한다! 🧡</p>

        <div className="login-mascot">🧑‍🍳</div>

        <button className="primary" onClick={() => navigate("/")}>
          로그인 / 회원가입
        </button>

        <button className="social kakao" onClick={() => navigate("/")}>
          🟡 카카오로 시작하기
        </button>

        <button className="social google" onClick={() => navigate("/")}>
          G 가천대학교 계정으로 시작
        </button>
      </section>
    </main>
  );
}
