import { Link } from "react-router-dom";
import Icon from "../Icon";

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-on-surface-variant mb-6">
      <Link to="/dashboard" className="hover:text-primary transition-colors">BriefFill</Link>
      {items.map((item, i) => (
        <span key={i} className="flex items-center gap-2">
          <Icon name="chevron_right" className="text-[14px]" />
          {item.to ? (
            <Link to={item.to} className="hover:text-primary transition-colors">{item.label}</Link>
          ) : (
            <span className="text-primary font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
