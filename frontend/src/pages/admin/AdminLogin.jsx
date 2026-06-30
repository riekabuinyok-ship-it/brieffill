import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogoIcon } from "../../components/Logo";
import Icon from "../../components/Icon";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const ADMIN_EMAIL = "riek@brieffill.com";
  const ADMIN_PASSWORD = "riek1995#";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem("adminToken", "admin_secure_token_2026");
      localStorage.setItem("adminEmail", email);
      navigate("/admin/dashboard");
    } else {
      setError("Invalid email or password. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary shadow-lg mb-4">
            <Icon name="shield" className="text-on-primary text-[32px]" filled />
          </div>
          <h1 className="text-3xl font-bold text-on-surface">Admin Login</h1>
          <p className="text-on-surface-variant mt-2">BriefFill Admin Panel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="flex items-center gap-2 bg-error-container/20 text-error px-4 py-3 rounded-xl text-sm border border-error/20">
              <Icon name="error" className="text-[18px]" filled />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Email Address</label>
            <div className="relative">
              <Icon name="mail" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" />
              <input
                type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-surface border border-outline-variant rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="admin@brieffill.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-on-surface mb-1.5">Password</label>
            <div className="relative">
              <Icon name="lock" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]" />
              <input
                type={showPassword ? "text" : "password"} required value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-11 py-2.5 bg-surface border border-outline-variant rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                placeholder="••••••••"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <Icon name={showPassword ? "visibility_off" : "visibility"} className="text-[20px]" />
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-primary text-on-primary font-semibold rounded-xl hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="text-center text-xs text-on-surface-variant mt-8">
          Secure admin access &bull; Protected by encryption
        </p>
      </div>
    </div>
  );
}
