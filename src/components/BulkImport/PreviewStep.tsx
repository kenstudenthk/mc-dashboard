import React from "react";
import type { FinalRow } from "./BulkImportTypes";

interface Props {
  rows: FinalRow[];
  onImport: () => void;
  onBack: () => void;
}

const formatDate = (iso: string): string => {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "2-digit" });
  } catch {
    return iso;
  }
};

const formatAmount = (n: number): string =>
  n.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export function PreviewStep({ rows, onImport, onBack }: Props): React.ReactElement {
  return (
    <div className="px-6 py-5 space-y-4">
      {/* Banner */}
      <div
        className="rounded-xl px-4 py-3 text-sm font-medium border"
        style={{ backgroundColor: "#f0fdf4", borderColor: "#84e7a5", color: "#02492a" }}
      >
        Ready to import {rows.length} order{rows.length !== 1 ? "s" : ""}.
      </div>

      {/* Preview table */}
      <div className="overflow-auto max-h-80 rounded-xl border border-[#dad4c8]">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-[#faf9f7] sticky top-0">
            <tr>
              {["#", "Service No", "Customer", "Type", "Provider", "Amount", "SRD"].map(
                (col) => (
                  <th
                    key={col}
                    className="label-text px-4 py-2.5 text-left text-[#9f9b93] whitespace-nowrap border-b border-[#dad4c8]"
                  >
                    {col}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const nameChanged = row.resolvedCustomerName !== row.CustomerName;
              return (
                <tr
                  key={row.rowIndex}
                  className="border-b border-[#1d1d1f]/04 hover:bg-[#faf9f7] transition-colors"
                >
                  <td className="px-4 py-2.5 text-[#9f9b93]">{idx + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-[#1d1d1f]">{row.Title}</td>
                  <td className="px-4 py-2.5">
                    {nameChanged ? (
                      <div>
                        <span className="line-through text-[#9f9b93] text-xs">
                          {row.CustomerName}
                        </span>
                        <div className="text-[#078a52] font-medium text-xs">
                          {row.resolvedCustomerName}
                        </div>
                      </div>
                    ) : (
                      <span className="text-[#1d1d1f]">{row.CustomerName}</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-[#55534e]">{row.OrderType}</td>
                  <td className="px-4 py-2.5 text-[#55534e]">{row.CloudProvider}</td>
                  <td className="px-4 py-2.5 text-[#1d1d1f]">{formatAmount(row.Amount)}</td>
                  <td className="px-4 py-2.5 text-[#55534e]">{formatDate(row.SRD)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
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
          onClick={onImport}
          className="gradient-cta px-5 py-2 rounded-lg font-medium text-sm shadow-sm flex items-center gap-2"
        >
          Import {rows.length} Order{rows.length !== 1 ? "s" : ""}
        </button>
      </div>
    </div>
  );
}
