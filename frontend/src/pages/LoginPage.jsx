import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiRequest } from "../api/client.js";
import { useAuth } from "../auth/AuthContext.jsx";

const demoCodes = ["dev-login", "demo-user-01", "demo-user-02", "demo-user-03", "demo-user-04", "demo-user-05"];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, authStatus, setAuthStatus } = useAuth();
  const [code, setCode] = useState("dev-login");
  const [dbStatus, setDbStatus] = useState("");

  const handleLogin = async (nextCode = code) => {
    try {
      await login(nextCode.trim());
      navigate("/");
    } catch (error) {
      setAuthStatus(`로그인 실패: ${error.message}`);
    }
  };

  const handleDbCheck = async () => {
    setDbStatus("DB 확인 중...");
    try {
      const result = await apiRequest("/db/health");
      setDbStatus(result.ok ? "DB 연결 완료" : result.error || "DB 연결 실패");
    } catch (error) {
      setDbStatus(`DB 실패: ${error.message}`);
    }
  };

  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-small-logo">쩝</div>

        <h1>쩝쩝박사</h1>

        <p>가천대 맛집, 우리끼리 편리뷰</p>

        <div className="login-mascot-box">
          <div className="login-sparkle left">✦</div>
          <div className="login-mascot">쩝</div>
          <div className="login-sparkle right">✦</div>
        </div>

        <label className="login-code-field">
          로그인 코드
          <input
            value={code}
            onChange={(event) => setCode(event.target.value)}
            placeholder="dev-login"
          />
        </label>

        <button className="login-main-button" onClick={() => handleLogin()}>
          데모 로그인
        </button>

        <div className="demo-code-list">
          {demoCodes.map((demoCode) => (
            <button
              className="login-social-button"
              key={demoCode}
              onClick={() => {
                setCode(demoCode);
                handleLogin(demoCode);
              }}
            >
              <span className="gachon-icon">G</span>
              {demoCode}
            </button>
          ))}
        </div>

        <button className="login-social-button" onClick={handleDbCheck}>
          DB 연결 확인
        </button>

        {(authStatus || dbStatus) && <small className="login-status">{authStatus || dbStatus}</small>}
      </section>
    </main>
  );
}
