import { useNavigate } from "react-router-dom";
import Icon from "./Icon";
import Button from "./Button";

export default function UpgradeBanner({ title, description, cta, plan = "pro", className = "" }) {
  const navigate = useNavigate();

  return (
    <div className={`bg-gradient-to-r from-primary via-primary-container to-[#7c3aed] rounded-xl p-stack-md text-white shadow-lg ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-stack-md">
        <div className="flex items-start gap-stack-sm">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
            <Icon name="auto_awesome" className="text-[22px]" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">{title || "Upgrade to Pro"}</p>
            <p className="text-white/80 text-xs mt-0.5 max-w-sm">
              {description || "Get unlimited access to all premium features."}
            </p>
          </div>
        </div>
        <Button size="sm" variant="primary" onClick={() => navigate("/pricing")} className="!bg-white !text-primary hover:!bg-white/90">
          {cta || "Upgrade Now"}
        </Button>
      </div>
    </div>
  );
}
