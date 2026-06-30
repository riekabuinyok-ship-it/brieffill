import { createContext, useContext, useState, useEffect, useRef } from "react";
import api from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetchIdRef = useRef(0);

  useEffect(() => {
    const token = localStorage.getItem("brieffill_token");
    if (token) {
      const id = ++fetchIdRef.current;
      api.get("/auth/me")
        .then((res) => { if (fetchIdRef.current === id) setUser(res.data.user); })
        .catch(() => { if (fetchIdRef.current === id) logout(); })
        .finally(() => { if (fetchIdRef.current === id) setLoading(false); });
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
    localStorage.removeItem("adminToken");
    localStorage.removeItem("adminEmail");
    setUser(null);
    window.location.href = "/";
  };

  const refreshUser = async () => {
    const token = localStorage.getItem("brieffill_token");
    if (!token) return;
    const id = ++fetchIdRef.current;
    try {
      const res = await api.get("/auth/me");
      if (fetchIdRef.current === id) setUser(res.data.user);
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
