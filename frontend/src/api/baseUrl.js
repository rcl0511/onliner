const RENDER_API_BASE = "https://onliner-xnpa.onrender.com";
const LOCAL_API_BASE = "http://localhost:8080";

const resolveApiBase = () => {
  if (process.env.REACT_APP_API_BASE_URL) {
    return process.env.REACT_APP_API_BASE_URL;
  }
  const host = window.location.hostname;
  if (host === "localhost" || host === "127.0.0.1") {
    return LOCAL_API_BASE;
  }
  return RENDER_API_BASE;
};

const API_BASE = resolveApiBase();
export default API_BASE;
