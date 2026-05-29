import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Plus,
  Filter,
  MoreHorizontal,
  Eye,
  Search,
  RefreshCw,
  Upload,
  ClipboardList,
  Pin,
  PinOff,
  LayoutList,
  Clock,
  CheckCircle2,
  PencilLine,
  MessageSquareText,
  X,
  Check,
} from "lucide-react";
import { TutorTooltip } from "../components/TutorTooltip";
import { CloudProviderLogo } from "../components/CloudProviderLogo";
import { CreateOrderInput, Order, orderService } from "../services/orderService";
import { Customer } from "../services/customerService";
import { usePermission } from "../contexts/PermissionContext";
import {
  useCustomers,
  useInvalidateOrders,
  useInvalidateCustomers,
  useInitialOrders,
  useIsBackgroundLoading,
} from "../services/useOrdersQuery";
import { BulkImportModal } from "../components/BulkImport/BulkImportModal";
import { pinnedOrderService } from "../services/pinnedOrderService";
import { DataEditTable } from "../components/DataEditMode/DataEditTable";
import {
  normalizeCloudProvider,
  CANONICAL_PROVIDERS,
} from "../constants/cloudProviders";

const formatDate = (iso: string): string => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString("en-GB", { month: "short" });
    const year = String(d.getFullYear()).slice(2);
    return `${day}-${month}-${year}`;
  } catch {
    return iso;
  }
};

const isToday = (isoDate: string): boolean => {
  if (!isoDate) return false;
  try {
    const d = new Date(isoDate);
    const today = new Date();
    return (
      d.getFullYear() === today.getFullYear() &&
      d.getMonth() === today.getMonth() &&
      d.getDate() === today.getDate()
    );
  } catch {
    return false;
  }
};

const dateValue = (value?: string): string =>
  value ? value.slice(0, 10) : "";

const buildOrderUpdatePayload = (
  order: Order,
  patch: Partial<CreateOrderInput>,
): Partial<CreateOrderInput> => ({
  Title: order.Title,
  CustomerID: order.CustomerID,
  CustomerName: order.CustomerName,
  PreviousName: order.PreviousName ?? "",
  OrderType: order.OrderType,
  Status: order.Status,
  SRD: dateValue(order.SRD),
  CloudProvider: order.CloudProvider,
  Amount: order.Amount ?? 0,
  AccountID: order.AccountID ?? "",
  ServiceType: order.ServiceType ?? "",
  OasisNumber: order.OasisNumber ?? "",
  OrderReceiveDate: dateValue(order.OrderReceiveDate),
  CxSCompleteDate: dateValue(order.CxSCompleteDate),
  ContactPerson: order.ContactPerson ?? "",
  ContactNo: order.ContactNo ?? "",
  ContactEmail: order.ContactEmail ?? "",
  ContactNo2: order.ContactNo2 ?? "",
  ContactEmail2: order.ContactEmail2 ?? "",
  BillingAddress: order.BillingAddress ?? "",
  BillingAccount: order.BillingAccount ?? "",
  AccountName: order.AccountName ?? "",
  AccountLoginEmail: order.AccountLoginEmail ?? "",
  Password: order.Password ?? "",
  OtherAccountInfo: order.OtherAccountInfo ?? "",
  CxSRequestNo: order.CxSRequestNo ?? "",
  CRMURL: order.CRMURL ?? "",
  TID: order.TID ?? "",
  SDNumber: order.SDNumber ?? "",
  PSJob: order.PSJob ?? "",
  T2T3: order.T2T3 ?? "",
  WelcomeLetter: order.WelcomeLetter ?? "",
  By: order.By ?? "",
  OrderFormURL: order.OrderFormURL ?? "",
  CaseID: order.CaseID ?? "",
  CaseIDURL: order.CaseIDURL ?? "",
  Remark: order.Remark ?? "",
  SubName: order.SubName ?? "",
  SAId: order.SA_Id,
  ...patch,
});

function TableSkeleton() {
  return (
    <>
      {[...Array(8)].map((_, i) => (
        <tr key={i} className="border-b border-[#1d1d1f]/04 animate-pulse">
          <td className="px-3 py-3">
            <div className="h-3.5 bg-gray-200 rounded w-24" />
          </td>
          <td className="px-3 py-3">
            <div className="h-3.5 bg-gray-100 rounded w-36" />
          </td>
          <td className="px-3 py-3">
            <div className="h-3.5 bg-gray-100 rounded w-20" />
          </td>
          <td className="px-3 py-3">
            <div className="h-3.5 bg-gray-100 rounded w-28" />
          </td>
          <td className="px-3 py-3">
            <div className="h-3.5 bg-gray-100 rounded w-24" />
          </td>
          <td className="px-3 py-3">
            <div className="h-3.5 bg-gray-100 rounded w-20" />
          </td>
          <td className="px-3 py-3">
            <div className="h-3.5 bg-gray-100 rounded w-16" />
          </td>
          <td className="px-3 py-3">
            <div className="h-5 bg-gray-200 rounded-full w-20" />
          </td>
          <td className="px-3 py-3">
            <div className="h-7 bg-gray-100 rounded-lg w-8 ml-auto" />
          </td>
          <td className="px-3 py-3" />
        </tr>
      ))}
    </>
  );
}

