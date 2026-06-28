import { useState } from "react";
import Icon from "./Icon";

export default function EmailDraft({ subject: initialSubject, body: initialBody, onCopy }) {
  const [subject, setSubject] = useState(initialSubject || "");
  const [body, setBody] = useState(initialBody || "");
  const [activeTab, setActiveTab] = useState("edit");

  const gmailUrl = () => {
    const to = "";
    const su = encodeURIComponent(subject);
    const bd = encodeURIComponent(body);
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${bd}`;
  };

  return (
    <div className="space-y-stack-md">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-headline-md text-headline-md">Draft Outreach Email</h3>
        <div className="flex flex-wrap gap-2">
          <a href={gmailUrl()} target="_blank" rel="noopener noreferrer"
            className="rounded-full bg-surface/90 p-2 shadow-sm hover:shadow-md transition-shadow" title="Send in Gmail">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20">
              <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-1.023.94-1.64 1.99-1.64h-.002L22.01 3.817c1.05 0 1.99.617 1.99 1.64z" fill="#EA4335"/>
              <path d="M0 5.457L12 12.526l12-7.069" fill="none" stroke="#FFFFFF" stroke-width="2"/>
            </svg>
          </a>
          <button onClick={() => onCopy(body)}
            className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container" title="Copy to clipboard">
            <Icon name="content_copy" />
          </button>
          <button className="rounded-full p-2 text-on-surface-variant hover:bg-surface-container" title="Edit">
            <Icon name="edit" />
          </button>
        </div>
      </div>

      <div>
        <label className="block font-label-sm text-label-sm uppercase text-on-surface-variant tracking-wider mb-1">Subject</label>
        <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
          className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 font-body-md dark:bg-surface-container-low" />
      </div>

      <div className="flex gap-1 border-b border-outline-variant">
        {["edit", "preview"].map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-2 text-xs font-medium border-b-2 transition font-label-sm uppercase tracking-wider ${
              activeTab === tab ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "edit" ? (
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={14}
          className="w-full rounded-lg border border-outline-variant bg-surface px-4 py-3 font-body-md text-on-surface resize-none focus:outline-none focus:border-primary dark:bg-surface-container-low" />
      ) : (
        <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-stack-md dark:bg-surface-container-low">
          <div style={{ whiteSpace: "pre-wrap", fontFamily: "Inter, sans-serif", fontSize: "14px", lineHeight: "1.6" }} className="text-on-surface">
            {body}
          </div>
        </div>
      )}
    </div>
  );
}
