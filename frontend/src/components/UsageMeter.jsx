import { useNavigate } from "react-router-dom";
import Button from "./Button";

export default function UsageMeter({ current = 0, max = 5, plan = "free", className = "" }) {
  const navigate = useNavigate();
  const percentage = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;
  const isFree = plan === "free";

  const barColor = isAtLimit ? "bg-error" : isNearLimit ? "bg-[#f59e0b]" : "bg-primary";

  return (
    <div className={`rounded-xl border border-outline-variant bg-surface-container-lowest p-stack-md ${className}`}>
      {isFree && (
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant">Briefs this month</p>
          <span className={`text-xs font-semibold ${isAtLimit ? "text-error" : isNearLimit ? "text-[#92400e]" : "text-primary"}`}>
            {current}/{max}
          </span>
        </div>
      )}

      <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
        <div className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`} style={{ width: `${percentage}%` }} />
      </div>

      {isFree && isAtLimit && (
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-error font-medium">You've used all your free briefs this month.</p>
          <Button size="sm" variant="primary" onClick={() => navigate("/pricing")} icon="upgrade">Upgrade</Button>
        </div>
      )}

      {isFree && isNearLimit && !isAtLimit && (
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-[#92400e] font-medium">{max - current} brief{max - current === 1 ? "" : "s"} remaining this month.</p>
          <Button size="sm" variant="outline" onClick={() => navigate("/pricing")}>Upgrade</Button>
        </div>
      )}
    </div>
  );
}
