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
    return sessionStorage.getItem(TOKEN_KEY) || "";
  },
  setToken(token) {
    if (token) {
      sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_KEY);
    }
  },
  clearUser() {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
  },
};

export default authStorage;
