import React, { useEffect, useRef, useState } from "react";

interface Props {
  columnKey: string;
  values: string[];
  active: Set<string>;
  onApply: (selected: Set<string>) => void;
  onClose: () => void;
}

export function ColumnFilter({ values, active, onApply, onClose }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set(active));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const toggle = (v: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  };

  const allSelected = values.every((v) => selected.has(v));

  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(values));
  };

  return (
    <div
      ref={ref}
      className="absolute top-full left-0 mt-1 z-50 bg-white border border-[#1d1d1f]/10 rounded-xl shadow-lg py-2 min-w-[180px] max-h-64 flex flex-col"
    >
      <div className="px-3 pb-1.5 border-b border-[#1d1d1f]/06 shrink-0">
        <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-[#1d1d1f]/60 hover:text-[#1d1d1f]">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            className="rounded"
          />
          Select All
        </label>
      </div>
      <div className="overflow-y-auto flex-1 px-3 py-1">
        {values.map((v) => (
          <label
            key={v}
            className="flex items-center gap-2 cursor-pointer py-1 text-xs text-[#1d1d1f]/70 hover:text-[#1d1d1f]"
          >
            <input
              type="checkbox"
              checked={selected.has(v)}
              onChange={() => toggle(v)}
              className="rounded"
            />
            <span className="truncate" title={v}>
              {v || "—"}
            </span>
          </label>
        ))}
      </div>
      <div className="px-3 pt-1.5 border-t border-[#1d1d1f]/06 flex gap-2 shrink-0">
        <button
          onClick={() => {
            setSelected(new Set(values));
            onApply(new Set(values));
            onClose();
          }}
          className="flex-1 text-xs py-1 rounded-lg border border-[#1d1d1f]/10 text-[#1d1d1f]/50 hover:bg-[#f5f5f7] transition-colors"
        >
          Clear
        </button>
        <button
          onClick={() => {
            onApply(selected);
            onClose();
          }}
          className="flex-1 text-xs py-1 rounded-lg bg-[#0071e3] text-white hover:bg-[#005bbf] transition-colors font-medium"
        >
          Apply
        </button>
      </div>
    </div>
  );
}
