import Icon from "./Icon";

const statusConfig = {
  present: { bg: "bg-primary/10", text: "text-primary", icon: "check_circle", iconFilled: true, label: "Present" },
  partial: { bg: "bg-yellow-100", text: "text-yellow-700", icon: "warning", iconFilled: true, label: "Partial" },
  missing: { bg: "bg-error-container/30", text: "text-error", icon: "error_outline", iconFilled: false, label: "Missing" },
};

export default function FieldStatus({ name, status, question }) {
  const cfg = statusConfig[status] || statusConfig.missing;

  return (
    <div className={`rounded-lg border border-outline-variant p-stack-md ${cfg.bg}`}>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name={cfg.icon} filled={cfg.iconFilled} className={cfg.text} />
          <span className="text-sm font-semibold text-on-surface">{name}</span>
        </div>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${cfg.bg} ${cfg.text}`}>
          {cfg.label}
        </span>
      </div>
      {(status === "missing" || status === "partial") && question && (
        <p className="mt-2 text-sm text-on-surface-variant">{question}</p>
      )}
    </div>
  );
}
