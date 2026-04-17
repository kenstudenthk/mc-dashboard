import React from "react";
import { AlertTriangle, CheckCircle } from "lucide-react";
import type { ValidationResult, ParsedRow } from "./BulkImportTypes";

interface Props {
  result: ValidationResult;
  onProceed: (validRows: ParsedRow[]) => void;
  onBack: () => void;
}

export function ValidationStep({ result, onProceed, onBack }: Props): React.ReactElement {
  const { valid, errors } = result;
  const errorRowCount = new Set(errors.map((e) => e.rowIndex)).size;
  const canProceed = valid.length > 0;

  return (
    <div className="px-6 py-5 space-y-4">
      {/* Summary pills */}
      <div className="flex items-center gap-3 flex-wrap">
        <span
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border"
          style={{ backgroundColor: "#f0fdf4", borderColor: "#84e7a5", color: "#02492a" }}
        >
          <CheckCircle className="w-3.5 h-3.5" />
          {valid.length} valid row{valid.length !== 1 ? "s" : ""}
        </span>
        {errorRowCount > 0 && (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border"
            style={{ backgroundColor: "#fff5f5", borderColor: "#fc7981", color: "#c0392b" }}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {errorRowCount} row{errorRowCount !== 1 ? "s" : ""} with errors
          </span>
        )}
      </div>

      {/* Mixed warning */}
      {errorRowCount > 0 && canProceed && (
        <div
          className="rounded-xl px-4 py-3 text-sm border"
          style={{ backgroundColor: "#fffbeb", borderColor: "#fbbd41", color: "#7c5a00" }}
        >
          <strong>{errorRowCount} row{errorRowCount !== 1 ? "s" : ""} will be skipped.</strong>{" "}
          Proceeding with {valid.length} valid row{valid.length !== 1 ? "s" : ""} only.
        </div>
      )}

      {/* No valid rows */}
      {!canProceed && (
        <div
          className="rounded-xl px-4 py-3 text-sm border"
          style={{ backgroundColor: "#fff5f5", borderColor: "#fc7981", color: "#c0392b" }}
        >
          No valid rows found. Fix the errors below and re-upload.
        </div>
      )}

      {/* Error table */}
      {errors.length > 0 && (
        <div className="overflow-auto max-h-60 rounded-xl border border-[#dad4c8]">
          <table className="w-full text-sm">
            <thead className="bg-red-50/60 sticky top-0">
              <tr>
                {["Row", "Field", "Issue"].map((col) => (
                  <th
                    key={col}
                    className="label-text px-4 py-2.5 text-left text-[#9f9b93] border-b border-[#dad4c8]"
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {errors.map((err, i) => (
                <tr
                  key={i}
                  className="border-b border-[#1d1d1f]/04 bg-red-50/20 hover:bg-red-50/40"
                >
                  <td className="px-4 py-2 text-[#9f9b93] whitespace-nowrap">{err.rowIndex}</td>
                  <td className="px-4 py-2 font-medium text-[#1d1d1f] whitespace-nowrap">{err.field}</td>
                  <td className="px-4 py-2 text-[#55534e]">{err.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Footer */}
      <div className="flex justify-between items-center pt-2 border-t border-[#1d1d1f]/06">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg font-medium text-sm border border-[#1d1d1f]/10 bg-white text-[#1d1d1f]/70 hover:bg-[#f5f5f7] transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => onProceed(valid)}
          disabled={!canProceed}
          className="px-5 py-2 rounded-lg font-medium text-sm text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#078a52" }}
        >
          Proceed with {valid.length} valid row{valid.length !== 1 ? "s" : ""}
        </button>
      </div>
    </div>
  );
}
