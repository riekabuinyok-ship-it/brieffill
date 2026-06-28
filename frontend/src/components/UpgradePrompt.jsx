// BriefFill — Global upgrade-prompt modal.
// Listens for the `brieffill:upgrade-required` window event dispatched by
// `utils/api.js` when a 402 or 403 plan-gated response is received. Renders a
// friendly, branded modal that explains what the user tried, why it's gated,
// and offers a clear path to the Pricing page (or Billing page if they're
// already on a paid plan).

import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";
import Icon from "./Icon";
import Button from "./Button";

const PLAN_LABEL_KEY = {
  free: "modal:plan.free",
  pro: "modal:plan.pro",
  team: "modal:plan.team",
  agency: "modal:plan.agency",
};

const TIER_BY_CAPABILITY = {
  competitorAnalysis: "agency",
  apiAccess: "agency",
  whiteLabel: "agency",
  prioritySupport: "agency",
  "exports:clickup": "agency",
  "exports:airtable": "agency",
  briefBuilder: "pro",
  "exports:pdf": "pro",
  "exports:clipboard": "pro",
  teamFeatures: "team",
  "exports:google-docs": "team",
  "exports:notion": "team",
};

export default function UpgradePrompt() {
  const navigate = useNavigate();
  const { t } = useTranslation(["modal", "common"]);
  const { user } = useAuth();
  const [payload, setPayload] = useState(null);

  const close = useCallback(() => setPayload(null), []);

  useEffect(() => {
    function onUpgrade(evt) {
      setPayload(evt.detail || null);
    }
    window.addEventListener("brieffill:upgrade-required", onUpgrade);
    return () => window.removeEventListener("brieffill:upgrade-required", onUpgrade);
  }, []);

  useEffect(() => {
    if (!payload) return undefined;
    function onKey(e) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [payload, close]);

  if (!payload) return null;

  // Disabled: no pop-up modals. LockedFeature + inline upgrade links handle gating instead.
  return null;

  /* eslint-disable no-unreachable */

  const isLimit = payload.code === "plan_limit_reached";
  const requiredCap = payload.requiredCapability || null;
  const capKey = requiredCap && TIER_BY_CAPABILITY[requiredCap] ? requiredCap : (requiredCap || "default");
  const title = isLimit
    ? t("modal:upgrade.limitTitle")
    : t(`modal:capability.${capKey}.title`, { defaultValue: t("modal:upgrade.defaultTitle") });
  const iconName = isLimit ? "hourglass_top" : (requiredCap === "competitorAnalysis" ? "analytics" : requiredCap === "apiAccess" ? "code" : requiredCap === "briefBuilder" ? "auto_awesome" : requiredCap === "teamFeatures" ? "groups" : requiredCap === "whiteLabel" ? "branding_watermark" : requiredCap === "prioritySupport" ? "support_agent" : (requiredCap && requiredCap.startsWith("exports:") ? "download" : "lock"));
  const currentPlan = user?.billing?.plan || payload.currentPlan || "free";
  const currentPlanKey = PLAN_LABEL_KEY[currentPlan] || PLAN_LABEL_KEY.free;
  const currentPlanLabel = t(currentPlanKey);
  const onPaidPlan = currentPlan !== "free";

  const requiredTier = TIER_BY_CAPABILITY[requiredCap] || null;

  let body;
  if (isLimit) {
    const limit = payload.limit ?? user?.billing?.briefLimit ?? 5;
    const used = payload.used ?? user?.billing?.briefsUsed ?? limit;
    body = t("modal:upgrade.limitBody", {
      used,
      limit,
      plan: currentPlanLabel,
    });
  } else {
    body = t(`modal:capability.${capKey}.body`, { defaultValue: t("modal:upgrade.defaultBody") });
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-labelledby="upgrade-prompt-title"
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-t-3xl bg-surface shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={close}
          aria-label={t("common:actions.close")}
          className="absolute right-4 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container"
        >
          <Icon name="close" className="text-[20px]" />
        </button>

        <div className="flex flex-col items-center px-6 pt-8 pb-2 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-container text-primary">
            <Icon name={iconName} className="text-[32px]" filled />
          </div>
          <h2 id="upgrade-prompt-title" className="font-headline-md text-headline-md text-on-background">
            {title}
          </h2>
        </div>

        <div className="px-6 pb-2 text-center">
          <p className="text-on-surface-variant">{body}</p>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-center gap-2 px-6">
          <span className="inline-flex items-center gap-1 rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-1 font-label-sm text-label-sm text-on-surface-variant">
            <Icon name="badge" className="text-[14px]" /> {t("modal:upgrade.current", { plan: currentPlanLabel })}
          </span>
          {!isLimit && requiredTier && requiredTier !== currentPlan && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary-container px-3 py-1 font-label-sm text-label-sm text-primary">
              <Icon name="arrow_upward" className="text-[14px]" /> {t("modal:upgrade.requires", { plan: t(PLAN_LABEL_KEY[requiredTier] || PLAN_LABEL_KEY.agency) })}
            </span>
          )}
        </div>

        <div className="mt-6 flex flex-col gap-2 px-6 pb-6">
          <Button onClick={() => { close(); navigate("/pricing"); }} iconRight="arrow_forward" className="w-full">
            {t("modal:upgrade.compare")}
          </Button>
          {onPaidPlan && (
            <button
              type="button"
              onClick={() => { close(); navigate("/dashboard/billing"); }}
              className="w-full rounded-lg px-4 py-2 text-sm font-medium text-primary hover:bg-primary-container/10"
            >
              {t("modal:upgrade.manage")}
            </button>
          )}
          {!onPaidPlan && (
            <button
              type="button"
              onClick={close}
              className="w-full rounded-lg px-4 py-2 text-sm font-medium text-on-surface-variant hover:bg-surface-container"
            >
              {t("modal:upgrade.notNow")}
            </button>
          )}
        </div>

        {!isLimit && requiredTier === "agency" && (
          <div className="border-t border-outline-variant bg-surface-container-lowest px-6 py-3 text-center">
            <p className="text-xs text-on-surface-variant">
              {t("modal:upgrade.contactSales")}{" "}
              <a href="mailto:sales@brieffill.com" className="font-medium text-primary hover:underline">
                {t("modal:upgrade.contactSalesCta")}
              </a>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
