const BASE_URL = import.meta.env.VITE_API_URL;

const API = async (url, options = {}) => {
  try {
    const token = localStorage.getItem("token");

    // Clone options to avoid mutation
    const config = { ...options };
    const headers = { ...options.headers };

    // Add Authorization header if token exists
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    // Handle body: if it's an object and not FormData, stringify and set Content-Type
    if (config.body && typeof config.body === "object" && !(config.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
      config.body = JSON.stringify(config.body);
    }

    config.headers = headers;

    const response = await fetch(`${BASE_URL}/api${url}`, config);

    let data;
    try {
      data = await response.json();
    } catch {
      data = {};
    }

    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP ${response.status}`);
    }

    return data;
  } catch (err) {
    console.error("❌ API Error:", err.message);
    throw err;
  }
};

export default API;