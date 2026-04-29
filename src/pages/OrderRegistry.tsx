import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
} from "lucide-react";
import { TutorTooltip } from "../components/TutorTooltip";
import { CloudProviderLogo } from "../components/CloudProviderLogo";
import { Order, orderService } from "../services/orderService";
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

const buildCustomerMap = (customers: Customer[]): Map<string, number> => {
  const map = new Map<string, number>();
  customers.forEach((c) => {
    if (c.Title) map.set(c.Title.toLowerCase(), c.id);
  });
  return map;
};

type SortKey =
  | "Title"
  | "CustomerName"
  | "CloudProvider"
  | "AccountID"
  | "CaseID"
  | "OrderType"
  | "SRD"
  | "Status";
type SortDir = "asc" | "desc";

const OrderRegistry = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [providerFilter, setProviderFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [statusDropdownId, setStatusDropdownId] = useState<number | null>(null);
  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<number>>(new Set());
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  
    const [isEditMode, setIsEditMode] = useState(false);

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

  const loading = ordersLoading || customersLoading;

  const handleRefresh = () => {
    invalidateOrders();
    invalidateCustomers();
  };

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, providerFilter, statusFilter, searchQuery]);

  // Close status dropdown on outside click
  useEffect(() => {
    if (statusDropdownId === null) return;
    const handler = () => setStatusDropdownId(null);
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [statusDropdownId]);

  useEffect(() => {
    if (!userEmail) return;
    pinnedOrderService
      .getPinned(userEmail)
      .then((ids) => setPinnedIds(new Set(ids)))
      .catch(() => {
        /* silently degrade — no pins shown */
      });
  }, [userEmail]);

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setStatusDropdownId(null);
    setUpdatingStatusId(orderId);
    try {
      await orderService.update(orderId, { Status: newStatus }, userEmail);
      invalidateOrders();
    } finally {
      setUpdatingStatusId(null);
    }
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

  const terminatedAccountIds = allOrders
    .filter((order) => order.OrderType === "Termination" && order.AccountID)
    .map((order) => order.AccountID);

  const filteredOrders = [...allOrders]
    .sort((a, b) => b.id - a.id)
    .filter((order) => {
      if (activeTab === "Pending") {
        if (["Completed", "Cancelled"].includes(order.Status)) return false;
      } else if (activeTab === "Completed") {
        if (order.Status !== "Completed") return false;
      }

      if (
        providerFilter !== "All" &&
        !(order.CloudProvider ?? "").includes(providerFilter)
      ) {
        return false;
      }

      if (statusFilter !== "All" && order.Status !== statusFilter) {
        return false;
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !(order.Title ?? "").toLowerCase().includes(query) &&
          !(order.CustomerName ?? "").toLowerCase().includes(query) &&
          !(order.AccountID && order.AccountID.toLowerCase().includes(query))
        ) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      if (!sortKey) return 0;
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

  const pendingCount = allOrders.filter(
    (o) => !["Completed", "Cancelled"].includes(o.Status),
  ).length;
  const completedCount = allOrders.filter(
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
        <button
          onClick={() => setShowBulkImport(true)}
          className="px-3 py-1.5 rounded-lg font-medium text-sm border border-[#1d1d1f]/10 bg-white text-[#1d1d1f]/70 hover:bg-[#f5f5f7] flex items-center gap-1.5 transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          Import
        </button>
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
        <DataEditTable
          orders={allOrders}
          onExit={() => setIsEditMode(false)}
        />
      ) : (
      <div className="card overflow-hidden flex flex-col flex-1 min-h-0">
        {/* Row 1: Tabs + New Order */}
        <div className="bg-[#f4f6f8] flex items-center justify-between px-4 py-3">
          <TutorTooltip
            text="Use these tabs to quickly filter between All orders, Pending orders, and Completed orders."
            position="bottom"
            wrapperClass="flex-1 sm:flex-none"
          >
            <div className="flex items-center gap-1 bg-black/[0.08] rounded-full p-1">
              {(
                [
                  {
                    key: "All",
                    label: "All Orders",
                    count: allOrders.length,
                    Icon: LayoutList,
                  },
                  {
                    key: "Pending",
                    label: "Pending",
                    count: pendingCount,
                    Icon: Clock,
                  },
                  {
                    key: "Completed",
                    label: "Completed",
                    count: completedCount,
                    Icon: CheckCircle2,
                  },
                ] as {
                  key: string;
                  label: string;
                  count: number;
                  Icon: React.ElementType;
                }[]
              ).map(({ key, label, count, Icon }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === key
                      ? "bg-black text-white shadow-sm"
                      : "bg-transparent text-black/60 hover:bg-black/[0.06] hover:text-black"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                      activeTab === key
                        ? "bg-white/20 text-white"
                        : "bg-black/[0.08] text-black/50"
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
              className="px-4 py-1.5 rounded-lg font-medium text-sm border border-[#094cb2] text-[#094cb2] hover:bg-[#094cb2] hover:text-white transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              New Order
            </Link>
          </TutorTooltip>
        </div>

      <div className="card overflow-hidden flex flex-col flex-1 min-h-0">
        <div className="px-4 pt-0 border-b border-[#1d1d1f]/08 flex flex-col sm:flex-row justify-between items-end gap-4 bg-[#f0f0f2]">
          <TutorTooltip
            text="Search for a specific order by typing the Service No, Customer Name, or Account ID. Click the filter icon on the right to show additional filters."
            position="bottom"
            wrapperClass="relative w-full"
          >
            <div className="flex items-end gap-0 -mb-px">
              {[
                { key: "All", label: "All Orders" },
                { key: "Pending", label: "Pending" },
                { key: "Completed", label: "Completed" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`px-5 py-2.5 text-sm font-medium border-t border-l border-r rounded-t-lg transition-colors relative -mb-px ${
                    activeTab === key
                      ? "bg-white border-[#1d1d1f]/10 border-t-[#0071e3] border-t-2 text-[#1d1d1f] font-semibold border-b-white z-10"
                      : "bg-[#e8e8ea] border-transparent text-[#1d1d1f]/50 hover:text-[#1d1d1f] hover:bg-[#ebebed]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </TutorTooltip>

          <div className="flex items-center gap-2 w-full sm:w-auto pb-2">
            <TutorTooltip
              text="Search for a specific order by typing the Service No, Customer Name, or Account ID."
              position="bottom"
              wrapperClass="relative flex-1 sm:w-64"
            >
              <div className="relative flex-1 sm:w-full">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#1d1d1f]/30" />
                <input
                  type="text"
                  placeholder="Search by Service No, Account ID, Customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-sm bg-white border border-[#1d1d1f]/08 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 focus:border-[#0071e3] transition-all"
                />
              </div>
            </TutorTooltip>
            <TutorTooltip
              text="Click here to show or hide additional filters, such as filtering by Cloud Provider."
              position="bottom"
            >
              <button
                onClick={() => setShowFilters(!showFilters)}
                title="Toggle filters"
                className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors ${
                  showFilters
                    ? "text-[#0071e3]"
                    : "text-[#1d1d1f]/35 hover:text-[#0071e3] hover:bg-[#0071e3]/08"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
            </TutorTooltip>
            </div>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-[#1d1d1f]/06 bg-white flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-[#1d1d1f]/60">
                Provider:
              </label>
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="text-sm border border-[#1d1d1f]/08 rounded-lg px-3 py-1.5 bg-[#f5f5f7] focus:outline-none focus:ring-2 focus:ring-[#0071e3]/20 text-[#1d1d1f]"
              >
                <option value="All">All Providers</option>
                <option value="AWS">AWS</option>
                <option value="Azure">Azure</option>
                <option value="Huawei">Huawei Cloud</option>
                <option value="Google">GCP</option>
                <option value="AliCloud">AliCloud</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-xs font-medium text-[#1d1d1f]/60">
                Status:
              </label>
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
            </div>
          </div>
        )}

        <div className="overflow-x-auto flex-1 overflow-y-auto">
          <table className="w-full text-left">
            <thead className="hidden md:table-header-group">
              <tr className="border-b-2 border-[#1d1d1f]/10 bg-[#e8e8eb]">
                <th className="w-6 p-0" />
                <th
                  className="px-3 py-3 text-[10px] uppercase tracking-wider font-semibold text-[#1d1d1f]/40 whitespace-nowrap cursor-pointer select-none group hover:text-[#1d1d1f]/70 hover:bg-[#dddde0] transition-colors"
                  onClick={() => handleSort("Title")}
                >
                  Service No.
                  <SortIcon active={sortKey === "Title"} dir={sortDir} />
                </th>
                <th
                  className="px-3 py-3 text-[10px] uppercase tracking-wider font-semibold text-[#1d1d1f]/40 whitespace-nowrap min-w-[200px] cursor-pointer select-none group hover:text-[#1d1d1f]/70 hover:bg-[#dddde0] transition-colors"
                  onClick={() => handleSort("CustomerName")}
                >
                  Company Name
                  <SortIcon active={sortKey === "CustomerName"} dir={sortDir} />
                </th>
                <th
                  className="px-3 py-3 text-[10px] uppercase tracking-wider font-semibold text-[#1d1d1f]/40 whitespace-nowrap cursor-pointer select-none group hover:text-[#1d1d1f]/70 hover:bg-[#dddde0] transition-colors"
                  onClick={() => handleSort("CloudProvider")}
                >
                  Product Subscribe
                  <SortIcon
                    active={sortKey === "CloudProvider"}
                    dir={sortDir}
                  />
                </th>
                <th
                  className="px-3 py-3 text-[10px] uppercase tracking-wider font-semibold text-[#1d1d1f]/40 whitespace-nowrap w-[100px] cursor-pointer select-none group hover:text-[#1d1d1f]/70 hover:bg-[#dddde0] transition-colors"
                  onClick={() => handleSort("AccountID")}
                >
                  Account ID
                  <SortIcon active={sortKey === "AccountID"} dir={sortDir} />
                </th>
                <th
                  className="px-3 py-3 text-[10px] uppercase tracking-wider font-semibold text-[#1d1d1f]/40 whitespace-nowrap cursor-pointer select-none group hover:text-[#1d1d1f]/70 hover:bg-[#dddde0] transition-colors"
                  onClick={() => handleSort("CaseID")}
                >
                  Case ID
                  <SortIcon active={sortKey === "CaseID"} dir={sortDir} />
                </th>
                <th
                  className="px-3 py-3 text-[10px] uppercase tracking-wider font-semibold text-[#1d1d1f]/40 whitespace-nowrap cursor-pointer select-none group hover:text-[#1d1d1f]/70 hover:bg-[#dddde0] transition-colors"
                  onClick={() => handleSort("OrderType")}
                >
                  Order Type
                  <SortIcon active={sortKey === "OrderType"} dir={sortDir} />
                </th>
                <th
                  className="px-3 py-3 text-[10px] uppercase tracking-wider font-semibold text-[#1d1d1f]/40 whitespace-nowrap w-[90px] cursor-pointer select-none group hover:text-[#1d1d1f]/70 hover:bg-[#dddde0] transition-colors"
                  onClick={() => handleSort("SRD")}
                >
                  SRD
                  <SortIcon active={sortKey === "SRD"} dir={sortDir} />
                </th>
                <th
                  className="px-3 py-3 text-[10px] uppercase tracking-wider font-semibold text-[#1d1d1f]/40 whitespace-nowrap cursor-pointer select-none group hover:text-[#1d1d1f]/70 hover:bg-[#dddde0] transition-colors"
                  onClick={() => handleSort("Status")}
                >
                  Status
                  <SortIcon active={sortKey === "Status"} dir={sortDir} />
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
                        <td colSpan={10} className="px-4 py-3">
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
                          {pinnedIds.has(order.id) ? (
                            <Pin className="w-3.5 h-3.5 fill-current text-red-500 rotate-90 mx-auto" />
                          ) : (
                            <Pin className="w-3.5 h-3.5 text-[#1d1d1f]/20 rotate-90 mx-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                          )}
                        </td>
                        <td
                          className={`px-3 py-3 text-xs font-semibold hover:underline ${
                            isTerminated ? "text-red-600" : "text-[#0071e3]"
                          }`}
                        >
                          <Link to={`/orders/${order.id}`}>{order.Title}</Link>
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
                            isTerminated ? "text-red-500" : "text-[#1d1d1f]/45"
                          }`}
                          title={order.AccountID}
                        >
                          {order.AccountID ?? "—"}
                        </td>
                        <td className="px-3 py-3 text-xs max-w-[120px]">
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
                        </td>
                        <td
                          className={`px-3 py-3 text-xs ${
                            isTerminated ? "text-red-500" : "text-[#1d1d1f]/55"
                          }`}
                        >
                          {order.OrderType}
                        </td>
                        <td
                          className={`px-3 py-3 text-xs w-[90px] ${
                            isTerminated ? "text-red-500" : "text-[#1d1d1f]/45"
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
                        <td className="px-3 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
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
                              {/* Change Status */}
                              <div
                                className="relative"
                                onClick={(e) => e.stopPropagation()}
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
                                {statusDropdownId === order.id && (
                                  <div className="absolute right-0 top-full mt-1 z-50 bg-white border border-[#1d1d1f]/10 rounded-xl shadow-lg py-1 min-w-[210px]">
                                    <p className="px-3 py-1.5 text-[10px] font-semibold text-[#1d1d1f]/35 uppercase tracking-wider">
                                      Change Status
                                    </p>
                                    {STATUS_OPTIONS.map((s) => (
                                      <button
                                        key={s}
                                        onClick={() =>
                                          handleStatusChange(order.id, s)
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
                              <button
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isTerminated
                                    ? "text-red-400 hover:text-red-600 hover:bg-red-50"
                                    : "text-[#1d1d1f]/35 hover:text-[#1d1d1f] hover:bg-[#f5f5f7]"
                                }`}
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>
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
                    colSpan={9}
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
                  if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1)
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
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border border-[#1d1d1f]/08 rounded-lg hover:bg-[#f5f5f7] disabled:opacity-40 text-[#1d1d1f]/60"
            >
              Next
            </button>
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