function SortIcon({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  if (!active)
    return (
      <span className="ml-1 opacity-0 group-hover:opacity-40 text-[10px]">
        ↕
      </span>
    );
  return (
    <span className="ml-1 text-[#0071e3] text-[10px]">
      {dir === "asc" ? "↑" : "↓"}
    </span>
  );
}

const PAGE_SIZE = 20;

const STATUS_OPTIONS = [
  "Processing",
  "Pending for order issued",
  "Pending for other parties",
  "Account Created",
  "Completed",
  "Cancelled",
];

const ORDER_TYPE_OPTIONS = [
  "New Install",
  "Misc Change",
  "Contract Renewal",
  "Termination",
  "Pre-Pro",
];

const buildCustomerMap = (customers: Customer[]): Map<string, number> => {
  const map = new Map<string, number>();
  customers.forEach((c) => {
    if (c.Title) map.set(c.Title.toLowerCase(), c.id);
  });
  return map;
};

type SortKey =
  | "id"
  | "Title"
  | "CustomerName"
  | "CloudProvider"
  | "AccountID"
  | "CaseID"
  | "CxSRequestNo"
  | "SRD"
  | "Status";
type SortDir = "asc" | "desc";

const OrderRegistry = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => searchParams.get("tab") || "All");
  const [showFilters, setShowFilters] = useState(false);
  const [providerFilter, setProviderFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [orderTypeFilter, setOrderTypeFilter] = useState(() => searchParams.get("orderType") || "All");
  const [srdFrom, setSrdFrom] = useState("");
  const [srdTo, setSrdTo] = useState("");
  const srdTodayParam = searchParams.get("srdToday") === "true";
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [statusDropdownId, setStatusDropdownId] = useState<number | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey>("id");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeRemarkId, setActiveRemarkId] = useState<number | null>(null);
  const [editingRemarkId, setEditingRemarkId] = useState<number | null>(null);
  const [remarkDraft, setRemarkDraft] = useState("");
  const [savingRemarkId, setSavingRemarkId] = useState<number | null>(null);
  const [caseIdEditId, setCaseIdEditId] = useState<number | null>(null);
  const [caseIdDraft, setCaseIdDraft] = useState({ CaseID: "", CaseIDURL: "" });
  const [savingCaseId, setSavingCaseId] = useState<number | null>(null);
  const [crmEditId, setCrmEditId] = useState<number | null>(null);
  const [crmDraft, setCrmDraft] = useState({ CxSRequestNo: "", CRMURL: "" });
  const [savingCrmId, setSavingCrmId] = useState<number | null>(null);

  const { userEmail } = usePermission();
  const {
    data: initialData,
    isLoading: ordersLoading,
    isError: ordersError,
  } = useInitialOrders();
  const { data: customersData, isLoading: customersLoading } = useCustomers();
  const isFetching = useIsBackgroundLoading();
  const invalidateOrders = useInvalidateOrders();
  const invalidateCustomers = useInvalidateCustomers();

  const allOrders: Order[] = Array.isArray(initialData) ? initialData : [];
  const customerMap = buildCustomerMap(
    Array.isArray(customersData) ? customersData : [],
  );
  const customerFilterId = searchParams.get("customerId");
  const customerFilterName = searchParams.get("customer");

  const loading = ordersLoading || customersLoading;

  const handleRefresh = () => {
    invalidateOrders();
    invalidateCustomers();
  };

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    activeTab,
    providerFilter,
    statusFilter,
    orderTypeFilter,
    srdFrom,
    srdTo,
    searchQuery,
    customerFilterId,
    customerFilterName,
  ]);

  // Close status dropdown on outside click
  useEffect(() => {
    if (statusDropdownId === null) return;
    const handler = () => setStatusDropdownId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [statusDropdownId]);

  useEffect(() => {
    if (activeRemarkId === null) return;
    const handler = () => {
      setActiveRemarkId(null);
      setEditingRemarkId(null);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [activeRemarkId]);

  useEffect(() => {
    if (caseIdEditId === null) return;
    const handler = () => setCaseIdEditId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [caseIdEditId]);

  useEffect(() => {
    if (crmEditId === null) return;
    const handler = () => setCrmEditId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [crmEditId]);

  useEffect(() => {
    if (!userEmail) return;
    pinnedOrderService
      .getPinned(userEmail)
      .then((ids) => setPinnedIds(new Set(ids)))
      .catch(() => {
        /* silently degrade — no pins shown */
      });
  }, [userEmail]);

  const handleStatusChange = async (order: Order, newStatus: string) => {
    setStatusDropdownId(null);
    const orderId = order.id;
    setUpdatingStatusId(orderId);
    try {
      await orderService.update(
        orderId,
        buildOrderUpdatePayload(order, { Status: newStatus }),
        userEmail,
      );
      invalidateOrders();
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const handleRemarkOpen = (order: Order) => {
    const isOpen = activeRemarkId === order.id;
    setStatusDropdownId(null);
    setActiveRemarkId(isOpen ? null : order.id);
    setEditingRemarkId(null);
    setRemarkDraft(order.Remark ?? "");
  };

  const handleRemarkSave = async (order: Order) => {
    setSavingRemarkId(order.id);
    try {
      await orderService.update(
        order.id,
        buildOrderUpdatePayload(order, { Remark: remarkDraft }),
        userEmail,
      );
      invalidateOrders();
      setEditingRemarkId(null);
      setActiveRemarkId(null);
    } finally {
      setSavingRemarkId(null);
    }
  };

  const renderRemarkPopover = (
    order: Order,
    align: "left" | "right" = "right",
  ) => {
    const isEditing = editingRemarkId === order.id;
    const isSaving = savingRemarkId === order.id;
    const remark = order.Remark?.trim();

    return (
      <div
        className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-xl border border-[#1d1d1f]/10 bg-white shadow-[0_18px_45px_rgba(29,29,31,0.18)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-[#1d1d1f]/08 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#1d1d1f]/40">
            Remarks
          </span>
          <div className="flex items-center gap-1">
            {!isEditing && (
              <TutorTooltip
                text="Edit the remarks saved on this order."
                position="top"
                wrapperClass="inline-flex"
                componentName="OrderRegistry.Remarks"
              >
                <button
                  type="button"
                  title="Edit remark"
                  onClick={() => {
                    setEditingRemarkId(order.id);
                    setRemarkDraft(order.Remark ?? "");
                  }}
                  className="rounded-md p-1 text-[#1d1d1f]/35 transition-colors hover:bg-[#f5f5f7] hover:text-[#0071e3]"
                >
                  <PencilLine className="h-3.5 w-3.5" />
                </button>
              </TutorTooltip>
            )}
            <TutorTooltip
              text="Close the remarks panel."
              position="top"
              wrapperClass="inline-flex"
              componentName="OrderRegistry.Remarks"
            >
              <button
                type="button"
                title="Close remarks"
                onClick={() => {
                  setActiveRemarkId(null);
                  setEditingRemarkId(null);
                }}
                className="rounded-md p-1 text-[#1d1d1f]/35 transition-colors hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </TutorTooltip>
          </div>
        </div>
        <div className="p-3">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={remarkDraft}
                onChange={(e) => setRemarkDraft(e.target.value)}
                rows={5}
                className="w-full resize-none rounded-lg border border-[#1d1d1f]/10 bg-[#faf9f7] px-3 py-2 text-sm text-[#1d1d1f]/75 outline-none transition-all focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15"
                placeholder="Add remarks..."
                autoFocus
              />
              <div className="flex items-center justify-end gap-1.5">
                <TutorTooltip
                  text="Discard remark edits."
                  position="top"
                  wrapperClass="inline-flex"
                  componentName="OrderRegistry.Remarks"
                >
                  <button
                    type="button"
                    title="Cancel edit"
                    onClick={() => {
                      setEditingRemarkId(null);
                      setRemarkDraft(order.Remark ?? "");
                    }}
                    className="rounded-lg border border-[#1d1d1f]/10 bg-white p-1.5 text-[#1d1d1f]/45 transition-colors hover:bg-[#f5f5f7]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </TutorTooltip>
                <TutorTooltip
                  text="Save remark changes."
                  position="top"
                  wrapperClass="inline-flex"
                  componentName="OrderRegistry.Remarks"
                >
                  <button
                    type="button"
                    title="Save remark"
                    disabled={isSaving}
                    onClick={() => handleRemarkSave(order)}
                    className="rounded-lg bg-[#0071e3] p-1.5 text-white transition-colors hover:bg-[#005bb5] disabled:opacity-50"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </TutorTooltip>
              </div>
            </div>
          ) : (
            <p className="max-h-48 overflow-y-auto whitespace-pre-wrap text-sm leading-5 text-[#1d1d1f]/70">
              {remark || "No remarks yet."}
            </p>
          )}
        </div>
      </div>
    );
  };

  const handleCaseIdOpen = (order: Order) => {
    const isOpen = caseIdEditId === order.id;
    setCaseIdEditId(isOpen ? null : order.id);
    setCaseIdDraft({
      CaseID: order.CaseID ?? "",
      CaseIDURL: order.CaseIDURL ?? "",
    });
  };

  const handleCaseIdSave = async (order: Order) => {
    setSavingCaseId(order.id);
    try {
      await orderService.update(
        order.id,
        buildOrderUpdatePayload(order, {
          CaseID: caseIdDraft.CaseID,
          CaseIDURL: caseIdDraft.CaseIDURL,
        }),
        userEmail,
      );
      invalidateOrders();
      setCaseIdEditId(null);
    } finally {
      setSavingCaseId(null);
    }
  };

  const renderCaseIdPopover = (
    order: Order,
    align: "left" | "right" = "left",
  ) => {
    const isSaving = savingCaseId === order.id;
    return (
      <div
        className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full z-50 mt-2 w-72 rounded-xl border border-[#1d1d1f]/10 bg-white shadow-[0_18px_45px_rgba(29,29,31,0.18)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-[#1d1d1f]/08 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#1d1d1f]/40">
            Edit Case ID
          </span>
          <button
            type="button"
            onClick={() => setCaseIdEditId(null)}
            className="rounded-md p-1 text-[#1d1d1f]/35 transition-colors hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="space-y-2.5 p-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#1d1d1f]/40">
              Case ID
            </label>
            <input
              type="text"
              value={caseIdDraft.CaseID}
              onChange={(e) =>
                setCaseIdDraft((d) => ({ ...d, CaseID: e.target.value }))
              }
              className="w-full rounded-lg border border-[#1d1d1f]/10 bg-[#faf9f7] px-3 py-1.5 text-sm text-[#1d1d1f]/75 outline-none transition-all focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15"
              placeholder="e.g. CS-12345"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#1d1d1f]/40">
              Case URL
            </label>
            <input
              type="url"
              value={caseIdDraft.CaseIDURL}
              onChange={(e) =>
                setCaseIdDraft((d) => ({ ...d, CaseIDURL: e.target.value }))
              }
              className="w-full rounded-lg border border-[#1d1d1f]/10 bg-[#faf9f7] px-3 py-1.5 text-sm text-[#1d1d1f]/75 outline-none transition-all focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15"
              placeholder="https://..."
            />
          </div>
          <div className="flex items-center justify-end gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => setCaseIdEditId(null)}
              className="rounded-lg border border-[#1d1d1f]/10 bg-white px-3 py-1.5 text-xs text-[#1d1d1f]/45 transition-colors hover:bg-[#f5f5f7]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleCaseIdSave(order)}
              className="rounded-lg bg-[#0071e3] px-3 py-1.5 text-xs text-white transition-colors hover:bg-[#005bb5] disabled:opacity-50"
            >
              {isSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handleCrmOpen = (order: Order) => {
    const isOpen = crmEditId === order.id;
    setCaseIdEditId(null);
    setCrmEditId(isOpen ? null : order.id);
    setCrmDraft({
      CxSRequestNo: order.CxSRequestNo ?? "",
      CRMURL: order.CRMURL ?? "",
    });
  };

  const handleCrmSave = async (order: Order) => {
    setSavingCrmId(order.id);
    try {
      await orderService.update(
        order.id,
        buildOrderUpdatePayload(order, {
          CxSRequestNo: crmDraft.CxSRequestNo,
          CRMURL: crmDraft.CRMURL,
        }),
        userEmail,
      );
      invalidateOrders();
      setCrmEditId(null);
    } finally {
      setSavingCrmId(null);
    }
  };

  const renderCrmPopover = (
    order: Order,
    align: "left" | "right" = "left",
  ) => {
    const isSaving = savingCrmId === order.id;
    return (
      <div
        className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full z-50 mt-2 w-72 rounded-xl border border-[#1d1d1f]/10 bg-white shadow-[0_18px_45px_rgba(29,29,31,0.18)]`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-[#1d1d1f]/08 px-3 py-2">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#1d1d1f]/40">
            Edit CRM URL
          </span>
          <button
            type="button"
            onClick={() => setCrmEditId(null)}
            className="rounded-md p-1 text-[#1d1d1f]/35 transition-colors hover:bg-[#f5f5f7] hover:text-[#1d1d1f]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="space-y-2.5 p-3">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#1d1d1f]/40">
              CxS / WFM No.
            </label>
            <input
              type="text"
              value={crmDraft.CxSRequestNo}
              onChange={(e) =>
                setCrmDraft((d) => ({ ...d, CxSRequestNo: e.target.value }))
              }
              className="w-full rounded-lg border border-[#1d1d1f]/10 bg-[#faf9f7] px-3 py-1.5 text-sm text-[#1d1d1f]/75 outline-none transition-all focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15"
              placeholder="e.g. 9026052706927440"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-[#1d1d1f]/40">
              CRMURL
            </label>
            <input
              type="url"
              value={crmDraft.CRMURL}
              onChange={(e) =>
                setCrmDraft((d) => ({ ...d, CRMURL: e.target.value }))
              }
              className="w-full rounded-lg border border-[#1d1d1f]/10 bg-[#faf9f7] px-3 py-1.5 text-sm text-[#1d1d1f]/75 outline-none transition-all focus:border-[#0071e3] focus:ring-2 focus:ring-[#0071e3]/15"
              placeholder="https://..."
            />
          </div>
          <div className="flex items-center justify-end gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => setCrmEditId(null)}
              className="rounded-lg border border-[#1d1d1f]/10 bg-white px-3 py-1.5 text-xs text-[#1d1d1f]/45 transition-colors hover:bg-[#f5f5f7]"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleCrmSave(order)}
              className="rounded-lg bg-[#0071e3] px-3 py-1.5 text-xs text-white transition-colors hover:bg-[#005bb5] disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const handlePinToggle = async (orderId: number) => {
    const isPinned = pinnedIds.has(orderId);
    const prev = new Set(pinnedIds);
    setPinnedIds((s) => {
      const next = new Set(s);
      if (isPinned) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
    try {
      if (isPinned) {
        await pinnedOrderService.unpin(userEmail, orderId);
      } else {
        await pinnedOrderService.pin(userEmail, orderId);
      }
    } catch {
      setPinnedIds(prev);
    }
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const uniqueStatuses = Array.from(
    new Set(allOrders.map((o) => o.Status).filter(Boolean)),
  ).sort();

  const activeFilterCount = [
    providerFilter !== "All",
    statusFilter !== "All",
    orderTypeFilter !== "All",
    Boolean(srdFrom),
    Boolean(srdTo),
    srdTodayParam,
    Boolean(customerFilterId || customerFilterName),
  ].filter(Boolean).length;

  const clearCustomerFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("customerId");
    next.delete("customer");
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    setProviderFilter("All");
    setStatusFilter("All");
    setOrderTypeFilter("All");
    setSrdFrom("");
    setSrdTo("");
    const next = new URLSearchParams(searchParams);
    next.delete("customerId");
    next.delete("customer");
    next.delete("srdToday");
    setSearchParams(next);
  };

  const terminatedAccountIds = allOrders
    .filter((order) => order.OrderType === "Termination" && order.AccountID)
    .map((order) => order.AccountID);

  const filteredOrders = [...allOrders]
    .filter((order) => {
      if (activeTab === "Pending") {
        if (["Completed", "Cancelled"].includes(order.Status)) return false;
      } else if (activeTab === "Completed") {
        if (order.Status !== "Completed") return false;
      }

      if (
        providerFilter !== "All" &&
        normalizeCloudProvider(order.CloudProvider ?? "") !== providerFilter
      ) {
        return false;
      }

      if (statusFilter !== "All" && order.Status !== statusFilter) {
        return false;
      }

      if (orderTypeFilter !== "All" && order.OrderType !== orderTypeFilter) {
        return false;
      }

      if (srdFrom && (!order.SRD || order.SRD < srdFrom)) {
        return false;
      }

      if (srdTo && (!order.SRD || order.SRD > srdTo)) {
        return false;
      }

      if (srdTodayParam && !isToday(order.SRD)) {
        return false;
      }

      if (
        customerFilterId &&
        Number(order.CustomerID) !== Number(customerFilterId)
      ) {
        return false;
      }

      if (
        !customerFilterId &&
        customerFilterName &&
        (order.CustomerName ?? "").toLowerCase() !==
          customerFilterName.toLowerCase()
      ) {
        return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const haystack = [
          order.Title,
          order.CustomerName,
          order.AccountID,
          order.AccountName,
          order.CaseID,
          order.CloudProvider,
          order.OrderType,
          order.Status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(query)) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (sortKey === "id") {
        return sortDir === "asc" ? a.id - b.id : b.id - a.id;
      }
      const aVal = (a[sortKey] ?? "") as string;
      const bVal = (b[sortKey] ?? "") as string;
      const cmp = aVal.localeCompare(bVal, undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    })
    .sort((a, b) => {
      const aPinned = pinnedIds.has(a.id) ? 1 : 0;
      const bPinned = pinnedIds.has(b.id) ? 1 : 0;
      return bPinned - aPinned;
    });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pagedOrders = filteredOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const rangeStart =
    filteredOrders.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filteredOrders.length);

  // Apply customer filter before computing tab counts so tab badges reflect the current customer scope
  const customerScopedOrders = allOrders.filter((o) => {
    if (customerFilterId)
      return Number(o.CustomerID) === Number(customerFilterId);
    if (customerFilterName)
      return (
        (o.CustomerName ?? "").toLowerCase() ===
        customerFilterName.toLowerCase()
      );
    return true;
  });
  const pendingCount = customerScopedOrders.filter(
    (o) => !["Completed", "Cancelled"].includes(o.Status),
  ).length;
  const completedCount = customerScopedOrders.filter(
    (o) => o.Status === "Completed",
  ).length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-100 text-green-700";
      case "Account Created":
        return "bg-blue-100 text-blue-700";
      case "Processing":
        return "bg-yellow-100 text-yellow-700";
      case "Pending for order issued":
        return "bg-orange-100 text-orange-700";
      case "Cancelled":
        return "bg-red-100 text-red-700";
      case "Pending for other parties":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] gap-4">
      {/* Page-level toolbar: Refresh + Import + Edit Mode in top-right */}
      <div className="flex items-center justify-end gap-2 shrink-0">
        <TutorTooltip
          text="Refresh orders and customer data from the latest source records."
          position="bottom"
          wrapperClass="inline-block"
          componentName="OrderRegistry.Toolbar"
        >
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="px-3 py-1.5 rounded-lg font-medium text-sm border border-[#1d1d1f]/10 bg-white text-[#1d1d1f]/70 hover:bg-[#f5f5f7] flex items-center gap-1.5 disabled:opacity-50 transition-colors"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
            />
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
        </TutorTooltip>
        <TutorTooltip
          text="Open the bulk import flow to upload multiple orders at once."
          position="bottom"
          wrapperClass="inline-block"
          componentName="OrderRegistry.Toolbar"
        >
          <button
            onClick={() => setShowBulkImport(true)}
            className="px-3 py-1.5 rounded-lg font-medium text-sm border border-[#1d1d1f]/10 bg-white text-[#1d1d1f]/70 hover:bg-[#f5f5f7] flex items-center gap-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            Import
          </button>
        </TutorTooltip>
        <TutorTooltip
          text="Switch to the editable table for bulk field updates. Use Exit Edit to return to the registry view."
          position="bottom"
          wrapperClass="inline-block"
          componentName="OrderRegistry.Toolbar"
        >
          <button
            onClick={() => setIsEditMode((v) => !v)}
            className={`px-3 py-1.5 rounded-lg font-medium text-sm border flex items-center gap-1.5 transition-colors ${
              isEditMode
                ? "border-orange-300 bg-orange-50 text-orange-700 hover:bg-orange-100"
                : "border-[#1d1d1f]/10 bg-white text-[#1d1d1f]/70 hover:bg-[#f5f5f7]"
            }`}
          >
            <PencilLine className="w-3.5 h-3.5" />
            {isEditMode ? "Exit Edit" : "Edit Mode"}
          </button>
        </TutorTooltip>
      </div>

      {ordersError && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm">
          <span className="font-medium">Failed to load orders.</span>
          <span className="text-red-500">
            Check that the API URL is configured and the Power Automate flow is
            running.
          </span>
          <button
            onClick={handleRefresh}
            className="ml-auto underline hover:no-underline shrink-0"
          >
            Retry
          </button>
        </div>
      )}
      {isEditMode ? (
        <DataEditTable orders={allOrders} onExit={() => setIsEditMode(false)} />
      ) : (
        <div className="relative flex flex-col flex-1 min-h-0 pt-2">
          {/* Row 1: Tabs + New Order */}
          <div className="flex items-end justify-between gap-3 px-2">
            <TutorTooltip
              text="Use these tabs to quickly filter between All orders, Pending orders, and Completed orders."
              position="bottom"
              wrapperClass="flex-1 sm:flex-none"
            >
              <div className="flex min-w-0 items-end gap-1 overflow-x-auto overflow-y-hidden pt-2">
                {(
                  [
                    {
                      key: "All",
                      label: "All Orders",
                      count: customerScopedOrders.length,
                      Icon: LayoutList,
                      accent: "bg-[#fbbd41]",
                      tilt: "-rotate-[0.6deg]",
                    },
                    {
                      key: "Pending",
                      label: "Pending",
                      count: pendingCount,
                      Icon: Clock,
                      accent: "bg-[#3bd3fd]",
                      tilt: "rotate-[0.5deg]",
                    },
                    {
                      key: "Completed",
                      label: "Completed",
                      count: completedCount,
                      Icon: CheckCircle2,
                      accent: "bg-[#84e7a5]",
                      tilt: "-rotate-[0.4deg]",
                    },
                  ] as {
                    key: string;
                    label: string;
                    count: number;
                    Icon: React.ElementType;
                    accent: string;
                    tilt: string;
                  }[]
                ).map(({ key, label, count, Icon, accent, tilt }) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`group relative flex origin-bottom items-center gap-2 overflow-hidden rounded-t-[1.35rem] border px-4 text-sm font-semibold transition-all duration-300 ease-out whitespace-nowrap ${
                      activeTab === key
                        ? "z-20 -mb-px -translate-y-2 scale-[1.03] border-[#dad4c8] border-b-white bg-white py-3.5 text-black shadow-[rgba(0,0,0,0.12)_0px_-1px_1px_inset,rgba(0,0,0,0.08)_0px_8px_18px]"
                        : `z-10 translate-y-1 ${tilt} border-[#dad4c8] bg-[#eee9df] py-2.5 text-[#55534e] shadow-[rgba(0,0,0,0.05)_0px_2px_0px] hover:-translate-y-1 hover:rotate-0 hover:bg-[#f5f3ef] hover:text-black`
                    }`}
                  >
                    <span
                      className={`absolute inset-x-0 top-0 h-1 ${accent} transition-all duration-300 ${
                        activeTab === key ? "opacity-100" : "opacity-70"
                      }`}
                    />
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold transition-transform duration-300 group-hover:scale-110 ${
                        activeTab === key
                          ? "bg-black text-white"
                          : "bg-black/[0.08] text-[#55534e]"
                      }`}
                    >
                      {count}
                    </span>
                  </button>
                ))}
              </div>
            </TutorTooltip>
            <TutorTooltip
              text="Click here to create a new cloud service order. You will be asked to fill out customer and service details."
              position="bottom"
              wrapperClass="inline-block shrink-0"
            >
              <Link
                to="/orders/new"
                className="mb-2 flex items-center gap-1.5 rounded-xl border border-black bg-black px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#333]"
              >
                <Plus className="w-3.5 h-3.5" />
                New Order
              </Link>
            </TutorTooltip>
          </div>

          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-b-2xl rounded-tr-2xl border border-[#dad4c8] bg-white shadow-[rgba(0,0,0,0.1)_0px_1px_1px,rgba(0,0,0,0.04)_0px_-1px_1px_inset,rgba(0,0,0,0.05)_0px_-0.5px_1px]">
            {/* Row 2: Search */}
            <div className="border-b border-[#dad4c8] bg-white px-4 py-3">
              <TutorTooltip
                text="Search for a specific order by typing the Service No, Customer Name, Account ID, or Account Name. Click the filter icon on the right to show additional filters."
                position="bottom"
                wrapperClass="relative w-full"
              >
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#1d1d1f]/30" />
                  <input
                    type="text"
                    placeholder="Search service no., customer, account, case, provider, type, or status..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-9 py-1.5 text-sm bg-[#f5f5f7] border border-[#1d1d1f]/06 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all"
                  />
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    title="Toggle filters"
                    className={`absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-md px-1.5 py-1 text-xs font-semibold transition-colors ${
                      showFilters
                        ? "text-[#0071e3]"
                        : "text-[#1d1d1f]/35 hover:text-[#0071e3] hover:bg-[#0071e3]/08"
                    }`}
                  >
                    <Filter className="w-3.5 h-3.5" />
                    {activeFilterCount > 0 && (
                      <span className="rounded-full bg-black px-1.5 py-0.5 text-[10px] leading-none text-white">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>
                </div>
              </TutorTooltip>
            </div>

            {showFilters && (
              <div className="flex flex-wrap items-end gap-3 border-b border-[#dad4c8] bg-[#faf9f7] p-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-[#1d1d1f]/60">
                    Provider:
                  </label>
                  <TutorTooltip
                    text="Filter orders by cloud provider."
                    position="bottom"
                    wrapperClass="inline-block"
                    componentName="OrderRegistry.Filters"
                  >
                    <select
                      value={providerFilter}
                      onChange={(e) => setProviderFilter(e.target.value)}
                      className="text-sm border border-[#1d1d1f]/08 rounded-lg px-3 py-1.5 bg-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 text-[#1d1d1f]"
                    >
                      <option value="All">All Providers</option>
                      {CANONICAL_PROVIDERS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </TutorTooltip>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-[#1d1d1f]/60">
                    Status:
                  </label>
                  <TutorTooltip
                    text="Filter orders by current status."
                    position="bottom"
                    wrapperClass="inline-block"
                    componentName="OrderRegistry.Filters"
                  >
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      className="text-sm border border-[#1d1d1f]/08 rounded-lg px-3 py-1.5 bg-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 text-[#1d1d1f]"
                    >
                      <option value="All">All Statuses</option>
                      {uniqueStatuses.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </TutorTooltip>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-[#1d1d1f]/60">
                    Order Type:
                  </label>
                  <TutorTooltip
                    text="Filter orders by order type."
                    position="bottom"
                    wrapperClass="inline-block"
                    componentName="OrderRegistry.Filters"
                  >
                    <select
                      value={orderTypeFilter}
                      onChange={(e) => setOrderTypeFilter(e.target.value)}
                      className="rounded-lg border border-[#1d1d1f]/08 bg-white px-3 py-1.5 text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                    >
                      <option value="All">All Types</option>
                      {ORDER_TYPE_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </TutorTooltip>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-medium text-[#1d1d1f]/60">
                    SRD:
                  </label>
                  <TutorTooltip
                    text="Set the earliest Service Ready Date to include."
                    position="bottom"
                    wrapperClass="inline-block"
                    componentName="OrderRegistry.Filters"
                  >
                    <input
                      type="date"
                      value={srdFrom}
                      onChange={(e) => setSrdFrom(e.target.value)}
                      className="rounded-lg border border-[#1d1d1f]/08 bg-white px-3 py-1.5 text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                    />
                  </TutorTooltip>
                  <span className="text-xs text-[#1d1d1f]/35">to</span>
                  <TutorTooltip
                    text="Set the latest Service Ready Date to include."
                    position="bottom"
                    wrapperClass="inline-block"
                    componentName="OrderRegistry.Filters"
                  >
                    <input
                      type="date"
                      value={srdTo}
                      onChange={(e) => setSrdTo(e.target.value)}
                      className="rounded-lg border border-[#1d1d1f]/08 bg-white px-3 py-1.5 text-sm text-[#1d1d1f] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20"
                    />
                  </TutorTooltip>
                </div>
                {activeFilterCount > 0 && (
                  <TutorTooltip
                    text="Remove every active filter and show the full order list again."
                    position="bottom"
                    wrapperClass="ml-auto inline-block"
                    componentName="OrderRegistry.Filters"
                  >
                    <button
                      type="button"
                      onClick={clearAllFilters}
                      className="rounded-lg border border-[#dad4c8] bg-white px-3 py-1.5 text-xs font-semibold text-[#55534e] hover:bg-[#f5f5f7]"
                    >
                      Clear All
                    </button>
                  </TutorTooltip>
                )}
              </div>
            )}

            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-b border-[#1d1d1f]/06 bg-white px-4 py-2 text-xs">
                <span className="font-semibold text-[#9f9b93]">
                  {filteredOrders.length} results
                </span>
                {customerFilterName && (
                  <TutorTooltip
                    text="Remove the customer filter."
                    position="bottom"
                    wrapperClass="inline-block"
                    componentName="OrderRegistry.FilterChips"
                  >
                    <button
                      type="button"
                      onClick={clearCustomerFilter}
                      className="inline-flex items-center gap-1 rounded-full bg-[#eee9df] px-2.5 py-1 font-semibold text-[#55534e]"
                    >
                      Customer: {customerFilterName}
                      <X className="h-3 w-3" />
                    </button>
                  </TutorTooltip>
                )}
                {providerFilter !== "All" && (
                  <TutorTooltip
                    text="Remove the provider filter."
                    position="bottom"
                    wrapperClass="inline-block"
                    componentName="OrderRegistry.FilterChips"
                  >
                    <button
                      type="button"
                      onClick={() => setProviderFilter("All")}
                      className="inline-flex items-center gap-1 rounded-full bg-[#eee9df] px-2.5 py-1 font-semibold text-[#55534e]"
                    >
                      Provider: {providerFilter}
                      <X className="h-3 w-3" />
                    </button>
                  </TutorTooltip>
                )}
                {statusFilter !== "All" && (
                  <TutorTooltip
                    text="Remove the status filter."
                    position="bottom"
                    wrapperClass="inline-block"
                    componentName="OrderRegistry.FilterChips"
                  >
                    <button
                      type="button"
                      onClick={() => setStatusFilter("All")}
                      className="inline-flex items-center gap-1 rounded-full bg-[#eee9df] px-2.5 py-1 font-semibold text-[#55534e]"
                    >
                      Status: {statusFilter}
                      <X className="h-3 w-3" />
                    </button>
                  </TutorTooltip>
                )}
                {orderTypeFilter !== "All" && (
                  <TutorTooltip
                    text="Remove the order type filter."
                    position="bottom"
                    wrapperClass="inline-block"
                    componentName="OrderRegistry.FilterChips"
                  >
                    <button
                      type="button"
                      onClick={() => setOrderTypeFilter("All")}
                      className="inline-flex items-center gap-1 rounded-full bg-[#eee9df] px-2.5 py-1 font-semibold text-[#55534e]"
                    >
                      Type: {orderTypeFilter}
                      <X className="h-3 w-3" />
                    </button>
                  </TutorTooltip>
                )}
                {(srdFrom || srdTo) && (
                  <TutorTooltip
                    text="Remove the Service Ready Date filter."
                    position="bottom"
                    wrapperClass="inline-block"
                    componentName="OrderRegistry.FilterChips"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setSrdFrom("");
                        setSrdTo("");
                      }}
                      className="inline-flex items-center gap-1 rounded-full bg-[#eee9df] px-2.5 py-1 font-semibold text-[#55534e]"
                    >
                      SRD: {srdFrom || "Any"} - {srdTo || "Any"}
                      <X className="h-3 w-3" />
                    </button>
                  </TutorTooltip>
                )}
              </div>
            )}

            <div className="overflow-x-auto flex-1 overflow-y-auto">
              <table className="w-full text-left">
                <thead className="sticky top-0 z-10 hidden md:table-header-group">
                  <tr className="h-11 border-b border-[#dad4c8] bg-[#f5f3ef]">
                    <th className="w-6 p-0" />
                    <th className="px-3 py-3">
                      <TutorTooltip
                        text="Sort by Service No. Click to toggle ascending/descending."
                        position="top"
                        wrapperClass="inline-block w-full"
                        componentName="OrderRegistry.Table.Header"
                      >
                        <button
                          className="flex w-full cursor-pointer select-none items-center text-left text-xs font-semibold text-[#55534e] transition-colors hover:text-black"
                          onClick={() => handleSort("Title")}
                        >
                          Service No.
                          <SortIcon
                            active={sortKey === "Title"}
                            dir={sortDir}
                          />
                        </button>
                      </TutorTooltip>
                    </th>
                    <th className="px-3 py-3 min-w-[200px]">
                      <TutorTooltip
                        text="Sort by Company Name."
                        position="top"
                        wrapperClass="inline-block w-full"
                        componentName="OrderRegistry.Table.Header"
                      >
                        <button
                          className="text-[10px] uppercase tracking-wider font-semibold text-[#1d1d1f]/40 whitespace-nowrap cursor-pointer select-none group hover:text-[#1d1d1f]/70 transition-colors w-full text-left flex items-center"
                          onClick={() => handleSort("CustomerName")}
                        >
                          Company Name
                          <SortIcon
                            active={sortKey === "CustomerName"}
                            dir={sortDir}
                          />
                        </button>
                      </TutorTooltip>
                    </th>
                    <th className="px-3 py-3">
                      <TutorTooltip
                        text="Sort by Cloud Provider."
                        position="top"
                        wrapperClass="inline-block w-full"
                        componentName="OrderRegistry.Table.Header"
                      >
                        <button
                          className="text-[10px] uppercase tracking-wider font-semibold text-[#1d1d1f]/40 whitespace-nowrap cursor-pointer select-none group hover:text-[#1d1d1f]/70 transition-colors w-full text-left flex items-center"
                          onClick={() => handleSort("CloudProvider")}
                        >
                          Product Subscribe
                          <SortIcon
                            active={sortKey === "CloudProvider"}
                            dir={sortDir}
                          />
                        </button>
                      </TutorTooltip>
                    </th>
                    <th className="px-3 py-3 w-[100px]">
                      <TutorTooltip
                        text="Sort by Account ID."
                        position="top"
                        wrapperClass="inline-block w-full"
                        componentName="OrderRegistry.Table.Header"
                      >
                        <button
                          className="text-[10px] uppercase tracking-wider font-semibold text-[#1d1d1f]/40 whitespace-nowrap cursor-pointer select-none group hover:text-[#1d1d1f]/70 transition-colors w-full text-left flex items-center"
                          onClick={() => handleSort("AccountID")}
                        >
                          Account ID
                          <SortIcon
                            active={sortKey === "AccountID"}
                            dir={sortDir}
                          />
                        </button>
                      </TutorTooltip>
                    </th>
                    <th className="px-3 py-3">
                      <TutorTooltip
                        text="Sort by Case ID."
                        position="top"
                        wrapperClass="inline-block w-full"
                        componentName="OrderRegistry.Table.Header"
                      >
                        <button
                          className="text-[10px] uppercase tracking-wider font-semibold text-[#1d1d1f]/40 whitespace-nowrap cursor-pointer select-none group hover:text-[#1d1d1f]/70 transition-colors w-full text-left flex items-center"
                          onClick={() => handleSort("CaseID")}
                        >
                          Case ID
                          <SortIcon
                            active={sortKey === "CaseID"}
                            dir={sortDir}
                          />
                        </button>
                      </TutorTooltip>
                    </th>
                    <th className="px-3 py-3">
                      <TutorTooltip
                        text="Sort by CxS / WFM No."
                        position="top"
                        wrapperClass="inline-block w-full"
                        componentName="OrderRegistry.Table.Header"
                      >
                        <button
                          className="text-[10px] uppercase tracking-wider font-semibold text-[#1d1d1f]/40 whitespace-nowrap cursor-pointer select-none group hover:text-[#1d1d1f]/70 transition-colors w-full text-left flex items-center"
                          onClick={() => handleSort("CxSRequestNo")}
                        >
                          CxS / WFM No.
                          <SortIcon
                            active={sortKey === "CxSRequestNo"}
                            dir={sortDir}
                          />
                        </button>
                      </TutorTooltip>
                    </th>
                    <th className="px-3 py-3 w-[90px]">
                      <TutorTooltip
                        text="Sort by Service Ready Date."
                        position="top"
                        wrapperClass="inline-block w-full"
                        componentName="OrderRegistry.Table.Header"
                      >
                        <button
                          className="text-[10px] uppercase tracking-wider font-semibold text-[#1d1d1f]/40 whitespace-nowrap cursor-pointer select-none group hover:text-[#1d1d1f]/70 transition-colors w-full text-left flex items-center"
                          onClick={() => handleSort("SRD")}
                        >
                          SRD
                          <SortIcon active={sortKey === "SRD"} dir={sortDir} />
                        </button>
                      </TutorTooltip>
                    </th>
                    <th className="px-3 py-3 w-[110px]">
                      <TutorTooltip
                        text="Sort by Order Status."
                        position="top"
                        wrapperClass="inline-block w-full"
                        componentName="OrderRegistry.Table.Header"
                      >
                        <button
                          className="text-[10px] uppercase tracking-wider font-semibold text-[#1d1d1f]/40 whitespace-nowrap cursor-pointer select-none group hover:text-[#1d1d1f]/70 transition-colors w-full text-left flex items-center"
                          onClick={() => handleSort("Status")}
                        >
                          Status
                          <SortIcon
                            active={sortKey === "Status"}
                            dir={sortDir}
                          />
                        </button>
                      </TutorTooltip>
                    </th>
                    <th className="px-3 py-3 text-[10px] uppercase tracking-wider font-semibold text-[#1d1d1f]/40 text-right whitespace-nowrap">
                      Remarks
                    </th>
                    <th className="px-3 py-3 text-[10px] uppercase tracking-wider font-semibold text-[#1d1d1f]/40 text-right whitespace-nowrap">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <TableSkeleton />
                  ) : pagedOrders.length > 0 ? (
                    pagedOrders.map((order) => {
                      const isTerminated =
                        terminatedAccountIds.includes(order.AccountID) &&
                        order.OrderType !== "Termination";

                      return (
                        <>
                          {/* ── Mobile card (hidden on md+) ── */}
                          <tr
                            key={`card-${order.id}`}
                            className="md:hidden border-b border-[#1d1d1f]/04"
                          >
                            <td colSpan={11} className="px-4 py-3">
                              <div
                                className={`rounded-xl border p-3 gap-2 flex flex-col ${
                                  isTerminated
                                    ? "bg-red-50/40 border-red-100"
                                    : pinnedIds.has(order.id)
                                      ? "bg-blue-50/30 border-[#094cb2]/20 border-l-4 border-l-[#094cb2]"
                                      : "bg-white border-[#1d1d1f]/06"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex flex-col gap-0.5 min-w-0">
                                    <Link
                                      to={`/orders/${order.id}`}
                                      className={`text-xs font-semibold truncate ${
                                        isTerminated
                                          ? "text-red-600"
                                          : "text-[#0071e3]"
                                      }`}
                                    >
                                      {order.Title}
                                    </Link>
                                    <span
                                      className={`text-xs truncate ${
                                        isTerminated
                                          ? "text-red-500"
                                          : "text-[#1d1d1f]/70"
                                      }`}
                                    >
                                      {order.CustomerName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    <TutorTooltip
                                      text={
                                        pinnedIds.has(order.id)
                                          ? "Unpin this order from the top of the list."
                                          : "Pin this order to the top of the list."
                                      }
                                      position="bottom"
                                      wrapperClass="inline-flex"
                                      componentName="OrderRegistry.MobileActions"
                                    >
                                      <button
                                        onClick={() => handlePinToggle(order.id)}
                                        className={`p-1 rounded-lg transition-colors ${
                                          pinnedIds.has(order.id)
                                            ? "text-[#094cb2]"
                                            : "text-[#1d1d1f]/25"
                                        }`}
                                      >
                                        {pinnedIds.has(order.id) ? (
                                          <Pin className="w-3.5 h-3.5 fill-current" />
                                        ) : (
                                          <Pin className="w-3.5 h-3.5" />
                                        )}
                                      </button>
                                    </TutorTooltip>
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap flex-shrink-0 ${getStatusColor(
                                        order.Status,
                                      )}`}
                                    >
                                      {order.Status}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between gap-2 mt-1">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="text-[10px] text-[#1d1d1f]/40 uppercase tracking-wider label-text">
                                      Product
                                    </span>
                                    <CloudProviderLogo
                                      provider={order.CloudProvider ?? ""}
                                      size={16}
                                      nameClassName={`text-xs font-medium ${isTerminated ? "text-red-600" : "text-[#1d1d1f]"}`}
                                    />
                                    {isTerminated && (
                                      <span className="mt-0.5 text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full uppercase tracking-wider w-fit">
                                        Terminated
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex flex-col gap-0.5 text-right">
                                    <span className="text-[10px] text-[#1d1d1f]/40 uppercase tracking-wider label-text">
                                      SRD
                                    </span>
                                    <span
                                      className={`text-xs ${
                                        isTerminated
                                          ? "text-red-500"
                                          : "text-[#1d1d1f]/45"
                                      }`}
                                    >
                                      {formatDate(order.SRD)}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <div
                                      className="relative"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <TutorTooltip
                                        text="View or edit remarks for this order."
                                        position="left"
                                        wrapperClass="inline-flex"
                                        componentName="OrderRegistry.MobileActions"
                                      >
                                        <button
                                          type="button"
                                          title="View remarks"
                                          onClick={() => handleRemarkOpen(order)}
                                          className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${
                                            order.Remark?.trim()
                                              ? "bg-amber-50 text-amber-700"
                                              : isTerminated
                                                ? "bg-red-50 text-red-400"
                                                : "bg-[#f5f5f7] text-[#1d1d1f]/35"
                                          }`}
                                        >
                                          <MessageSquareText className="w-4 h-4" />
                                        </button>
                                      </TutorTooltip>
                                      {activeRemarkId === order.id &&
                                        renderRemarkPopover(order, "right")}
                                    </div>
                                    <TutorTooltip
                                      text="Open this order's detail page."
                                      position="left"
                                      wrapperClass="inline-flex"
                                      componentName="OrderRegistry.MobileActions"
                                    >
                                      <Link
                                        to={`/orders/${order.id}`}
                                        className={`p-1.5 rounded-lg flex-shrink-0 ${
                                          isTerminated
                                            ? "text-red-400 bg-red-50"
                                            : "text-[#1d1d1f]/35 bg-[#f5f5f7]"
                                        }`}
                                      >
                                        <Eye className="w-4 h-4" />
                                      </Link>
                                    </TutorTooltip>
                                  </div>
                                </div>
                                <div className="mt-1 text-[10px] leading-none text-[#1d1d1f]/35">
                                  ID #{order.id}
                                </div>
                              </div>
                            </td>
                          </tr>

                          {/* ── Desktop table row (hidden on mobile) ── */}
                          <tr
                            key={order.id}
                            onClick={() =>
                              setSelectedOrderId(
                                selectedOrderId === order.id ? null : order.id,
                              )
                            }
                            className={`border-b border-[#1d1d1f]/04 transition-colors group hidden md:table-row cursor-pointer ${
                              isTerminated
                                ? "bg-red-50/30 hover:bg-red-50/60 border-l-2 border-l-red-300"
                                : pinnedIds.has(order.id)
                                  ? "bg-blue-50/30 hover:bg-blue-50/60"
                                  : selectedOrderId === order.id
                                    ? "bg-[#e8f0fe] border-l-2 border-l-[#0071e3]"
                                    : "hover:bg-[#f0f5ff] hover:border-l-2 hover:border-l-[#0071e3]"
                            }`}
                          >
                            {/* Pin column — outside data area */}
                            <td
                              className="w-6 p-0 text-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePinToggle(order.id);
                              }}
                            >
                              <TutorTooltip
                                text={
                                  pinnedIds.has(order.id)
                                    ? "Unpin this order from the top of the list."
                                    : "Pin this order to the top of the list."
                                }
                                position="right"
                                wrapperClass="inline-flex"
                                componentName="OrderRegistry.Table.Actions"
                              >
                                {pinnedIds.has(order.id) ? (
                                  <Pin className="w-3.5 h-3.5 fill-current text-red-500 rotate-90 mx-auto" />
                                ) : (
                                  <Pin className="w-3.5 h-3.5 text-[#1d1d1f]/25 rotate-90 mx-auto transition-opacity" />
                                )}
                              </TutorTooltip>
                            </td>
                            <td
                              className={`px-3 py-3 text-xs font-semibold hover:underline ${
                                isTerminated ? "text-red-600" : "text-[#0071e3]"
                              }`}
                            >
                              <div className="flex min-h-9 flex-col justify-between gap-1">
                                <Link to={`/orders/${order.id}`}>
                                  {order.Title}
                                </Link>
                                <span className="text-[10px] font-normal leading-none text-[#1d1d1f]/35">
                                  ID #{order.id}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-3 text-sm font-medium min-w-[200px]">
                              {customerMap.get(
                                (order.CustomerName ?? "").toLowerCase(),
                              ) ? (
                                <Link
                                  to={`/customers/${customerMap.get((order.CustomerName ?? "").toLowerCase())}`}
                                  className={`hover:underline transition-colors ${
                                    isTerminated
                                      ? "text-red-500 hover:text-red-700"
                                      : "text-[#1d1d1f]/70 hover:text-[#0071e3]"
                                  }`}
                                >
                                  {order.CustomerName}
                                </Link>
                              ) : (
                                <span
                                  className={
                                    isTerminated
                                      ? "text-red-500"
                                      : "text-[#1d1d1f]/70"
                                  }
                                >
                                  {order.CustomerName}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <CloudProviderLogo
                                  provider={order.CloudProvider ?? ""}
                                  size={20}
                                  nameClassName={`text-sm font-medium ${isTerminated ? "text-red-600" : "text-[#1d1d1f]"}`}
                                />
                                {isTerminated && (
                                  <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wider whitespace-nowrap">
                                    Terminated
                                  </span>
                                )}
                              </div>
                            </td>
                            <td
                              className={`px-3 py-3 font-mono text-xs truncate w-[100px] max-w-[100px] ${
                                isTerminated
                                  ? "text-red-500"
                                  : "text-[#1d1d1f]/45"
                              }`}
                              title={order.AccountID}
                            >
                              {order.AccountID ?? "—"}
                            </td>
                            <td
                              className="px-3 py-3 text-xs max-w-[140px]"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="relative flex items-center gap-1 group/caseid">
                                <div className="min-w-0 flex-1 truncate">
                                  {order.CaseID ? (
                                    order.CaseIDURL ? (
                                      <a
                                        href={order.CaseIDURL}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`block truncate hover:underline font-medium ${isTerminated ? "text-red-600" : "text-[#0071e3]"}`}
                                        title={order.CaseID}
                                      >
                                        {order.CaseID}
                                      </a>
                                    ) : (
                                      <span
                                        className={`block truncate ${isTerminated ? "text-red-600" : "text-[#1d1d1f]/60"}`}
                                        title={order.CaseID}
                                      >
                                        {order.CaseID}
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-[#1d1d1f]/25">—</span>
                                  )}
                                </div>
                                <TutorTooltip
                                  text="Edit the Case ID and optional case link for this order."
                                  position="top"
                                  wrapperClass="inline-flex flex-shrink-0"
                                  componentName="OrderRegistry.Table.Actions"
                                >
                                  <button
                                    type="button"
                                    title="Edit Case ID"
                                    onClick={() => handleCaseIdOpen(order)}
                                    className="flex-shrink-0 rounded p-0.5 text-[#1d1d1f]/25 opacity-0 transition-all hover:bg-blue-50 hover:text-[#0071e3] group-hover/caseid:opacity-100"
                                  >
                                    <PencilLine className="h-3 w-3" />
                                  </button>
                                </TutorTooltip>
                                {caseIdEditId === order.id &&
                                  renderCaseIdPopover(order)}
                              </div>
                            </td>
                            <td
                              className={`px-3 py-3 text-xs ${
                                isTerminated
                                  ? "text-red-500"
                                  : "text-[#1d1d1f]/55"
                              }`}
                            >
                              <div
                                className="group/cxs relative flex items-center gap-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <div className="min-w-0 flex-1">
                                  {order.CxSRequestNo ? (
                                    order.CRMURL ? (
                                      <a
                                        href={order.CRMURL}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block truncate text-[#0071e3] hover:underline"
                                        title={order.CxSRequestNo}
                                      >
                                        {order.CxSRequestNo}
                                      </a>
                                    ) : (
                                      <span
                                        className={`block truncate ${isTerminated ? "text-red-500" : "text-[#1d1d1f]/55"}`}
                                        title={order.CxSRequestNo}
                                      >
                                        {order.CxSRequestNo}
                                      </span>
                                    )
                                  ) : (
                                    <span className="text-[#1d1d1f]/25">—</span>
                                  )}
                                </div>
                                <TutorTooltip
                                  text="Edit the CxS / WFM number and optional CRM link for this order."
                                  position="top"
                                  wrapperClass="inline-flex flex-shrink-0"
                                  componentName="OrderRegistry.Table.Actions"
                                >
                                  <button
                                    type="button"
                                    title="Edit CRM URL"
                                    onClick={() => handleCrmOpen(order)}
                                    className="flex-shrink-0 rounded p-0.5 text-[#1d1d1f]/25 opacity-0 transition-all hover:bg-blue-50 hover:text-[#0071e3] group-hover/cxs:opacity-100"
                                  >
                                    <PencilLine className="h-3 w-3" />
                                  </button>
                                </TutorTooltip>
                                {crmEditId === order.id && renderCrmPopover(order)}
                              </div>
                            </td>
                            <td
                              className={`px-3 py-3 text-xs w-[90px] ${
                                isTerminated
                                  ? "text-red-500"
                                  : "text-[#1d1d1f]/45"
                              }`}
                            >
                              {formatDate(order.SRD)}
                            </td>
                            <td className="px-3 py-3">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${getStatusColor(
                                  order.Status,
                                )}`}
                              >
                                {order.Status}
                              </span>
                            </td>
                            <td
                              className="px-3 py-3 text-right"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="relative inline-flex">
                                <TutorTooltip
                                  text="View or edit remarks for this order."
                                  position="left"
                                  wrapperClass="inline-flex"
                                  componentName="OrderRegistry.Table.Actions"
                                >
                                  <button
                                    type="button"
                                    title="View remarks"
                                    onClick={() => handleRemarkOpen(order)}
                                    className={`rounded-lg p-1.5 transition-colors ${
                                      order.Remark?.trim()
                                        ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
                                        : isTerminated
                                          ? "text-red-400 hover:bg-red-50 hover:text-red-600"
                                          : "text-[#1d1d1f]/35 hover:bg-[#f5f5f7] hover:text-[#0071e3]"
                                    }`}
                                  >
                                    <MessageSquareText className="h-4 w-4" />
                                  </button>
                                </TutorTooltip>
                                {activeRemarkId === order.id &&
                                  renderRemarkPopover(order)}
                              </div>
                            </td>
                            <td className="px-3 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <div className="flex items-center gap-1.5 opacity-100 transition-opacity">
                                  <TutorTooltip
                                    text="Open this order's detail page."
                                    position="top"
                                    wrapperClass="inline-flex"
                                    componentName="OrderRegistry.Table.Actions"
                                  >
                                    <Link
                                      to={`/orders/${order.id}`}
                                      className={`p-1.5 rounded-lg transition-colors ${
                                        isTerminated
                                          ? "text-red-400 hover:text-red-600 hover:bg-red-50"
                                          : "text-[#1d1d1f]/35 hover:text-[#0071e3] hover:bg-blue-50"
                                      }`}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Link>
                                  </TutorTooltip>
                                  {/* Change Status */}
                                  <div
                                    className="relative"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <TutorTooltip
                                      text="Open the status menu for this order."
                                      position="top"
                                      wrapperClass="inline-flex"
                                      componentName="OrderRegistry.Table.Actions"
                                    >
                                      <button
                                        onClick={() =>
                                          setStatusDropdownId(
                                            statusDropdownId === order.id
                                              ? null
                                              : order.id,
                                          )
                                        }
                                        disabled={updatingStatusId === order.id}
                                        title="Change Status"
                                        className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                                          isTerminated
                                            ? "text-red-400 hover:text-red-600 hover:bg-red-50"
                                            : "text-[#1d1d1f]/35 hover:text-[#0071e3] hover:bg-blue-50"
                                        }`}
                                      >
                                        <ClipboardList className="w-4 h-4" />
                                      </button>
                                    </TutorTooltip>
                                    {statusDropdownId === order.id && (
                                      <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-[#1d1d1f]/10 rounded-xl shadow-lg py-1 min-w-[210px]">
                                        <p className="px-3 py-1.5 text-[10px] font-semibold text-[#1d1d1f]/35 uppercase tracking-wider">
                                          Change Status
                                        </p>
                                        {STATUS_OPTIONS.map((s) => (
                                          <button
                                            key={s}
                                            onClick={() =>
                                              handleStatusChange(order, s)
                                            }
                                            className={`w-full text-left px-3 py-2 text-sm transition-colors flex items-center justify-between gap-2 hover:bg-[#f5f5f7] ${
                                              order.Status === s
                                                ? "text-[#0071e3] font-medium"
                                                : "text-[#1d1d1f]/70"
                                            }`}
                                          >
                                            <span
                                              className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(s).split(" ")[0]}`}
                                            />
                                            {s}
                                            {order.Status === s && (
                                              <span className="ml-auto text-[#0071e3]">
                                                ✓
                                              </span>
                                            )}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <TutorTooltip
                                    text="Open more actions for this order when available."
                                    position="top"
                                    wrapperClass="inline-flex"
                                    componentName="OrderRegistry.Table.Actions"
                                  >
                                    <button
                                      className={`p-1.5 rounded-lg transition-colors ${
                                        isTerminated
                                          ? "text-red-400 hover:text-red-600 hover:bg-red-50"
                                          : "text-[#1d1d1f]/35 hover:text-[#1d1d1f] hover:bg-[#f5f5f7]"
                                      }`}
                                    >
                                      <MoreHorizontal className="w-4 h-4" />
                                    </button>
                                  </TutorTooltip>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={11}
                        className="px-6 py-12 text-center text-[#1d1d1f]/30 text-sm"
                      >
                        No orders found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-[#1d1d1f]/06 flex items-center justify-between text-xs text-[#1d1d1f]/45 flex-col sm:flex-row gap-2">
              <span>
                {filteredOrders.length === 0
                  ? "No entries"
                  : `Showing ${rangeStart}–${rangeEnd} of ${filteredOrders.length} entries`}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-[#1d1d1f]/08 rounded-lg hover:bg-[#f5f5f7] disabled:opacity-40 text-[#1d1d1f]/60"
                >
                  Prev
                </button>
                <span className="hidden sm:flex gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(
                      (p) =>
                        p === 1 ||
                        p === totalPages ||
                        Math.abs(p - currentPage) <= 2,
                    )
                    .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                      if (
                        idx > 0 &&
                        (p as number) - (arr[idx - 1] as number) > 1
                      )
                        acc.push("…");
                      acc.push(p);
                      return acc;
                    }, [])
                    .map((item, idx) =>
                      item === "…" ? (
                        <span
                          key={`ellipsis-${idx}`}
                          className="px-2 py-1 text-[#1d1d1f]/30"
                        >
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          onClick={() => setCurrentPage(item as number)}
                          className={`px-3 py-1 rounded-lg text-xs font-medium ${
                            currentPage === item
                              ? "bg-[#0071e3] text-white"
                              : "border border-[#1d1d1f]/08 hover:bg-[#f5f5f7] text-[#1d1d1f]/60"
                          }`}
                        >
                          {item}
                        </button>
                      ),
                    )}
                </span>
                <span className="sm:hidden px-2 py-1 text-[#1d1d1f]/60">
                  {currentPage}/{totalPages}
                </span>
                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-[#1d1d1f]/08 rounded-lg hover:bg-[#f5f5f7] disabled:opacity-40 text-[#1d1d1f]/60"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showBulkImport && (
        <BulkImportModal
          customers={
            Array.isArray(customersData) ? (customersData as Customer[]) : []
          }
          onClose={() => setShowBulkImport(false)}
          onImportComplete={() => {
            invalidateOrders();
            setShowBulkImport(false);
          }}
        />
      )}
    </div>
  );
};

export default OrderRegistry;
