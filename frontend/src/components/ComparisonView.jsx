export default function ComparisonView({ original, improved, fieldFixes = {} }) {
  const fixEntries = Object.entries(fieldFixes);

  return (
    <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
      {/* Original */}
      <div className="flex flex-col rounded-2xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface-container-low px-stack-md py-stack-sm">
          <div className="flex items-center gap-stack-sm">
            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">description</span>
            <h3 className="font-label-sm text-label-sm uppercase tracking-wider text-on-surface-variant">Original</h3>
          </div>
          <span className="rounded-full bg-surface-container px-2 py-0.5 font-label-sm text-label-sm text-on-surface-variant">
            {original.split(/\s+/).filter(Boolean).length} words
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-stack-md max-h-96">
          <pre className="whitespace-pre-wrap font-body-md text-sm text-on-surface-variant leading-relaxed">
            {original}
          </pre>
        </div>
      </div>

      {/* Improved */}
      <div className="flex flex-col rounded-2xl border-2 border-primary bg-surface-container-lowest overflow-hidden">
        <div className="flex items-center justify-between border-b border-primary/20 bg-primary-container/10 px-stack-md py-stack-sm">
          <div className="flex items-center gap-stack-sm">
            <span className="material-symbols-outlined text-primary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
            <h3 className="font-label-sm text-label-sm uppercase tracking-wider text-primary">AI-Improved</h3>
          </div>
          <span className="rounded-full bg-primary px-2 py-0.5 font-label-sm text-label-sm text-on-primary">
            {improved.split(/\s+/).filter(Boolean).length} words
          </span>
        </div>
        <div className="flex-1 overflow-y-auto p-stack-md max-h-96">
          <pre className="whitespace-pre-wrap font-body-md text-sm text-on-surface leading-relaxed">
            {improved}
          </pre>
        </div>
      </div>

      {/* Field fixes summary */}
      {fixEntries.length > 0 && (
        <div className="md:col-span-2 rounded-2xl border border-primary/20 bg-primary-container/5 p-stack-md">
          <h4 className="mb-stack-sm font-headline-md text-headline-md flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined">build</span>
            What Changed
          </h4>
          <ul className="space-y-stack-sm">
            {fixEntries.map(([field, change]) => (
              <li key={field} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary">
                  <span className="material-symbols-outlined text-[14px]">check</span>
                </span>
                <div>
                  <span className="font-semibold text-on-surface">{field}:</span>{" "}
                  <span className="text-on-surface-variant">{change}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
