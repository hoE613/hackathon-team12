export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export const accessTokenKey = "jjepjep_access_token";
export const refreshTokenKey = "jjepjep_refresh_token";
export const userKey = "jjepjep_user";

export async function apiRequest(path, options = {}, accessToken = null) {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body) {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const json = await response.json();
      message = json.error || JSON.stringify(json);
    } catch {
      message = (await response.text()) || message;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

export function getStoredUser() {
  const raw = localStorage.getItem(userKey);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    localStorage.removeItem(userKey);
    return null;
  }
}

export function saveAuth({ access_token, refresh_token, user }) {
  localStorage.setItem(accessTokenKey, access_token);
  localStorage.setItem(refreshTokenKey, refresh_token);
  localStorage.setItem(userKey, JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem(accessTokenKey);
  localStorage.removeItem(refreshTokenKey);
  localStorage.removeItem(userKey);
  localStorage.removeItem("jjeop-login");
}
