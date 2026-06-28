import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Icon from "../components/Icon";
import Button from "../components/Button";
import { getTemplateById, FIELDS_WITH_PLACEHOLDERS } from "../data/templates";

const STORAGE_KEY = "brieffill_template_draft";

function loadDraft(templateId) {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}_${templateId}`);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveDraft(templateId, fields) {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${templateId}`, JSON.stringify(fields));
  } catch { /* quota exceeded */ }
}

export default function TemplateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const template = getTemplateById(id);
  const [fields, setFields] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Initialize from saved draft or empty
  useEffect(() => {
    if (!template) return;
    const draft = loadDraft(id);
    if (draft) {
      setFields(draft);
    } else {
      const init = {};
      FIELDS_WITH_PLACEHOLDERS.forEach((f) => { init[f.name] = ""; });
      setFields(init);
    }
  }, [id, template]);

  // Auto-save every 30s
  useEffect(() => {
    if (Object.keys(fields).length === 0) return;
    const timer = setInterval(() => {
      saveDraft(id, fields);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 30000);
    return () => clearInterval(timer);
  }, [id, fields]);

  const handleFieldChange = (name, value) => {
    setFields((prev) => ({ ...prev, [name]: value }));
    setSaving(true);
    clearTimeout(window._saveTimer);
    window._saveTimer = setTimeout(() => {
      saveDraft(id, { ...fields, [name]: value });
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1500);
  };

  const handleManualSave = () => {
    saveDraft(id, fields);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleAnalyze = () => {
    const briefText = FIELDS_WITH_PLACEHOLDERS
      .map((f) => `${f.name}: ${fields[f.name] || "[not provided]"}`)
      .join("\n\n");
    navigate("/new", { state: { prefill: briefText } });
  };

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Icon name="folder_off" className="text-[48px] text-on-surface-variant" />
        <p className="text-on-surface-variant mt-3">Template not found</p>
        <Link to="/templates" className="text-primary font-semibold hover:underline mt-2">&larr; Back to templates</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link to="/templates" className="inline-flex items-center gap-1.5 text-sm text-on-surface-variant hover:text-primary transition-colors mb-6">
        <Icon name="arrow_back" className="text-[16px]" />
        Back to templates
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-outline-variant mb-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-2">
              <Icon name={template.categoryIcon} className="text-[16px] text-primary" />
              <span>{template.category}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-on-surface">{template.name}</h1>
            <p className="text-sm text-on-surface-variant mt-2">{template.description}</p>
          </div>
          <span className="text-xs text-outline shrink-0">Used {template.usageCount} times</span>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-6 pt-6 border-t border-outline-variant">
          {saving && <span className="text-xs text-on-surface-variant">Saving...</span>}
          {saved && (
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Icon name="check_circle" className="text-[14px]" /> Saved
            </span>
          )}
          <Button size="sm" variant="outline" icon="save" onClick={handleManualSave}>Save Progress</Button>
          <Button size="sm" icon="auto_awesome" onClick={handleAnalyze}>Analyze Brief</Button>
        </div>
      </div>

      {/* Fields */}
      <div className="bg-white rounded-2xl p-6 md:p-8 border border-outline-variant">
        <h2 className="text-lg font-bold text-on-surface mb-2">Brief Template</h2>
        <p className="text-sm text-on-surface-variant mb-6">Fill in the fields below. Your progress is saved automatically.</p>

        <div className="space-y-4">
          {FIELDS_WITH_PLACEHOLDERS.map((field) => (
            <div key={field.name} className="border border-outline-variant rounded-xl p-4">
              <label className="block text-sm font-semibold text-on-surface mb-1.5">{field.name}</label>
              <textarea placeholder={field.placeholder}
                className="w-full px-3 py-2 border border-outline-variant rounded-lg text-sm focus:outline-none focus:border-primary resize-y min-h-[70px]"
                rows={3}
                value={fields[field.name] || ""}
                onChange={(e) => handleFieldChange(field.name, e.target.value)} />
            </div>
          ))}
        </div>

        <div className="mt-6">
          <Button onClick={handleAnalyze} iconRight="arrow_forward" className="w-full justify-center">Analyze Brief</Button>
          <p className="text-xs text-on-surface-variant text-center mt-2">Your brief will be saved and analyzed. Results appear in your dashboard.</p>
        </div>
      </div>
    </div>
  );
}
