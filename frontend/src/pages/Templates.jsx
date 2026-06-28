import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import Icon from "../components/Icon";
import { templateCategories, getAllTemplates } from "../data/templates";

export default function Templates() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState(searchParams.get("cat") || "all");
  const [searchQuery, setSearchQuery] = useState("");

  const allTemplates = getAllTemplates();
  const filtered = allTemplates.filter((t) => {
    const matchCat = activeCategory === "all" || t.categoryId === activeCategory;
    const matchSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const recentTemplates = [...allTemplates].sort((a, b) => b.usageCount - a.usageCount).slice(0, 6);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-on-surface">Templates Library</h1>
        <p className="text-sm text-on-surface-variant mt-1">Choose from 42+ professionally crafted templates to start your brief.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-[20px] text-outline" />
        <input type="text" placeholder="Search templates..." value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-outline-variant rounded-xl focus:outline-none focus:border-primary text-sm" />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {[{ id: "all", name: "All", icon: "" }, ...templateCategories].map((cat) => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeCategory === cat.id
                ? "bg-primary text-white"
                : "bg-white text-on-surface-variant border border-outline-variant hover:bg-surface-container"
            }`}>
            {cat.icon && <Icon name={cat.icon} className="text-[16px]" />}
            {cat.name}
          </button>
        ))}
      </div>

      {/* Most Popular */}
      {activeCategory === "all" && searchQuery === "" && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-on-surface">Most Popular</h2>
            <span className="text-xs text-on-surface-variant">Most used templates</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {recentTemplates.map((t) => (
              <button key={t.id} onClick={() => navigate(`/templates/${t.id}`)}
                className="bg-white rounded-xl p-4 text-center border border-outline-variant hover:shadow-md hover:border-primary/30 transition-all">
                <div className="w-10 h-10 mx-auto bg-primary/5 rounded-lg flex items-center justify-center mb-2">
                  <Icon name={t.categoryIcon} className="text-[20px] text-primary" />
                </div>
                <p className="text-xs font-semibold text-on-surface truncate">{t.name}</p>
                <p className="text-[10px] text-outline mt-1">Used {t.usageCount}x</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Templates by category */}
      {activeCategory === "all" && searchQuery === "" ? (
        templateCategories.map((cat) => {
          const items = filtered.filter((t) => t.categoryId === cat.id);
          if (items.length === 0) return null;
          return (
            <div key={cat.id}>
              <div className="flex items-center gap-2 mb-4">
                <Icon name={cat.icon} className="text-[22px] text-primary" />
                <h2 className="text-lg font-bold text-on-surface">{cat.name}</h2>
                <span className="text-xs text-on-surface-variant">({items.length})</span>
              </div>
              <p className="text-sm text-on-surface-variant mb-4">{cat.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {items.map((t) => (
                  <TemplateCard key={t.id} template={t} />
                ))}
              </div>
            </div>
          );
        })
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((t) => <TemplateCard key={t.id} template={t} />)}
        </div>
      )}

      {filtered.length === 0 && (
        <div className="text-center py-12 text-on-surface-variant">No templates found matching your search.</div>
      )}

      {/* CTA */}
      <div className="bg-gradient-to-r from-primary to-purple-700 rounded-2xl p-8 text-center">
        <h3 className="text-2xl font-bold text-white mb-2">Ready to create your brief?</h3>
        <p className="text-indigo-100 mb-4">Choose a template and start with clarity.</p>
        <Link to="/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary font-semibold rounded-xl hover:shadow-lg transition">
          Go to New Brief
          <Icon name="arrow_forward" className="text-[18px]" />
        </Link>
      </div>
    </div>
  );
}

function TemplateCard({ template: t }) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(`/templates/${t.id}`)}
      className="bg-white rounded-xl p-5 border border-outline-variant hover:shadow-md hover:border-primary/30 transition-all group text-left">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors">{t.name}</h3>
          <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{t.description}</p>
        </div>
        <Icon name={t.categoryIcon} className="text-[22px] text-primary shrink-0 ml-3" />
      </div>
      <div className="flex items-center justify-between mt-4 pt-3 border-t border-outline-variant">
        <span className="text-[10px] text-outline">Used {t.usageCount} times</span>
        <span className="text-xs text-primary font-semibold flex items-center gap-1 group-hover:gap-2 transition-all">
          Use template
          <Icon name="arrow_forward" className="text-[14px]" />
        </span>
      </div>
    </button>
  );
}
