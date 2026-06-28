// Legacy /subscription route — redirects to the new Billing page.
// Kept for backward compatibility with old bookmarks/links.
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Subscription() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard/billing", { replace: true });
    } else {
      navigate("/pricing", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="mx-auto max-w-3xl px-margin-mobile md:px-margin-desktop pt-32 text-center text-on-surface-variant">
      Redirecting&hellip;
    </div>
  );
}
