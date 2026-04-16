import React from "react";
import { Clock, Calendar, Cloud, List, Eye } from "lucide-react";
import { Link } from "react-router-dom";
import { TutorTooltip } from "../components/TutorTooltip";
import { Order } from "../services/orderService";
import { useOrders } from "../services/useOrdersQuery";

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
  const { data, isLoading: loading } = useOrders();
  const orders: Order[] = Array.isArray(data) ? data : [];

  const incompleteOrders = orders.filter((o) =>
    INCOMPLETE_STATUSES.has(o.Status),
  );
  const srdTodayOrders = orders.filter((o) => isToday(o.SRD));
  const preProvisionOrders = orders.filter((o) => o.Title === "TBC");
  const completedCount = orders.filter((o) => o.Status === "Completed").length;

  const stats = [
    {
      label: "Incomplete Orders",
      value: loading ? "—" : String(incompleteOrders.length),
      icon: Clock,
      iconColor: "text-yellow-600",
      iconBg: "bg-yellow-50",
      tooltip:
        "Total number of orders that are currently being processed and are not yet completed.",
    },
    {
      label: "SRD Today",
      value: loading ? "—" : String(srdTodayOrders.length),
      icon: Calendar,
      iconColor: "text-[#0071e3]",
      iconBg: "bg-blue-50",
      tooltip:
        "Orders that have a Service Ready Date (SRD) matching today's date.",
    },
    {
      label: "Pre-Provision Orders",
      value: loading ? "—" : String(preProvisionOrders.length),
      icon: Cloud,
      iconColor: "text-purple-600",
      iconBg: "bg-purple-50",
      tooltip:
        "Cloud accounts created in advance without an official Service No. yet.",
    },
    {
      label: "Total Completed",
      value: loading ? "—" : String(completedCount),
      icon: List,
      iconColor: "text-green-600",
      iconBg: "bg-green-50",
      tooltip: "Total number of successfully completed orders in the system.",
    },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-[28px] font-semibold text-[#1d1d1f]"
            style={{ letterSpacing: "-0.28px", lineHeight: "1.1" }}
          >
            Dashboard
          </h1>
          <p className="text-sm text-[#1d1d1f]/50 mt-1" style={{ letterSpacing: "-0.224px" }}>
            Cloud provisioning overview
          </p>
        </div>
        <TutorTooltip
          text="Click here to start provisioning a new cloud service order."
          position="bottom"
          wrapperClass="inline-block"
        >
          <Link
            to="/orders/new"
            className="gradient-cta px-5 py-2 rounded-lg text-sm font-medium shadow-sm block"
          >
            Create New Order
          </Link>
        </TutorTooltip>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <TutorTooltip key={index} text={stat.tooltip} position="bottom">
            <div className="card p-5 h-full">
              <div className={`w-9 h-9 rounded-lg ${stat.iconBg} flex items-center justify-center ${stat.iconColor} mb-4`}>
                <stat.icon className="w-4.5 h-4.5" />
              </div>
              <div
                className="text-[28px] font-semibold text-[#1d1d1f] mb-0.5 leading-none"
                style={{ fontFamily: "SF Pro Display, Helvetica Neue, Helvetica, Arial, sans-serif", letterSpacing: "-0.28px" }}
              >
                {stat.value}
              </div>
              <div className="text-xs text-[#1d1d1f]/50 font-medium" style={{ letterSpacing: "-0.12px" }}>
                {stat.label}
              </div>
            </div>
          </TutorTooltip>
        ))}
      </div>

      {/* Tables section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Incomplete Orders */}
        <TutorTooltip
          text="A quick view of orders that need attention. Click 'View All' to see the full list in the Order Registry."
          position="top"
        >
          <div className="card p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-[17px] font-semibold text-[#1d1d1f] flex items-center gap-2"
                style={{ letterSpacing: "-0.374px" }}
              >
                <Clock className="w-4 h-4 text-yellow-500" />
                Incomplete Orders
              </h2>
              <Link
                to="/orders"
                className="text-xs font-medium text-[#0071e3] hover:underline"
              >
                View All
              </Link>
            </div>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#1d1d1f]/06">
                    <th className="pb-2.5 label-text text-[#1d1d1f]/35">Service No.</th>
                    <th className="pb-2.5 label-text text-[#1d1d1f]/35">Customer</th>
                    <th className="pb-2.5 label-text text-[#1d1d1f]/35">Status</th>
                    <th className="pb-2.5 label-text text-[#1d1d1f]/35">SRD</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-[#1d1d1f]/30 text-sm">
                        Loading…
                      </td>
                    </tr>
                  ) : incompleteOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-[#1d1d1f]/30 text-sm">
                        No incomplete orders.
                      </td>
                    </tr>
                  ) : (
                    incompleteOrders.slice(0, 5).map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-[#1d1d1f]/04 last:border-0 hover:bg-[#f5f5f7] transition-colors"
                      >
                        <td className="py-3 text-xs font-semibold text-[#0071e3] hover:underline">
                          <Link to={`/orders/${order.Title}`}>{order.Title}</Link>
                        </td>
                        <td className="py-3 text-xs text-[#1d1d1f]/70 truncate max-w-[130px]">
                          {order.CustomerName}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${getStatusColor(order.Status)}`}>
                            {order.Status}
                          </span>
                        </td>
                        <td className="py-3 text-xs text-[#1d1d1f]/45">
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

        <div className="space-y-5 flex flex-col">
          {/* SRD Today */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-[17px] font-semibold text-[#1d1d1f] flex items-center gap-2"
                style={{ letterSpacing: "-0.374px" }}
              >
                <Calendar className="w-4 h-4 text-[#0071e3]" />
                SRD Today
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#1d1d1f]/06">
                    <th className="pb-2.5 label-text text-[#1d1d1f]/35">Service No.</th>
                    <th className="pb-2.5 label-text text-[#1d1d1f]/35">Customer</th>
                    <th className="pb-2.5 label-text text-[#1d1d1f]/35">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={3} className="py-5 text-center text-[#1d1d1f]/30 text-sm">
                        Loading…
                      </td>
                    </tr>
                  ) : srdTodayOrders.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-5 text-center text-[#1d1d1f]/30 text-sm">
                        No orders due today.
                      </td>
                    </tr>
                  ) : (
                    srdTodayOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-[#1d1d1f]/04 last:border-0 hover:bg-[#f5f5f7] transition-colors"
                      >
                        <td className="py-3 text-xs font-semibold text-[#0071e3] hover:underline">
                          <Link to={`/orders/${order.Title}`}>{order.Title}</Link>
                        </td>
                        <td className="py-3 text-xs text-[#1d1d1f]/70 truncate max-w-[130px]">
                          {order.CustomerName}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold whitespace-nowrap ${getStatusColor(order.Status)}`}>
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
            <div className="flex items-center justify-between mb-5">
              <h2
                className="text-[17px] font-semibold text-[#1d1d1f] flex items-center gap-2"
                style={{ letterSpacing: "-0.374px" }}
              >
                <Cloud className="w-4 h-4 text-purple-500" />
                Pre-Provision Orders
              </h2>
              <span className="text-[10px] label-text text-[#1d1d1f]/30">
                Awaiting Service No.
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#1d1d1f]/06">
                    <th className="pb-2.5 label-text text-[#1d1d1f]/35">Customer</th>
                    <th className="pb-2.5 label-text text-[#1d1d1f]/35">Product</th>
                    <th className="pb-2.5 label-text text-[#1d1d1f]/35">SRD</th>
                    <th className="pb-2.5 label-text text-[#1d1d1f]/35 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="py-5 text-center text-[#1d1d1f]/30 text-sm">
                        Loading…
                      </td>
                    </tr>
                  ) : preProvisionOrders.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-5 text-center text-[#1d1d1f]/30 text-sm">
                        No pre-provision orders.
                      </td>
                    </tr>
                  ) : (
                    preProvisionOrders.map((order) => (
                      <tr
                        key={order.id}
                        className="border-b border-[#1d1d1f]/04 last:border-0 hover:bg-[#f5f5f7] transition-colors"
                      >
                        <td className="py-3 text-xs font-medium text-[#1d1d1f] truncate max-w-[120px]">
                          {order.CustomerName}
                        </td>
                        <td className="py-3 text-xs text-[#1d1d1f]/60">
                          {order.CloudProvider}
                        </td>
                        <td className="py-3 text-xs text-[#1d1d1f]/45">
                          {formatDate(order.SRD)}
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            to={`/orders/${order.Title}`}
                            className="text-[#0071e3] hover:text-[#0071e3]/70 transition-colors inline-flex p-1.5 bg-blue-50 rounded-lg"
                          >
                            <Eye className="w-3.5 h-3.5" />
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
