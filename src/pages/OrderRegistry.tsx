import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Filter, MoreHorizontal, Eye, Search, RefreshCw, Upload } from "lucide-react";
import { TutorTooltip } from "../components/TutorTooltip";
import { Order } from "../services/orderService";
import { Customer } from "../services/customerService";
import { useOrders, useCustomers, useInvalidateOrders, useInvalidateCustomers, useInitialOrders } from "../services/useOrdersQuery";
import { BulkImportModal } from "../components/BulkImport/BulkImportModal";

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
          <td className="px-6 py-3.5"><div className="h-3.5 bg-gray-200 rounded w-24" /></td>
          <td className="px-6 py-3.5"><div className="h-3.5 bg-gray-100 rounded w-36" /></td>
          <td className="px-6 py-3.5"><div className="h-3.5 bg-gray-100 rounded w-20" /></td>
          <td className="px-6 py-3.5"><div className="h-3.5 bg-gray-100 rounded w-28" /></td>
          <td className="px-6 py-3.5"><div className="h-3.5 bg-gray-100 rounded w-20" /></td>
          <td className="px-6 py-3.5"><div className="h-3.5 bg-gray-100 rounded w-16" /></td>
          <td className="px-6 py-3.5"><div className="h-5 bg-gray-200 rounded-full w-20" /></td>
          <td className="px-6 py-3.5" />
        </tr>
      ))}
    </>
  );
}

const PAGE_SIZE = 20;

const buildCustomerMap = (customers: Customer[]): Map<string, number> => {
  const map = new Map<string, number>();
  customers.forEach((c) => {
    if (c.Title) map.set(c.Title.toLowerCase(), c.id);
  });
  return map;
};

