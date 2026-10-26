"use client";

import { useRef, useState } from "react";

export function StyledFileInput({
  id,
  name,
  accept,
  required,
  label,
  hint,
  error,
}: {
  id: string;
  name: string;
  accept?: string;
  required?: boolean;
  label: string;
  hint?: string;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] ?? null;
    if (file && inputRef.current) {
      const dt = new DataTransfer();
      dt.items.add(file);
      inputRef.current.files = dt.files;
      setSelectedFile(file);
    }
  };

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    setSelectedFile(null);
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="field">
      <label htmlFor={id} className="field-label">
        {label} {required && <span aria-hidden="true" className="text-error">*</span>}
      </label>
      {hint && <span className="field-hint">{hint}</span>}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`mt-2 rounded border border-dashed p-4 transition-colors ${
          isDragging
            ? "border-maroon bg-paper-dark"
            : selectedFile
            ? "border-green-400 bg-green-50/20"
            : "border-hairline bg-paper"
        }`}
      >
        <input
          ref={inputRef}
          id={id}
          type="file"
          name={name}
          accept={accept}
          required={required}
          onChange={handleFileChange}
          className="sr-only"
        />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="btn btn-secondary btn-sm inline-flex items-center gap-2"
            >
              <svg
                className="w-4 h-4 text-secondary"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                />
              </svg>
              <span>{selectedFile ? "Change File" : "Choose File"}</span>
            </button>

            {selectedFile ? (
              <div className="text-xs">
                <span className="font-semibold text-ink">{selectedFile.name}</span>
                <span className="ml-2 text-secondary">({formatSize(selectedFile.size)})</span>
              </div>
            ) : (
              <span className="text-xs text-secondary">No file selected yet (or drag and drop here)</span>
            )}
          </div>

          {selectedFile && (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-secondary hover:text-red-700 underline text-left sm:text-right"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      {error && <span className="field-error mt-1 block">{error}</span>}
    </div>
  );
}
