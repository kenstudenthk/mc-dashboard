import React, { useState } from "react";
import { Save, ChevronDown } from "lucide-react";
import { Order, orderService } from "../../services/orderService";
import { useInvalidateOrders } from "../../services/useOrdersQuery";
import { usePermission } from "../../contexts/PermissionContext";
import { EditableCell } from "./EditableCell";
import { ColumnFilter } from "./ColumnFilter";

interface ColumnDef {
  key: keyof Order;
  label: string;
  width: string;
}

interface TabDef {
  key: string;
  label: string;
  columns: ColumnDef[];
}

const TAB_DEFS: TabDef[] = [
  {
    key: "basic",
    label: "Basic Info",
    columns: [
      { key: "Title", label: "Service No.", width: "12%" },
      { key: "CustomerName", label: "Customer", width: "18%" },
      { key: "CloudProvider", label: "Provider", width: "16%" },
      { key: "OrderType", label: "Order Type", width: "13%" },
      { key: "Status", label: "Status", width: "13%" },
      { key: "Amount", label: "Amount", width: "8%" },
      { key: "SRD", label: "SRD", width: "10%" },
      { key: "SubName", label: "Sub-Name", width: "10%" },
    ],
  },
  {
    key: "case",
    label: "Case & Dates",
    columns: [
      { key: "Title", label: "Service No.", width: "11%" },
      { key: "OasisNumber", label: "OASIS No.", width: "10%" },
      { key: "CaseID", label: "Case ID", width: "13%" },
      { key: "CaseIDURL", label: "Case URL", width: "18%" },
      { key: "OrderReceiveDate", label: "Received", width: "13%" },
      { key: "CxSCompleteDate", label: "CxS Complete", width: "13%" },
      { key: "By", label: "By", width: "11%" },
    ],
  },
  {
    key: "contact",
    label: "Contact",
    columns: [
      { key: "Title", label: "Service No.", width: "12%" },
      { key: "ContactPerson", label: "Contact", width: "15%" },
      { key: "ContactNo", label: "Phone 1", width: "13%" },
      { key: "ContactNo2", label: "Phone 2", width: "13%" },
      { key: "ContactEmail", label: "Email 1", width: "16%" },
      { key: "ContactEmail2", label: "Email 2", width: "16%" },
      { key: "BillingAddress", label: "Billing Addr.", width: "15%" },
    ],
  },
  {
    key: "account",
    label: "Account",
    columns: [
      { key: "Title", label: "Service No.", width: "11%" },
      { key: "AccountID", label: "Account ID", width: "11%" },
      { key: "AccountName", label: "Acct. Name", width: "13%" },
      { key: "AccountLoginEmail", label: "Login Email", width: "15%" },
      { key: "Password", label: "Password", width: "11%" },
      { key: "BillingAccount", label: "Billing Acct.", width: "12%" },
      { key: "ServiceType", label: "Service Type", width: "11%" },
      { key: "OtherAccountInfo", label: "Other Info", width: "16%" },
    ],
  },
  {
    key: "provision",
    label: "Provisioning",
    columns: [
      { key: "Title", label: "Service No.", width: "10%" },
      { key: "T2T3", label: "T2/T3", width: "8%" },
      { key: "WelcomeLetter", label: "Welcome Ltr", width: "9%" },
      { key: "PSJob", label: "PS Job", width: "7%" },
      { key: "CxSRequestNo", label: "CXS Request No.", width: "12%" },
      { key: "TID", label: "TID", width: "8%" },
      { key: "SDNumber", label: "SD No.", width: "8%" },
      { key: "OrderFormURL", label: "Order Form URL", width: "15%" },
      { key: "Remark", label: "Remark", width: "15%" },
    ],
  },
];

const PAGE_SIZE = 20;

interface Props {
  orders: Order[];
  onExit: () => void;
}

