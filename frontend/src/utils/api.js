import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/_/backend/api",
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("brieffill_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function dispatchUpgrade(payload) {
  try {
    window.dispatchEvent(
      new CustomEvent("brieffill:upgrade-required", { detail: payload })
    );
  } catch {
    /* no-op for older browsers */
  }
}

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    if (status === 401) {
      localStorage.removeItem("brieffill_token");
      if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
      }
    } else if (status === 402 || status === 403) {
      const data = err.response?.data || {};
      if (data.code === "plan_upgrade_required" || data.code === "plan_limit_reached") {
        dispatchUpgrade({ ...data, status });
      }
    }
    return Promise.reject(err);
  }
);

export default api;
export { dispatchUpgrade };

// True if the error is a 402/403 plan-gated response (limit reached or
// capability required). Use at call sites that would otherwise show a
// generic error toast — the UpgradePrompt modal handles the messaging.
export function isPlanError(err) {
  const status = err?.response?.status;
  if (status !== 402 && status !== 403) return false;
  const code = err?.response?.data?.code;
  return code === "plan_upgrade_required" || code === "plan_limit_reached";
}
