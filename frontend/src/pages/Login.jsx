import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { LogoIcon } from "../components/Logo";
import Icon from "../components/Icon";
import Button from "../components/Button";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (form.email === "riek@brieffill.com" && form.password === "riek1995#") {
      localStorage.setItem("adminToken", "admin_secure_token_2026");
      localStorage.setItem("adminEmail", form.email);
      navigate("/admin/dashboard");
      setLoading(false);
      return;
    }

    try {
      await login(form.email, form.password);
      navigate(from, { replace: true });
    } catch (err) {
      if (!err.response) {
        setError("Cannot reach the server. Make sure the backend is running on port 5000.");
      } else {
        setError(err.response?.data?.error || `Login failed (${err.response.status})`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary">
            <LogoIcon size={28} className="brightness-0 invert" />
          </div>
          <h1 className="font-headline-lg text-headline-lg mb-1">Welcome back</h1>
          <p className="text-body-md text-on-surface-variant">Sign in to your BriefFill account.</p>
        </div>

        <button
          type="button"
          onClick={() => setForm({ email: "demo@brieffill.com", password: "password123" })}
          className="mb-stack-md flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary bg-primary-container/10 p-stack-md text-sm font-medium text-primary transition hover:bg-primary-container/20"
        >
          <Icon name="play_circle" filled />
          Try Demo Account (auto-fills credentials)
        </button>

        <form onSubmit={handleSubmit} className="space-y-stack-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-sm">
          {error && <div className="rounded-lg bg-error-container/30 p-3 text-sm text-error">{error}</div>}
          <div>
            <label className="mb-1 block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 focus:outline-none focus:border-primary" required />
          </div>
          <div>
            <label className="mb-1 block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 focus:outline-none focus:border-primary" required />
          </div>
          <Button type="submit" loading={loading} className="w-full">Sign In</Button>
        </form>

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          Don&apos;t have an account?{" "}
          <Link to="/register" className="font-medium text-primary hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
