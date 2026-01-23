import authStorage from "../services/authStorage";

const authFetch = (input, options = {}) => {
  const headers = new Headers(options.headers || {});
  const token = authStorage.getToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return fetch(input, { ...options, headers });
};

export default authFetch;
