import Icon from "./Icon";

export default function SearchBar({ value, onChange, placeholder = "Search..." }) {
  return (
    <div className="relative">
      <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full rounded-lg border border-outline-variant bg-surface py-2 pl-10 pr-3 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary dark:bg-surface-container-low"
      />
      {value && (
        <button
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-on-surface-variant hover:bg-surface-container"
        >
          <Icon name="close" />
        </button>
      )}
    </div>
  );
}
