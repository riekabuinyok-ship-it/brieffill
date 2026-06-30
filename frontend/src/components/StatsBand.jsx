const STATS = [
  { value: "12", label: "Critical fields scored" },
  { value: "< 30s", label: "Average analysis time" },
  { value: "2.4x", label: "Faster project onboarding" },
  { value: "98%", label: "Gap detection accuracy" },
];

export default function StatsBand() {
  return (
    <section className="bg-primary py-stack-lg text-on-primary">
      <div className="container mx-auto px-margin-mobile md:px-margin-desktop max-w-container-max">
        <div className="grid grid-cols-2 gap-stack-md md:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-display text-display-md mb-1 font-bold leading-none">{s.value}</p>
              <p className="text-sm font-medium opacity-90">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
