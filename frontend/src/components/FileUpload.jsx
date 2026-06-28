import { useState, useRef } from "react";
import api from "../utils/api";
import Icon from "./Icon";

export default function FileUpload({ onTextExtracted, onError }) {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    const ok = /\.(txt|docx|pdf)$/i.test(file.name);
    if (!ok) {
      onError?.("Only .txt, .docx, and .pdf files are supported");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await api.post("/upload/extract", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onTextExtracted?.(res.data.text, res.data);
    } catch (err) {
      onError?.(err.response?.data?.error || "Failed to extract text");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFile(e.dataTransfer.files[0]);
      }}
      onClick={() => inputRef.current?.click()}
      className={`flex cursor-pointer flex-col items-center justify-center gap-stack-sm rounded-xl border-2 border-dashed p-stack-md transition ${
        dragging
          ? "border-primary bg-primary-container/10"
          : "border-outline-variant bg-surface-container-low hover:border-primary"
      } ${loading ? "pointer-events-none opacity-60" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.docx,.pdf"
        className="hidden"
        onChange={(e) => handleFile(e.target.files[0])}
      />
      {loading ? (
        <>
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="font-label-sm text-label-sm uppercase text-on-surface-variant">Extracting text...</p>
        </>
      ) : (
        <>
          <Icon name="cloud_upload" className="text-3xl text-outline-variant" />
          <p className="text-sm text-on-surface">
            <span className="font-medium text-primary">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-on-surface-variant">.txt, .docx, or .pdf (max 10MB)</p>
        </>
      )}
    </div>
  );
}
