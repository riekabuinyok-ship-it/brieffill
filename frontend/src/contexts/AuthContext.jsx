import { createContext, useContext, useState, useEffect } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("brieffill_token");
    if (token) {
      api.get("/auth/me")
        .then((res) => setUser(res.data.user))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/auth/login", { email, password });
    localStorage.setItem("brieffill_token", res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const register = async (email, name, password, extra = {}) => {
    const res = await api.post("/auth/register", { email, name, password, ...extra });
    localStorage.setItem("brieffill_token", res.data.token);
    setUser(res.data.user);
    return res.data;
  };

  const logout = () => {
    localStorage.removeItem("brieffill_token");
    setUser(null);
    window.location.href = "/";
  };

  const refreshUser = async () => {
    const token = localStorage.getItem("brieffill_token");
    if (!token) return;
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.user);
    } catch {
      // ignored — keep current user
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