const OrderRegistry = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [providerFilter, setProviderFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showBulkImport, setShowBulkImport] = useState(false);

  const { data: ordersData, isLoading: ordersLoading } = useInitialOrders();
  const { data: customersData, isLoading: customersLoading } = useCustomers();
  const { isFetching } = useOrders(); // background full-load indicator
  const invalidateOrders = useInvalidateOrders();
  const invalidateCustomers = useInvalidateCustomers();

  const allOrders: Order[] = Array.isArray(ordersData) ? ordersData : [];
  const customerMap = buildCustomerMap(Array.isArray(customersData) ? customersData : []);

  const loading = ordersLoading || customersLoading;

  const handleRefresh = () => {
    invalidateOrders();
    invalidateCustomers();
  };

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, providerFilter, statusFilter, searchQuery]);

  const uniqueStatuses = Array.from(
    new Set(allOrders.map((o) => o.Status).filter(Boolean))
  ).sort();

  const terminatedAccountIds = allOrders
    .filter((order) => order.OrderType === "Termination" && order.AccountID)
    .map((order) => order.AccountID);

  const filteredOrders = [...allOrders].sort((a, b) => b.id - a.id).filter((order) => {
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
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / PAGE_SIZE));
  const pagedOrders = filteredOrders.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const rangeStart = filteredOrders.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filteredOrders.length);

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-[28px] font-semibold text-[#1d1d1f]"
            style={{ letterSpacing: "-0.28px", lineHeight: "1.1" }}
          >
            Order Registry
          </h1>
          <p className="text-sm text-[#1d1d1f]/50 mt-1">
            Manage and track all cloud provisioning orders.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isFetching}
            className="px-4 py-2 rounded-lg font-medium text-sm border border-[#1d1d1f]/10 bg-white text-[#1d1d1f]/70 hover:bg-[#f5f5f7] flex items-center gap-2 disabled:opacity-50 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`} />
            {isFetching ? "Refreshing…" : "Refresh"}
          </button>
          <button
            onClick={() => setShowBulkImport(true)}
            className="px-4 py-2 rounded-lg font-medium text-sm border border-[#1d1d1f]/10 bg-white text-[#1d1d1f]/70 hover:bg-[#f5f5f7] flex items-center gap-2 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <TutorTooltip
            text="Click here to create a new cloud service order. You will be asked to fill out customer and service details."
            position="bottom"
            wrapperClass="inline-block"
          >
            <Link
              to="/orders/new"
              className="gradient-cta px-5 py-2 rounded-lg font-medium text-sm shadow-sm flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              New Order
            </Link>
          </TutorTooltip>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-[#1d1d1f]/06 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#f5f5f7]/60">
          <TutorTooltip
            text="Use these tabs to quickly filter between All orders, Pending orders, and Completed orders."
            position="bottom"
            wrapperClass="flex-1 sm:flex-none"
          >
            <div className="flex gap-1">
              {["All", "Pending", "Completed"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab
                      ? "bg-white border border-[#1d1d1f]/08 text-[#1d1d1f] shadow-sm"
                      : "text-[#1d1d1f]/50 hover:text-[#1d1d1f] hover:bg-white/60"
                  }`}
                >
                  {tab === "All" ? "All Orders" : tab}
                </button>
              ))}
            </div>
          </TutorTooltip>

          <div className="flex items-center gap-2 w-full sm:w-auto">
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
                className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors border ${
                  showFilters
                    ? "bg-blue-50 text-[#0071e3] border-[#0071e3]/20"
                    : "bg-white text-[#1d1d1f]/70 border-[#1d1d1f]/08 hover:bg-[#f5f5f7]"
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filter
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
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1d1d1f]/06">
                <th className="px-6 py-3.5 label-text text-[#1d1d1f]/35">
                  Service No.
                </th>
                <th className="px-6 py-3.5 label-text text-[#1d1d1f]/35">
                  Company Name
                </th>
                <th className="px-6 py-3.5 label-text text-[#1d1d1f]/35">
                  Product Subscribe
                </th>
                <th className="px-6 py-3.5 label-text text-[#1d1d1f]/35">
                  Account ID
                </th>
                <th className="px-6 py-3.5 label-text text-[#1d1d1f]/35">
                  Order Type
                </th>
                <th className="px-6 py-3.5 label-text text-[#1d1d1f]/35">
                  SRD
                </th>
                <th className="px-6 py-3.5 label-text text-[#1d1d1f]/35">
                  Status
                </th>
                <th className="px-6 py-3.5 label-text text-[#1d1d1f]/35 text-right">
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
                    <tr
                      key={order.id}
                      className={`border-b border-[#1d1d1f]/04 transition-colors group ${isTerminated ? "bg-red-50/30 hover:bg-red-50/50" : "hover:bg-[#f5f5f7]"}`}
                    >
                      <td
                        className={`px-6 py-3.5 text-xs font-semibold hover:underline ${isTerminated ? "text-red-600" : "text-[#0071e3]"}`}
                      >
                        <Link to={`/orders/${order.id}`}>{order.Title}</Link>
                      </td>
                      <td className="px-6 py-3.5 text-sm">
                        {customerMap.get(
                          (order.CustomerName ?? "").toLowerCase(),
                        ) ? (
                          <Link
                            to={`/customers/${customerMap.get((order.CustomerName ?? "").toLowerCase())}`}
                            className={`hover:underline transition-colors ${isTerminated ? "text-red-500 hover:text-red-700" : "text-[#1d1d1f]/70 hover:text-[#0071e3]"}`}
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
                      <td
                        className={`px-6 py-3.5 text-sm font-medium ${isTerminated ? "text-red-600" : "text-[#1d1d1f]"}`}
                      >
                        {order.CloudProvider}
                        {isTerminated && (
                          <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Terminated
                          </span>
                        )}
                      </td>
                      <td
                        className={`px-6 py-3.5 font-mono text-xs truncate max-w-[120px] ${isTerminated ? "text-red-500" : "text-[#1d1d1f]/45"}`}
                        title={order.AccountID}
                      >
                        {order.AccountID ?? "—"}
                      </td>
                      <td
                        className={`px-6 py-3.5 text-sm ${isTerminated ? "text-red-500" : "text-[#1d1d1f]/60"}`}
                      >
                        {order.OrderType}
                      </td>
                      <td
                        className={`px-6 py-3.5 text-sm ${isTerminated ? "text-red-500" : "text-[#1d1d1f]/45"}`}
                      >
                        {formatDate(order.SRD)}
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${getStatusColor(order.Status)}`}
                        >
                          {order.Status}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/orders/${order.id}`}
                            className={`p-1.5 rounded-lg transition-colors ${isTerminated ? "text-red-400 hover:text-red-600 hover:bg-red-50" : "text-[#1d1d1f]/35 hover:text-[#0071e3] hover:bg-blue-50"}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            className={`p-1.5 rounded-lg transition-colors ${isTerminated ? "text-red-400 hover:text-red-600 hover:bg-red-50" : "text-[#1d1d1f]/35 hover:text-[#1d1d1f] hover:bg-[#f5f5f7]"}`}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-[#1d1d1f]/30 text-sm"
                  >
                    No orders found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-[#1d1d1f]/06 flex items-center justify-between text-xs text-[#1d1d1f]/45">
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
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 2)
              .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                acc.push(p);
                return acc;
              }, [])
              .map((item, idx) =>
                item === "…" ? (
                  <span key={`ellipsis-${idx}`} className="px-2 py-1 text-[#1d1d1f]/30">…</span>
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
                )
              )}
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

      {showBulkImport && (
        <BulkImportModal
          customers={Array.isArray(customersData) ? (customersData as Customer[]) : []}
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
