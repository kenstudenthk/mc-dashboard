import React, { useRef, useState } from "react";
import { UploadCloud, Download, AlertCircle } from "lucide-react";
import { parseFile, validateRows, generateTemplate } from "../../services/bulkImportService";
import type { ParsedRow, RowError } from "./BulkImportTypes";

interface Props {
  onParsed: (valid: ParsedRow[], errors: RowError[]) => void;
}

const ACCEPTED = [".xlsx", ".csv"];

function isAccepted(file: File): boolean {
  return ACCEPTED.some(
    (ext) => file.name.toLowerCase().endsWith(ext) || file.type === "text/csv",
  );
}

export function UploadStep({ onParsed }: Props): React.ReactElement {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFile = async (file: File): Promise<void> => {
    setParseError(null);
    if (!isAccepted(file)) {
      setParseError("Only .xlsx and .csv files are supported.");
      return;
    }
    setIsProcessing(true);
    try {
      const rawRows = await parseFile(file);
      if (rawRows.length === 0) {
        setParseError("The file appears to be empty or has no data rows.");
        return;
      }
      const result = validateRows(rawRows);
      onParsed(result.valid, result.errors);
    } catch (e: unknown) {
      setParseError(
        e instanceof Error ? `Failed to parse file: ${e.message}` : "Failed to parse file.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = "";
  };

  return (
    <div className="px-6 py-5 space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className="relative flex flex-col items-center justify-center gap-3 h-48 rounded-2xl border-2 border-dashed cursor-pointer transition-colors select-none"
        style={{
          borderColor: isDragging ? "#078a52" : "#dad4c8",
          backgroundColor: isDragging ? "#f0fdf4" : "#faf9f7",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.csv"
          className="hidden"
          onChange={onInputChange}
        />
        {isProcessing ? (
          <div className="flex flex-col items-center gap-2">
            <div
              className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "#078a52", borderTopColor: "transparent" }}
            />
            <span className="text-sm text-[#55534e]">Parsing file…</span>
          </div>
        ) : (
          <>
            <UploadCloud
              className="w-10 h-10"
              style={{ color: isDragging ? "#078a52" : "#9f9b93" }}
            />
            <div className="text-center">
              <p className="text-sm font-medium text-[#1d1d1f]">
                Drop your file here, or{" "}
                <span style={{ color: "#078a52" }}>browse</span>
              </p>
              <p className="text-xs text-[#9f9b93] mt-1">Supports .xlsx and .csv</p>
            </div>
          </>
        )}
      </div>

      {/* Error message */}
      {parseError && (
        <div
          className="flex items-start gap-2 rounded-xl px-4 py-3 text-sm border"
          style={{ backgroundColor: "#fff5f5", borderColor: "#fc7981", color: "#c0392b" }}
        >
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {parseError}
        </div>
      )}

      {/* Template download */}
      <div
        className="flex items-center justify-between rounded-xl px-4 py-3 border"
        style={{ backgroundColor: "#faf9f7", borderColor: "#dad4c8" }}
      >
        <div>
          <p className="text-sm font-medium text-[#1d1d1f]">Need a template?</p>
          <p className="text-xs text-[#9f9b93] mt-0.5">
            Download the Excel template with required columns and example data.
          </p>
        </div>
        <button
          onClick={(e) => { e.stopPropagation(); generateTemplate(); }}
          className="ml-4 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-[#dad4c8] bg-white text-[#1d1d1f] hover:bg-[#f5f5f7] shrink-0 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Template
        </button>
      </div>
    </div>
  );
}
