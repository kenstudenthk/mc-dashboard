import React from "react";
import { CheckCircle, XCircle, Loader2, Minus } from "lucide-react";
import type { ImportProgress } from "./BulkImportTypes";

interface Props {
  progress: ImportProgress[];
  onClose: () => void;
}

export function ImportingStep({ progress, onClose }: Props): React.ReactElement {
  const total = progress.length;
  const successCount = progress.filter((p) => p.status === "success").length;
  const errorCount = progress.filter((p) => p.status === "error").length;
  const doneCount = successCount + errorCount;
  const isComplete = doneCount === total && total > 0;
  const pct = total > 0 ? Math.round((doneCount / total) * 100) : 0;

  return (
    <div className="px-6 py-5 space-y-5">
      {/* Progress bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-[#1d1d1f]">
            {isComplete ? "Import complete" : `Importing… ${doneCount} / ${total}`}
          </span>
          <span className="text-sm text-[#9f9b93]">{pct}%</span>
        </div>
        <div className="w-full h-2 bg-[#eee9df] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${pct}%`,
              backgroundColor: isComplete && errorCount > 0 ? "#fc7981" : "#078a52",
            }}
          />
        </div>
      </div>

      {/* Summary (shown when complete) */}
      {isComplete && (
        <div
          className="rounded-xl px-4 py-3 text-sm font-medium border"
          style={{
            backgroundColor: errorCount > 0 ? "#fff5f5" : "#f0fdf4",
            borderColor: errorCount > 0 ? "#fc7981" : "#84e7a5",
            color: errorCount > 0 ? "#c0392b" : "#02492a",
          }}
        >
          {successCount} order{successCount !== 1 ? "s" : ""} imported successfully
          {errorCount > 0 && `, ${errorCount} failed.`}
          {errorCount === 0 && "."}
        </div>
      )}

      {/* Row list */}
      <div className="overflow-y-auto max-h-64 space-y-1 pr-1">
        {progress.map((p) => (
          <div
            key={p.rowIndex}
            className="flex items-start gap-3 py-1.5 px-2 rounded-lg text-sm"
          >
            <span className="mt-0.5 shrink-0">
              {p.status === "pending" && <Minus className="w-4 h-4 text-[#9f9b93]" />}
              {p.status === "importing" && (
                <Loader2 className="w-4 h-4 animate-spin text-[#fbbd41]" />
              )}
              {p.status === "success" && (
                <CheckCircle className="w-4 h-4 text-[#078a52]" />
              )}
              {p.status === "error" && (
                <XCircle className="w-4 h-4 text-[#fc7981]" />
              )}
            </span>
            <div className="flex-1 min-w-0">
              <span
                className={
                  p.status === "success"
                    ? "text-[#078a52] font-medium"
                    : p.status === "error"
                    ? "text-[#c0392b] font-medium"
                    : p.status === "importing"
                    ? "text-[#1d1d1f] font-medium"
                    : "text-[#9f9b93]"
                }
              >
                {p.title}
              </span>
              {p.errorMessage && (
                <p className="text-xs text-[#c0392b] mt-0.5 truncate">{p.errorMessage}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      {isComplete && (
        <div className="flex justify-end pt-2 border-t border-[#1d1d1f]/06">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg font-medium text-sm border border-[#1d1d1f]/10 bg-white text-[#1d1d1f]/70 hover:bg-[#f5f5f7] transition-colors"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
}