export function DataEditTable({ orders, onExit }: Props) {
  const { userEmail } = usePermission();
  const invalidateOrders = useInvalidateOrders();

  const [activeTab, setActiveTab] = useState("basic");
  const [dirtyMap, setDirtyMap] = useState<Map<number, Partial<Order>>>(
    new Map(),
  );
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortKey, setSortKey] = useState<keyof Order | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [columnFilters, setColumnFilters] = useState<Record<string, Set<string>>>({});
  const [openFilter, setOpenFilter] = useState<string | null>(null);

  const currentTab =
    TAB_DEFS.find((t) => t.key === activeTab) ?? TAB_DEFS[0];

  const handleCellChange = (
    orderId: number,
    field: keyof Order,
    value: string | number,
  ) => {
    setDirtyMap((prev) => {
      const next = new Map(prev);
      next.set(orderId, { ...(next.get(orderId) ?? {}), [field]: value });
      return next;
    });
  };

  const handleSort = (key: keyof Order) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setCurrentPage(1);
  };

  const sortedOrders = [...orders].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = String(a[sortKey] ?? "");
    const bVal = String(b[sortKey] ?? "");
    const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
    return sortDir === "asc" ? cmp : -cmp;
  });

  const filteredOrders = sortedOrders.filter((order) => {
    for (const [colKey, allowed] of Object.entries(columnFilters)) {
      if (allowed.size === 0) continue;
      const val = String(order[colKey as keyof Order] ?? "");
      if (!allowed.has(val)) return false;
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pagedOrders = filteredOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      for (const [id, patch] of dirtyMap) {
        // eslint-disable-next-line no-await-in-loop
        await orderService.update(
          id,
          patch as Parameters<typeof orderService.update>[1],
          userEmail,
        );
      }
      invalidateOrders();
      onExit();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setDirtyMap(new Map());
    onExit();
  };

  return (
    <div className="card overflow-hidden flex flex-col flex-1 min-h-0">
      {/* Tab bar */}
      <div className="bg-[#f4f6f8] px-4 py-3 flex items-center gap-1 border-b border-[#1d1d1f]/08 shrink-0 flex-wrap">
        {TAB_DEFS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.key
                ? "bg-black text-white shadow-sm"
                : "text-black/60 hover:bg-black/[0.06] hover:text-black"
            }`}
          >
            {tab.label}
          </button>
        ))}
        {dirtyMap.size > 0 && (
          <span className="ml-auto text-xs text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full font-medium">
            {dirtyMap.size} row{dirtyMap.size !== 1 ? "s" : ""} modified
          </span>
        )}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full table-fixed text-left">
          <thead className="sticky top-0 z-10">
            <tr className="border-b-2 border-[#1d1d1f]/10 bg-[#e8e8eb]">
              <th className="w-8 px-2 py-2 text-[10px] uppercase text-[#1d1d1f]/40 text-center">
                #
              </th>
              {currentTab.columns.map((col) => {
                const colKey = String(col.key);
                const hasActiveFilter =
                  columnFilters[colKey] != null &&
                  columnFilters[colKey].size > 0 &&
                  columnFilters[colKey].size <
                    new Set(orders.map((o) => String(o[col.key] ?? ""))).size;
                const uniqueVals = Array.from(
                  new Set(orders.map((o) => String(o[col.key] ?? ""))),
                ).sort();
                return (
                  <th
                    key={colKey}
                    style={{ width: col.width }}
                    className="relative px-2 py-2 text-[10px] uppercase tracking-wider font-semibold text-[#1d1d1f]/40 select-none hover:bg-[#dddde0] transition-colors whitespace-nowrap"
                  >
                    <div className="flex items-center gap-1">
                      <span
                        onClick={() => handleSort(col.key)}
                        className={`cursor-pointer hover:text-[#1d1d1f]/70 ${hasActiveFilter ? "text-[#0071e3]" : ""}`}
                      >
                        {col.label}
                        {sortKey === col.key && (
                          <span className="ml-1 text-[#0071e3]">
                            {sortDir === "asc" ? "↑" : "↓"}
                          </span>
                        )}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenFilter((prev) =>
                            prev === colKey ? null : colKey,
                          );
                        }}
                        className={`p-0.5 rounded transition-colors ${
                          hasActiveFilter
                            ? "text-[#0071e3]"
                            : "text-[#1d1d1f]/20 hover:text-[#1d1d1f]/50"
                        }`}
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>
                    {openFilter === colKey && (
                      <ColumnFilter
                        columnKey={colKey}
                        values={uniqueVals}
                        active={columnFilters[colKey] ?? new Set(uniqueVals)}
                        onApply={(selected) => {
                          setColumnFilters((prev) => ({
                            ...prev,
                            [colKey]: selected,
                          }));
                          setCurrentPage(1);
                        }}
                        onClose={() => setOpenFilter(null)}
                      />
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pagedOrders.map((order, idx) => {
              const patch = dirtyMap.get(order.id) ?? {};
              const rowDirty = dirtyMap.has(order.id);
              return (
                <tr
                  key={order.id}
                  className={`border-b border-[#1d1d1f]/04 ${
                    rowDirty ? "bg-yellow-50/30" : "hover:bg-[#f9f9fb]"
                  }`}
                >
                  <td className="px-2 py-1.5 text-[10px] text-[#1d1d1f]/30 text-center">
                    {(currentPage - 1) * PAGE_SIZE + idx + 1}
                  </td>
                  {currentTab.columns.map((col) => {
                    const isFieldDirty = col.key in patch;
                    const currentVal = (
                      isFieldDirty ? patch[col.key] : order[col.key]
                    ) as string | number | undefined;
                    return (
                      <td key={String(col.key)} className="px-1 py-1">
                        <EditableCell
                          field={col.key}
                          value={currentVal}
                          isDirty={isFieldDirty}
                          onChange={(v) =>
                            handleCellChange(order.id, col.key, v)
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
            {pagedOrders.length === 0 && (
              <tr>
                <td
                  colSpan={currentTab.columns.length + 1}
                  className="px-6 py-12 text-center text-[#1d1d1f]/30 text-sm"
                >
                  No orders to edit.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#1d1d1f]/06 flex items-center justify-between gap-4 bg-[#f9f9fb] shrink-0">
        <div className="flex gap-1 items-center">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border border-[#1d1d1f]/08 rounded-lg hover:bg-[#f5f5f7] disabled:opacity-40 text-xs text-[#1d1d1f]/60"
          >
            Prev
          </button>
          <span className="px-2 py-1 text-xs text-[#1d1d1f]/50">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 border border-[#1d1d1f]/08 rounded-lg hover:bg-[#f5f5f7] disabled:opacity-40 text-xs text-[#1d1d1f]/60"
          >
            Next
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-3 py-1.5 text-sm font-medium text-[#1d1d1f]/60 hover:text-[#1d1d1f] rounded-lg hover:bg-[#f5f5f7] transition-colors disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={dirtyMap.size === 0 || isSaving}
            className="px-4 py-1.5 text-sm font-medium bg-[#1d1d1f] text-white rounded-lg hover:bg-[#3d3d3f] disabled:opacity-40 transition-colors flex items-center gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            {isSaving
              ? "Saving…"
              : `Save Changes${dirtyMap.size > 0 ? ` (${dirtyMap.size})` : ""}`}
          </button>
        </div>
      </div>
    </div>
  );
}
