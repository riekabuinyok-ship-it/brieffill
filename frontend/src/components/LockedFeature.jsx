import { useState } from "react";
import { Link } from "react-router-dom";
import Icon from "./Icon";

export default function LockedFeature({ children, feature, plan, className = "" }) {
  const [revealed, setRevealed] = useState(false);
  const planNames = { pro: "Pro", team: "Team", agency: "Agency" };
  const planName = planNames[plan] || plan;

  return (
    <div
      className={`relative cursor-pointer ${className}`}
      onClickCapture={(e) => { e.stopPropagation(); e.preventDefault(); setRevealed(!revealed); }}
    >
      <div className={revealed ? "opacity-50 pointer-events-none transition-opacity duration-200" : ""}>
        {children}
      </div>
      {revealed && (
        <div className="mt-2 space-y-1">
          <span className="inline-flex items-center gap-1 rounded-full bg-on-surface/75 text-surface px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
            <Icon name="lock" className="text-[11px]" /> {planName}
          </span>
          <Link
            to="/pricing"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 hover:underline transition-colors ml-1"
          >
            <Icon name="lock" className="text-[13px]" />
            <span>Requires {planName} plan</span>
            <Icon name="arrow_forward" className="text-[13px]" />
          </Link>
        </div>
      )}
    </div>
  );
}
