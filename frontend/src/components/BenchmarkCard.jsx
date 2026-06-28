function barColor(delta) {
  if (delta >= 5) return "bg-primary";
  if (delta <= -5) return "bg-error";
  return "bg-yellow-500";
}

function deltaLabel(delta) {
  if (delta === 0) return "matches your avg";
  return delta > 0 ? `+${delta} vs your avg` : `${delta} vs your avg`;
}

export default function BenchmarkCard({ data }) {
  const { byIndustry = [], overallAverage = 0, total = 0 } = data || {};

  if (!byIndustry.length) {
    return (
      <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-lg text-center">
        <span className="material-symbols-outlined text-4xl text-outline-variant">bar_chart</span>
        <p className="mt-2 text-sm text-on-surface-variant">Industry benchmarks will appear here once you've analyzed briefs in different categories.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-stack-md">
      <div className="mb-stack-md flex flex-wrap items-center justify-between gap-stack-sm">
        <div>
          <p className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">By industry</p>
          <p className="text-sm text-on-surface-variant">Self-benchmarking across your {total} brief{total !== 1 ? "s" : ""}</p>
        </div>
        <div className="text-right">
          <p className="font-label-sm text-label-sm text-on-surface-variant">Your overall avg</p>
          <p className="font-headline-md text-headline-md text-primary">{overallAverage}%</p>
        </div>
      </div>

      <ul className="space-y-stack-md">
        {byIndustry.map((row) => (
          <li key={row.industry}>
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-medium text-on-surface capitalize">{row.industry}</span>
              <span className="flex items-baseline gap-stack-sm">
                <span className="font-bold text-on-surface">{row.averageScore}%</span>
                <span className={`text-xs ${row.delta > 0 ? "text-primary" : row.delta < 0 ? "text-error" : "text-on-surface-variant"}`}>
                  {deltaLabel(row.delta)}
                </span>
              </span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-surface-container">
              <div
                className={`h-full rounded-full transition-all duration-700 ease-out ${barColor(row.delta)}`}
                style={{ width: `${row.averageScore}%` }}
              />
            </div>
            <p className="mt-1 text-xs text-on-surface-variant">{row.count} brief{row.count !== 1 ? "s" : ""} in this category</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
