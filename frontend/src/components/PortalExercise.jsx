import Icon from "./Icon";

export default function PortalExercise({ num, field, value, onChange, files, onUpload, uploading }) {
  const hasValue = value && value.trim().length > 0;

  return (
    <div className={`rounded-xl border bg-surface-container-lowest p-5 shadow-sm transition-all ${hasValue ? 'border-primary/30' : 'border-outline-variant'}`}>
      <div className="mb-1 flex items-center gap-2">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${hasValue ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant'}`}>
          {hasValue ? <Icon name="check" className="text-[14px]" /> : num}
        </span>
        <h3 className="font-headline-md text-headline-md text-on-surface">{field.name}</h3>
      </div>

      {field.question && (
        <p className="mb-3 text-sm text-on-surface-variant ml-8">{field.question}</p>
      )}

      <textarea
        value={value || ""}
        onChange={(e) => onChange(field.name, e.target.value)}
        placeholder="Type your response here..."
        rows={4}
        className="mt-2 w-full rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm focus:outline-none focus:border-primary resize-y"
      />

      <div className="mt-3 flex flex-wrap items-center gap-3 ml-8">
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-outline-variant px-3 py-1.5 text-sm text-on-surface-variant hover:border-primary hover:text-primary transition-colors">
          <Icon name="attach_file" className="text-[16px]" />
          {uploading ? "Uploading..." : "Attach file"}
          <input type="file" className="hidden" onChange={(e) => onUpload(e, field.name)} disabled={uploading} />
        </label>
        {files.map((f) => (
          <span key={f.id} className="inline-flex items-center gap-1.5 rounded-lg bg-surface-container px-2.5 py-1 text-xs font-medium text-on-surface-variant">
            <Icon name="description" className="text-[14px] text-primary" />
            {f.fileName}
          </span>
        ))}
      </div>
    </div>
  );
}
