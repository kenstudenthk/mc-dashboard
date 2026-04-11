import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Filter, MoreHorizontal, Eye, Search } from "lucide-react";
import { TutorTooltip } from "../components/TutorTooltip";
import { orderService, Order } from "../services/orderService";

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

const OrderRegistry = () => {
  const [activeTab, setActiveTab] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [providerFilter, setProviderFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    orderService
      .findAll()
      .then(setAllOrders)
      .catch(() => setError("Failed to load orders. Please try again."))
      .finally(() => setLoading(false));
  }, []);

  const terminatedAccountIds = allOrders
    .filter((order) => order.OrderType === "Termination" && order.AccountID)
    .map((order) => order.AccountID);

  const filteredOrders = allOrders.filter((order) => {
    if (activeTab === "Pending") {
      if (["Completed", "Cancelled"].includes(order.Status)) return false;
    } else if (activeTab === "Completed") {
      if (order.Status !== "Completed") return false;
    }

    if (
      providerFilter !== "All" &&
      !order.CloudProvider.includes(providerFilter)
    ) {
      return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !order.Title.toLowerCase().includes(query) &&
        !order.CustomerName.toLowerCase().includes(query) &&
        !(order.AccountID && order.AccountID.toLowerCase().includes(query))
      ) {
        return false;
      }
    }

    return true;
  });

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
          <h1 className="text-3xl font-serif font-bold text-gray-900">
            Order Registry
          </h1>
          <p className="text-gray-500 mt-1">
            Manage and track all cloud provisioning orders.
          </p>
        </div>
        <TutorTooltip
          text="Click here to create a new cloud service order. You will be asked to fill out customer and service details."
          position="bottom"
          wrapperClass="inline-block"
        >
          <Link
            to="/orders/new"
            className="gradient-cta px-6 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-primary/20 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Order
          </Link>
        </TutorTooltip>
      </div>

      <div className="card overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
          <TutorTooltip
            text="Use these tabs to quickly filter between All orders, Pending orders, and Completed orders."
            position="bottom"
            wrapperClass="flex-1 sm:flex-none"
          >
            <div className="flex gap-2">
              {["All", "Pending", "Completed"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab
                      ? "bg-white border border-gray-200 text-gray-900 shadow-sm"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {tab === "All" ? "All Orders" : tab}
                </button>
              ))}
            </div>
          </TutorTooltip>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <TutorTooltip
              text="Search for a specific order by typing the Service No, Customer Name, or Account ID."
              position="bottom"
              wrapperClass="relative flex-1 sm:w-64"
            >
              <div className="relative flex-1 sm:w-full">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by Service No, Account ID, Customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </TutorTooltip>
            <TutorTooltip
              text="Click here to show or hide additional filters, such as filtering by Cloud Provider."
              position="bottom"
            >
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors border ${
                  showFilters
                    ? "bg-primary-light text-primary border-primary/20"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
                }`}
              >
                <Filter className="w-4 h-4" />
                Filter
              </button>
            </TutorTooltip>
          </div>
        </div>

        {showFilters && (
          <div className="p-4 border-b border-gray-100 bg-white flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">
                Provider:
              </label>
              <select
                value={providerFilter}
                onChange={(e) => setProviderFilter(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary/20"
              >
                <option value="All">All Providers</option>
                <option value="AWS">AWS</option>
                <option value="Azure">Azure</option>
                <option value="Huawei">Huawei Cloud</option>
                <option value="Google">GCP</option>
                <option value="AliCloud">AliCloud</option>
              </select>
            </div>
          </div>
        )}

        {error && (
          <div className="px-6 py-4 text-sm text-red-600 bg-red-50 border-b border-red-100">
            {error}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-6 py-4 label-text text-gray-400">
                  Service No.
                </th>
                <th className="px-6 py-4 label-text text-gray-400">
                  Company Name
                </th>
                <th className="px-6 py-4 label-text text-gray-400">
                  Product Subscribe
                </th>
                <th className="px-6 py-4 label-text text-gray-400">
                  Account ID
                </th>
                <th className="px-6 py-4 label-text text-gray-400">
                  Order Type
                </th>
                <th className="px-6 py-4 label-text text-gray-400">
                  Receive Date
                </th>
                <th className="px-6 py-4 label-text text-gray-400">Status</th>
                <th className="px-6 py-4 label-text text-gray-400 text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-400"
                  >
                    Loading orders…
                  </td>
                </tr>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const isTerminated =
                    terminatedAccountIds.includes(order.AccountID) &&
                    order.OrderType !== "Termination";

                  return (
                    <tr
                      key={order.id}
                      className={`border-b border-gray-50 transition-colors group ${isTerminated ? "bg-red-50/30 hover:bg-red-50/50" : "hover:bg-gray-50/50"}`}
                    >
                      <td
                        className={`px-6 py-4 font-medium hover:underline ${isTerminated ? "text-red-600" : "text-primary"}`}
                      >
                        <Link to={`/orders/${order.Title}`}>{order.Title}</Link>
                      </td>
                      <td className="px-6 py-4">
                        <Link
                          to={`/customers/${order.CustomerID}`}
                          className={`hover:underline transition-colors ${isTerminated ? "text-red-500 hover:text-red-700" : "text-gray-600 hover:text-primary"}`}
                        >
                          {order.CustomerName}
                        </Link>
                      </td>
                      <td
                        className={`px-6 py-4 font-medium ${isTerminated ? "text-red-600" : "text-gray-900"}`}
                      >
                        {order.CloudProvider}
                        {isTerminated && (
                          <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                            Terminated
                          </span>
                        )}
                      </td>
                      <td
                        className={`px-6 py-4 font-mono text-xs truncate max-w-[120px] ${isTerminated ? "text-red-500" : "text-gray-500"}`}
                        title={order.AccountID}
                      >
                        {order.AccountID ?? "—"}
                      </td>
                      <td
                        className={`px-6 py-4 ${isTerminated ? "text-red-500" : "text-gray-500"}`}
                      >
                        {order.OrderType}
                      </td>
                      <td
                        className={`px-6 py-4 ${isTerminated ? "text-red-500" : "text-gray-500"}`}
                      >
                        {formatDate(order.SRD)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(order.Status)}`}
                        >
                          {order.Status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/orders/${order.Title}`}
                            className={`p-2 rounded-lg transition-colors ${isTerminated ? "text-red-400 hover:text-red-600 hover:bg-red-100" : "text-gray-400 hover:text-primary hover:bg-primary-light"}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          <button
                            className={`p-2 rounded-lg transition-colors ${isTerminated ? "text-red-400 hover:text-red-600 hover:bg-red-100" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"}`}
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
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No orders found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-500">
          <div>Showing {filteredOrders.length} entries</div>
          <div className="flex gap-1">
            <button
              className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
              disabled
            >
              Prev
            </button>
            <button className="px-3 py-1 bg-primary text-white rounded">
              1
            </button>
            <button
              className="px-3 py-1 border border-gray-200 rounded hover:bg-gray-50 disabled:opacity-50"
              disabled
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderRegistry;
