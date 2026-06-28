import Icon from "../Icon";

export default function DocSearch({ value, onChange }) {
  return (
    <div className="relative mb-6">
      <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search documentation..."
        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-outline-variant bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
      />
    </div>
  );
}
