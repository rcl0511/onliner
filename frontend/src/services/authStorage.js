const SESSION_KEY = "userInfo";
const TOKEN_KEY = "authToken";

const authStorage = {
  getUser() {
    try {
      const sessionUser = JSON.parse(sessionStorage.getItem(SESSION_KEY) || "null");
      if (sessionUser) {
        return sessionUser;
      }
    } catch {}
    try {
      const localUser = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      if (localUser) {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(localUser));
        localStorage.removeItem(SESSION_KEY);
        return localUser;
      }
    } catch {}
    return {};
  },
  setUser(user) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
    localStorage.removeItem(SESSION_KEY);
  },
  getToken() {
    const sessionToken = sessionStorage.getItem(TOKEN_KEY);
    if (sessionToken) {
      return sessionToken;
    }

    const legacyToken = localStorage.getItem(TOKEN_KEY);
    if (legacyToken) {
      sessionStorage.setItem(TOKEN_KEY, legacyToken);
      localStorage.removeItem(TOKEN_KEY);
      return legacyToken;
    }

    return "";
  },
  setToken(token) {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
      localStorage.removeItem(TOKEN_KEY);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  },
  clearUser() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_KEY);
  },
};

export default authStorage;
