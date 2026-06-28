import { useAuth } from "../contexts/AuthContext";
import AccountSecurity from "../components/AccountSecurity";
import Icon from "../components/Icon";

export default function Security() {
  const { user, logout } = useAuth();

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface mb-2">Security</h1>
        <p className="text-sm text-on-surface-variant">Manage your password, two-factor authentication, and active sessions.</p>
      </div>

      <AccountSecurity user={user} logout={logout} />

      <button onClick={logout}
        className="mt-8 w-full flex items-center justify-between rounded-xl border border-error/20 bg-error-container/20 p-5 text-error transition-colors hover:bg-error-container/40">
        <div className="flex items-center gap-4">
          <Icon name="logout" />
          <span className="font-semibold">Sign Out</span>
        </div>
        <Icon name="chevron_right" />
      </button>
    </div>
  );
}
