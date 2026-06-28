import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams, useLocation } from "react-router-dom";
import api from "../utils/api";
import { useAuth } from "../contexts/AuthContext";
import { LogoIcon } from "../components/Logo";
import Button from "../components/Button";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/dashboard";
  const [searchParams] = useSearchParams();
  const refFromUrl = (searchParams.get("ref") || "").toUpperCase();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [referrerName, setReferrerName] = useState(null);

  useEffect(() => {
    if (!refFromUrl) {
      setReferrerName(null);
      return;
    }
    api.get("/referrals/validate", { params: { code: refFromUrl } })
      .then((res) => {
        if (res.data.valid) setReferrerName(res.data.referrerName);
      })
      .catch(() => setReferrerName(null));
  }, [refFromUrl]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await register(form.email, form.name, form.password, { ref: refFromUrl });
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || "Registration failed");
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
          <h1 className="font-headline-lg text-headline-lg mb-1">Create your account</h1>
          <p className="text-body-md text-on-surface-variant">Start analyzing briefs in seconds.</p>
        </div>

        {refFromUrl && (
          <div className="mb-stack-md rounded-lg border border-primary/30 bg-primary-container/10 p-3 text-sm text-on-surface">
            {referrerName ? (
              <>Referred by <strong>{referrerName}</strong> — you&apos;ll get 1 month free Pro when you activate a paid plan.</>
            ) : (
              <>Referral code applied: <span className="font-mono font-semibold">{refFromUrl}</span></>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-stack-md rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-md shadow-sm">
          {error && <div className="rounded-lg bg-error-container/30 p-3 text-sm text-error">{error}</div>}
          <div>
            <label className="mb-1 block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 focus:outline-none focus:border-primary" required />
          </div>
          <div>
            <label className="mb-1 block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 focus:outline-none focus:border-primary" required />
          </div>
          <div>
            <label className="mb-1 block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Password</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 focus:outline-none focus:border-primary" minLength={6} required />
          </div>
          <div>
            <label className="mb-1 block font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Confirm Password</label>
            <input type="password" value={form.confirmPassword} onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 focus:outline-none focus:border-primary" minLength={6} required />
          </div>
          <Button type="submit" loading={loading} className="w-full">Create account</Button>
        </form>

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-primary hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
