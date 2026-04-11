import React, { useEffect, useState } from "react";
import { Clock, Calendar, Cloud, List, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { TutorTooltip } from "../components/TutorTooltip";
import { orderService, Order } from "../services/orderService";

const INCOMPLETE_STATUSES = new Set([
  "Processing",
  "Account Created",
  "Pending for order issued",
  "Pending for other parties",
  "Pending Closure",
]);

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

const Dashboard = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService
      .findAll()
      .then((result) => setOrders(Array.isArray(result) ? result : []))
      .catch(() => {
        /* keep empty on failure */
      })
      .finally(() => setLoading(false));
  }, []);

  const incompleteOrders = orders.filter((o) =>
    INCOMPLETE_STATUSES.has(o.Status),
  );
  const srdTodayOrders = orders.filter((o) => isToday(o.SRD));
  const preProvisionOrders = orders.filter((o) => o.Title === "TBC");
  const completedCount = orders.filter((o) => o.Status === "Completed").length;

  const stats = [
    {
      label: "Incomplete Orders",
      value: loading ? "…" : String(incompleteOrders.length),
      icon: Clock,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
      tooltip:
        "Total number of orders that are currently being processed and are not yet completed.",
    },
    {
      label: "SRD Today",
      value: loading ? "…" : String(srdTodayOrders.length),
      icon: Calendar,
      color: "text-blue-600",
      bg: "bg-blue-100",
      tooltip:
        "Orders that have a Service Ready Date (SRD) matching today's date.",
    },
    {
      label: "Pre-Provision Orders",
      value: loading ? "…" : String(preProvisionOrders.length),
      icon: Cloud,
      color: "text-purple-600",
      bg: "bg-purple-100",
      tooltip:
        "Cloud accounts created in advance without an official Service No. yet.",
    },
    {
      label: "Total Completed",
      value: loading ? "…" : String(completedCount),
      icon: List,
      color: "text-green-600",
      bg: "bg-green-100",
      tooltip: "Total number of successfully completed orders in the system.",
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif font-bold text-gray-900">
            Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Welcome back. Here's your cloud provisioning overview.
          </p>
        </div>
        <TutorTooltip
          text="Click here to start provisioning a new cloud service order."
          position="bottom"
          wrapperClass="inline-block"
        >
          <Link
            to="/orders/new"
            className="gradient-cta px-6 py-2.5 rounded-xl font-medium text-sm shadow-lg shadow-primary/20 block"
          >
            Create New Order
          </Link>
        </TutorTooltip>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <TutorTooltip key={index} text={stat.tooltip} position="bottom">
            <div className="card p-6 h-full">
              <div className="flex items-center justify-between mb-4">
                <div
                  className={`w-10 h-10 rounded-full ${stat.bg} flex items-center justify-center ${stat.color}`}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-900 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 font-medium">
                {stat.label}
              </div>
            </div>
          </TutorTooltip>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incomplete Orders */}
        <TutorTooltip
          text="A quick view of orders that need attention. Click 'View All' to see the full list in the Order Registry."
          position="top"
        >
          <div className="card p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-600" />
                Incomplete Orders
              </h2>
              <Link
                to="/orders"
                className="text-sm font-medium text-primary hover:underline"
              >
                View All
              </Link>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 label-text text-gray-400">
                      Service No.
                    </th>
                    <th className="pb-3 label-text text-gray-400">Customer</th>
                    <th className="pb-3 label-text text-gray-400">Status</th>
                    <th className="pb-3 label-text text-gray-400">SRD</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-6 text-center text-gray-400"
                      >
                        Loading…
                      </td>
                    </tr>
                  ) : incompleteOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-6 text-center text-gray-400"
                      >
                        No incomplete orders.
                      </td>
                    </tr>
                  ) : (
                    incompleteOrders.slice(0, 5).map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="py-3 font-medium text-primary hover:underline">
                          <Link to={`/orders/${order.Title}`}>
                            {order.Title}
                          </Link>
                        </td>
                        <td className="py-3 text-gray-600 text-sm truncate max-w-[150px]">
                          {order.CustomerName}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${getStatusColor(order.Status)}`}
                          >
                            {order.Status}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500 text-sm">
                          {formatDate(order.SRD)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TutorTooltip>

        <div className="space-y-6 flex flex-col">
          {/* SRD Today */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                SRD Today
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 label-text text-gray-400">
                      Service No.
                    </th>
                    <th className="pb-3 label-text text-gray-400">Customer</th>
                    <th className="pb-3 label-text text-gray-400">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-4 text-center text-gray-400"
                      >
                        Loading…
                      </td>
                    </tr>
                  ) : srdTodayOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-4 text-center text-gray-400"
                      >
                        No orders due today.
                      </td>
                    </tr>
                  ) : (
                    srdTodayOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="py-3 font-medium text-primary hover:underline">
                          <Link to={`/orders/${order.Title}`}>
                            {order.Title}
                          </Link>
                        </td>
                        <td className="py-3 text-gray-600 text-sm truncate max-w-[150px]">
                          {order.CustomerName}
                        </td>
                        <td className="py-3">
                          <span
                            className={`px-2 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap ${getStatusColor(order.Status)}`}
                          >
                            {order.Status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pre-Provision Orders */}
          <div className="card p-6 flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-serif font-bold text-gray-900 flex items-center gap-2">
                <Cloud className="w-5 h-5 text-purple-600" />
                Pre-Provision Orders
              </h2>
              <span className="text-xs text-gray-500">
                Awaiting Service No.
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="pb-3 label-text text-gray-400">Customer</th>
                    <th className="pb-3 label-text text-gray-400">Product</th>
                    <th className="pb-3 label-text text-gray-400">SRD</th>
                    <th className="pb-3 label-text text-gray-400 text-right">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-4 text-center text-gray-400"
                      >
                        Loading…
                      </td>
                    </tr>
                  ) : preProvisionOrders.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="py-4 text-center text-gray-400"
                      >
                        No pre-provision orders.
                      </td>
                    </tr>
                  ) : (
                    preProvisionOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                      >
                        <td className="py-3 text-gray-900 font-medium text-sm truncate max-w-[150px]">
                          {order.CustomerName}
                        </td>
                        <td className="py-3 text-sm text-gray-600">
                          {order.CloudProvider}
                        </td>
                        <td className="py-3 text-sm text-gray-500">
                          {formatDate(order.SRD)}
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            to={`/orders/${order.Title}`}
                            className="text-primary hover:text-primary/80 transition-colors inline-flex p-1 bg-primary-light rounded"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
