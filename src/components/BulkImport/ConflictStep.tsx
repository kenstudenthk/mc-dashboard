import React, { useState } from "react";
import type { ConflictItem } from "./BulkImportTypes";

interface Props {
  conflicts: ConflictItem[];
  onResolved: (resolved: ConflictItem[]) => void;
  onBack: () => void;
}

export function ConflictStep({ conflicts, onResolved, onBack }: Props): React.ReactElement {
  const [local, setLocal] = useState<ConflictItem[]>(() =>
    conflicts.map((c) => ({ ...c })),
  );

  const resolve = (importedName: string, resolution: "accept" | "reject"): void => {
    setLocal((prev) =>
      prev.map((c) => (c.importedName === importedName ? { ...c, resolution } : c)),
    );
  };

  const pendingCount = local.filter((c) => c.resolution === "pending").length;
  const allResolved = pendingCount === 0;

  return (
    <div className="px-6 py-5 space-y-4">
      <p className="text-sm text-[#55534e]">
        We found potential name matches with existing customers. Please confirm each one.
      </p>

      {/* Status bar */}
      <div className="text-xs text-[#9f9b93]">
        {allResolved
          ? "All conflicts resolved."
          : `${local.length - pendingCount} of ${local.length} resolved.`}
      </div>

      {/* Conflict cards */}
      <div className="space-y-3 overflow-y-auto max-h-72 pr-1">
        {local.map((conflict) => (
          <div
            key={conflict.importedName}
            className="rounded-xl border border-[#dad4c8] overflow-hidden"
          >
            <div className="grid grid-cols-2 divide-x divide-[#dad4c8] text-sm">
              <div className="px-4 py-3 bg-[#faf9f7]">
                <div className="label-text text-[#9f9b93] mb-1">In your file</div>
                <div className="font-semibold text-[#1d1d1f]">{conflict.importedName}</div>
              </div>
              <div className="px-4 py-3 bg-white">
                <div className="label-text text-[#9f9b93] mb-1">Existing customer</div>
                <div className="font-semibold text-[#1d1d1f]">{conflict.suggestedName}</div>
                <div className="text-xs text-[#9f9b93] mt-0.5">
                  {Math.round(conflict.similarity * 100)}% match
                </div>
              </div>
            </div>
            <div className="flex border-t border-[#dad4c8]">
              <button
                onClick={() => resolve(conflict.importedName, "accept")}
                className="flex-1 py-2 text-sm font-medium transition-colors"
                style={
                  conflict.resolution === "accept"
                    ? {
                        backgroundColor: "#f0fdf4",
                        color: "#02492a",
                        borderRight: "1px solid #84e7a5",
                      }
                    : { color: "#55534e" }
                }
              >
                Use existing
              </button>
              <button
                onClick={() => resolve(conflict.importedName, "reject")}
                className="flex-1 py-2 text-sm font-medium transition-colors"
                style={
                  conflict.resolution === "reject"
                    ? { backgroundColor: "#faf9f7", color: "#1d1d1f" }
                    : { color: "#55534e" }
                }
              >
                Keep as-is
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center pt-2 border-t border-[#1d1d1f]/06">
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg font-medium text-sm border border-[#1d1d1f]/10 bg-white text-[#1d1d1f]/70 hover:bg-[#f5f5f7] transition-colors"
        >
          Back
        </button>
        <button
          onClick={() => onResolved(local)}
          disabled={!allResolved}
          className="px-5 py-2 rounded-lg font-medium text-sm text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: "#078a52" }}
        >
          Continue
        </button>
      </div>
    </div>
  );
}
