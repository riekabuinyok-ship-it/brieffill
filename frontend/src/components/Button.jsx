import { Link } from "react-router-dom";
import Icon from "./Icon";

const variants = {
  primary: "brand-gradient text-white shadow-lg hover:shadow-xl active:scale-95",
  outline: "border border-primary text-primary hover:bg-primary/5",
  ghost: "text-on-surface-variant hover:bg-surface-container",
  error: "border border-error/20 bg-error-container/20 text-error hover:bg-error-container/40",
};

const sizes = {
  sm: "px-4 py-2 text-sm rounded-lg",
  md: "px-6 py-2.5 text-sm rounded-lg",
  lg: "px-10 py-4 text-lg rounded-xl",
  icon: "p-2 rounded-full",
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  as,
  to,
  href,
  icon,
  iconRight,
  iconFilled = false,
  className = "",
  loading = false,
  ...rest
}) {
  const classes = `inline-flex items-center justify-center gap-2 font-bold transition-all disabled:opacity-60 ${variants[variant]} ${sizes[size]} ${className}`;
  const inner = (
    <>
      {loading ? (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : icon ? (
        <Icon name={icon} filled={iconFilled} />
      ) : null}
      {children}
      {iconRight && <Icon name={iconRight} />}
    </>
  );

  if (as === "a" && to) {
    return <Link to={to} className={classes} {...rest}>{inner}</Link>;
  }

  if (as === "a" && href) {
    return <a href={href} className={classes} {...rest}>{inner}</a>;
  }

  return (
    <button className={classes} disabled={loading || rest.disabled} {...rest}>
      {inner}
    </button>
  );
}
