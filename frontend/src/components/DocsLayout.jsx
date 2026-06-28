import { useState } from "react";
import Icon from "./Icon";
import Breadcrumb from "./shared/Breadcrumb";
import DocSidebar from "./documentation/DocSidebar";

export default function DocsLayout({ activeSection, onSectionChange, children }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop pt-24 md:pt-28">
      {/* Mobile top bar */}
      <div className="md:hidden flex items-center justify-between mb-4">
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-surface-container">
          <Icon name="menu" />
        </button>
        <span className="font-semibold text-sm">Documentation</span>
        <div className="w-9" />
      </div>

      <div className="flex gap-8">
        <DocSidebar
          activeSection={activeSection}
          onSectionClick={onSectionChange}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />

        <div className="flex-1 min-w-0 pb-12">
          {children}
        </div>
      </div>
    </div>
  );
}
