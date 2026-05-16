import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  accessTokenKey,
  apiRequest,
  clearAuth,
  getStoredUser,
  refreshTokenKey,
  saveAuth,
  userKey,
} from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(() => localStorage.getItem(accessTokenKey));
  const [refreshToken, setRefreshToken] = useState(() => localStorage.getItem(refreshTokenKey));
  const [user, setUser] = useState(() => getStoredUser());
  const [authStatus, setAuthStatus] = useState("");

  const isLoggedIn = Boolean(accessToken);

  const persist = useCallback((authResult) => {
    saveAuth(authResult);
    setAccessToken(authResult.access_token);
    setRefreshToken(authResult.refresh_token);
    setUser(authResult.user);
  }, []);

  const login = useCallback(
    async (code) => {
      setAuthStatus("로그인 중...");
      const result = await apiRequest("/auth/gachon/login", {
        method: "POST",
        body: JSON.stringify({ code }),
      });
      persist(result);
      setAuthStatus("로그인 완료");
      return result.user;
    },
    [persist]
  );

  const refreshMe = useCallback(async () => {
    if (!accessToken) return null;
    const me = await apiRequest("/users/me", { method: "GET" }, accessToken);
    setUser(me);
    localStorage.setItem(userKey, JSON.stringify(me));
    return me;
  }, [accessToken]);

  const logout = useCallback(async () => {
    try {
      if (refreshToken) {
        await apiRequest(
          "/auth/logout",
          {
            method: "POST",
            body: JSON.stringify({ refresh_token: refreshToken }),
          },
          accessToken
        );
      }
    } finally {
      clearAuth();
      setAccessToken(null);
      setRefreshToken(null);
      setUser(null);
      setAuthStatus("로그아웃 완료");
    }
  }, [accessToken, refreshToken]);

  useEffect(() => {
    if (accessToken) {
      refreshMe().catch(() => {
        clearAuth();
        setAccessToken(null);
        setRefreshToken(null);
        setUser(null);
      });
    }
  }, [accessToken, refreshMe]);

  const value = useMemo(
    () => ({
      accessToken,
      refreshToken,
      user,
      isLoggedIn,
      authStatus,
      setAuthStatus,
      login,
      logout,
      refreshMe,
    }),
    [accessToken, refreshToken, user, isLoggedIn, authStatus, login, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
}
