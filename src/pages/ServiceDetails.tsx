import React, { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BriefcaseBusiness,
  ExternalLink,
  Filter,
  FileText,
  Mail,
  Search,
  ServerCog,
  UserRound,
} from "lucide-react";
import ServiceProviderLogo from "../components/ServiceProviderLogo";
import { normalizeCloudProvider } from "../constants/cloudProviders";
import {
  findServiceProvider,
  serviceProviders,
} from "../constants/serviceProviders";
import { Order } from "../services/orderService";
import { useOrders } from "../services/useOrdersQuery";

const statusClass = {
  Completed: "bg-green-100 text-green-700",
  "Account Created": "bg-blue-100 text-blue-700",
  Processing: "bg-yellow-100 text-yellow-700",
  Cancelled: "bg-red-100 text-red-700",
};

const fallback = "-";

function getStatusClass(status?: string) {
  return (
    statusClass[status as keyof typeof statusClass] ??
    "bg-gray-100 text-gray-700"
  );
}

type StringOrderKey = {
  [K in keyof Order]: Order[K] extends string | undefined ? K : never;
}[keyof Order];

function uniqueValues(orders: Order[], key: StringOrderKey): string[] {
  return Array.from(
    new Set(
      orders
        .map((order) => (order[key] as string | undefined)?.trim() ?? "")
        .filter(Boolean),
    ),
  ).sort();
}

const ServiceDetails = () => {
  const { id } = useParams<{ id: string }>();
  const provider = findServiceProvider(id);
  const { data: ordersData, isLoading } = useOrders();
  const orders = Array.isArray(ordersData) ? ordersData : [];
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("All");
  const [dataFilter, setDataFilter] = useState("All");

  const providerOrders = useMemo(() => {
    if (!provider) return [];
    return orders
      .filter(
        (order) =>
          normalizeCloudProvider(order.CloudProvider ?? "") === provider.provider,
      )
      .sort((a, b) => b.id - a.id);
  }, [orders, provider]);

  const statusOptions = useMemo(
    () => ["All", ...uniqueValues(providerOrders, "Status")],
    [providerOrders],
  );
  const serviceTypeOptions = useMemo(
    () => ["All", ...uniqueValues(providerOrders, "ServiceType")],
    [providerOrders],
  );

  const filteredOrders = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return providerOrders.filter((order) => {
      if (statusFilter !== "All" && order.Status !== statusFilter) return false;
      if (
        serviceTypeFilter !== "All" &&
        (order.ServiceType ?? "") !== serviceTypeFilter
      ) {
        return false;
      }
      if (dataFilter === "Missing Account ID" && order.AccountID?.trim()) {
        return false;
      }
      if (
        dataFilter === "Missing Login Email" &&
        order.AccountLoginEmail?.trim()
      ) {
        return false;
      }
      if (dataFilter === "With Case Link" && !order.CaseID?.trim()) {
        return false;
      }

      if (!query) return true;

      return [
        order.id,
        order.Title,
        order.CustomerName,
        order.AccountID,
        order.AccountName,
        order.AccountLoginEmail,
        order.BillingAccount,
        order.ServiceType,
        order.Status,
        order.CaseID,
        order.CxSRequestNo,
        order.SDNumber,
        order.SubName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(query);
    });
  }, [dataFilter, providerOrders, searchQuery, serviceTypeFilter, statusFilter]);

  const { accountCount, missingAccountCount, linkedCaseCount } = useMemo(
    () => ({
      accountCount: new Set(
        providerOrders
          .map((order) => order.AccountID?.trim())
          .filter((accountId): accountId is string => Boolean(accountId)),
      ).size,
      missingAccountCount: providerOrders.filter(
        (order) => !order.AccountID?.trim(),
      ).length,
      linkedCaseCount: providerOrders.filter((order) =>
        Boolean(order.CaseID?.trim()),
      ).length,
    }),
    [providerOrders],
  );

  if (!provider) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">
        <FileText className="mb-3 h-8 w-8 text-[#1d1d1f]/25" />
        <p className="font-semibold text-[#1d1d1f]">Provider not found</p>
        <Link
          to="/services"
          className="mt-4 rounded-xl border border-[#dad4c8] bg-white px-4 py-2 text-sm font-semibold text-[#55534e] transition-colors hover:bg-[#f5f5f7]"
        >
          Back to Services
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div
        className="overflow-hidden rounded-3xl border border-[#dad4c8]"
        style={{ backgroundColor: provider.primary }}
      >
        <div className="relative p-6 text-white md:p-8">
          <div
            className="absolute -right-12 -top-16 h-56 w-56 rounded-full shadow-2xl"
            style={{ backgroundColor: provider.logoContrast }}
          />
          <div
            className="absolute bottom-0 right-10 h-2 w-40 rounded-t-full opacity-70"
            style={{ backgroundColor: provider.secondary }}
          />
          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <Link
                to="/services"
                className="rounded-lg bg-white/10 p-2 transition-colors hover:bg-white/20"
                aria-label="Back to Services"
              >
                <ArrowLeft className="h-4 w-4 text-white" />
              </Link>
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/75">
                  <ServerCog className="h-3.5 w-3.5" />
                  {provider.shortName} service account view
                </div>
                <h1
                  className="text-[30px] font-semibold text-white"
                  style={{ letterSpacing: "-0.28px", lineHeight: "1.1" }}
                >
                  {provider.headline}
                </h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">
                  {provider.description}
                </p>
              </div>
            </div>
            <div className="relative flex h-36 w-36 shrink-0 items-center justify-center rounded-full border border-white/25 md:h-44 md:w-44">
              <div
                className="absolute inset-0 rounded-full opacity-95"
                style={{ backgroundColor: provider.logoContrast }}
              />
              <ServiceProviderLogo
                provider={provider}
                variant="header"
                className="relative z-10"
                imageClassName="h-16 w-28 drop-shadow-sm md:w-36"
                fallbackSize={54}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-20 flex gap-2 overflow-x-auto rounded-2xl border border-[#dad4c8] bg-white p-3 shadow-sm">
        {serviceProviders.map((item) => {
          const isActive = item.id === provider.id;
          return (
            <Link
              key={item.id}
              to={`/services/${item.id}`}
              className={`flex min-w-fit items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                isActive
                  ? "text-white"
                  : "border-[#dad4c8] bg-white text-[#55534e] hover:bg-[#f5f5f7]"
              }`}
              style={
                isActive
                  ? {
                      backgroundColor: item.primary,
                      borderColor: item.primary,
                    }
                  : undefined
              }
            >
              <ServiceProviderLogo
                provider={item}
                imageClassName="h-5 w-12"
                fallbackSize={20}
              />
              <span>{item.shortName}</span>
            </Link>
          );
        })}
      </div>

      <section className="grid gap-3 md:grid-cols-4">
        <div className="card p-4">
          <p className="text-2xl font-semibold text-[#1d1d1f]">
            {isLoading ? "-" : accountCount}
          </p>
          <p className="mt-1 text-xs text-[#1d1d1f]/45">Service Accounts</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-semibold text-[#1d1d1f]">
            {isLoading ? "-" : providerOrders.length}
          </p>
          <p className="mt-1 text-xs text-[#1d1d1f]/45">Linked Orders</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-semibold text-[#1d1d1f]">
            {isLoading ? "-" : linkedCaseCount}
          </p>
          <p className="mt-1 text-xs text-[#1d1d1f]/45">Case References</p>
        </div>
        <div className="card p-4">
          <p className="text-2xl font-semibold text-[#1d1d1f]">
            {isLoading ? "-" : missingAccountCount}
          </p>
          <p className="mt-1 text-xs text-[#1d1d1f]/45">Missing Account ID</p>
        </div>
      </section>

      <div className="card overflow-hidden">
        <div
          className="border-b border-[#dad4c8] p-4"
          style={{ backgroundColor: provider.surface }}
        >
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#1d1d1f]/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search customer, account ID, login email, case, service type..."
                className="w-full rounded-xl border border-[#dad4c8] bg-white py-2 pl-9 pr-4 text-sm text-[#1d1d1f] transition-all placeholder:text-[#1d1d1f]/30 focus:outline-none focus:ring-2 focus:ring-black/10 xl:w-[32rem]"
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-2 text-[#1d1d1f]/45">
                <Filter className="h-4 w-4" />
                <span className="text-xs font-semibold uppercase tracking-[0.09em]">
                  Filter
                </span>
              </div>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-xl border border-[#dad4c8] bg-white px-3 py-2 text-sm font-medium text-[#55534e]"
                aria-label="Filter by status"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status === "All" ? "All Statuses" : status}
                  </option>
                ))}
              </select>
              <select
                value={serviceTypeFilter}
                onChange={(event) => setServiceTypeFilter(event.target.value)}
                className="rounded-xl border border-[#dad4c8] bg-white px-3 py-2 text-sm font-medium text-[#55534e]"
                aria-label="Filter by service type"
              >
                {serviceTypeOptions.map((serviceType) => (
                  <option key={serviceType} value={serviceType}>
                    {serviceType === "All" ? "All Service Types" : serviceType}
                  </option>
                ))}
              </select>
              <select
                value={dataFilter}
                onChange={(event) => setDataFilter(event.target.value)}
                className="rounded-xl border border-[#dad4c8] bg-white px-3 py-2 text-sm font-medium text-[#55534e]"
                aria-label="Filter by account data quality"
              >
                <option value="All">All Records</option>
                <option value="Missing Account ID">Missing Account ID</option>
                <option value="Missing Login Email">Missing Login Email</option>
                <option value="With Case Link">With Case Link</option>
              </select>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1050px] text-left">
            <thead>
              <tr className="border-b border-[#dad4c8] bg-white text-[11px] uppercase tracking-[0.08em] text-[#1d1d1f]/40">
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">
                  {provider.accountLabel}
                </th>
                <th className="px-4 py-3 font-semibold">Service</th>
                <th className="px-4 py-3 font-semibold">
                  {provider.loginLabel}
                </th>
                <th className="px-4 py-3 font-semibold">
                  {provider.billingLabel}
                </th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">References</th>
                <th className="px-4 py-3 text-right font-semibold">Order</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-sm text-[#1d1d1f]/45"
                  >
                    Loading service accounts...
                  </td>
                </tr>
              )}

              {!isLoading &&
                filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[#1d1d1f]/05 bg-white transition-colors hover:bg-[#faf9f7]"
                  >
                    <td className="px-4 py-4 align-top">
                      <div className="flex items-start gap-2">
                        <UserRound className="mt-0.5 h-4 w-4 shrink-0 text-[#1d1d1f]/35" />
                        <div>
                          <p className="font-semibold text-[#1d1d1f]">
                            {order.CustomerName || fallback}
                          </p>
                          <p className="mt-1 text-xs text-[#1d1d1f]/45">
                            {order.SubName ||
                              order.Title ||
                              `Order #${order.id}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="font-mono text-sm font-semibold text-[#1d1d1f]">
                        {order.AccountID || fallback}
                      </p>
                      <p className="mt-1 text-xs text-[#1d1d1f]/45">
                        {order.AccountName || "No account name"}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="text-sm font-medium text-[#1d1d1f]">
                        {order.ServiceType || fallback}
                      </p>
                      <p className="mt-1 text-xs text-[#1d1d1f]/45">
                        {order.OrderType || "No order type"}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex items-start gap-2 text-sm text-[#55534e]">
                        <Mail className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#1d1d1f]/30" />
                        <span>{order.AccountLoginEmail || fallback}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <p className="text-sm text-[#55534e]">
                        {order.BillingAccount || fallback}
                      </p>
                      <p className="mt-1 max-w-[12rem] truncate text-xs text-[#1d1d1f]/45">
                        {order.BillingAddress || "No billing address"}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span
                        className={`rounded-full px-2 py-1 text-[11px] font-semibold ${getStatusClass(order.Status)}`}
                      >
                        {order.Status || "Unknown"}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="space-y-1 text-xs text-[#55534e]">
                        <p>Case: {order.CaseID || fallback}</p>
                        <p>CxS: {order.CxSRequestNo || fallback}</p>
                        <p>SD: {order.SDNumber || fallback}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right align-top">
                      <Link
                        to={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85"
                        style={{ backgroundColor: provider.primary }}
                      >
                        Open
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}

              {!isLoading && filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <BriefcaseBusiness className="mx-auto mb-3 h-8 w-8 text-[#1d1d1f]/25" />
                    <p className="font-semibold text-[#1d1d1f]">
                      No service account records found
                    </p>
                    <p className="mt-1 text-sm text-[#1d1d1f]/45">
                      Adjust the search or filters for this provider.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="text-base font-semibold text-[#1d1d1f]">
            Page Details
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#55534e]">
            This provider page is built from order service account fields:
            account ID, account name, login email, billing account, service
            type, case reference, CxS request, SD number, and order status.
          </p>
        </div>
        <div
          className="rounded-2xl border p-5"
          style={{
            backgroundColor: provider.surface,
            borderColor: provider.secondary,
          }}
        >
          <p className="label-text mb-2" style={{ color: provider.primary }}>
            Brand Treatment
          </p>
          <p className="text-sm leading-6 text-[#55534e]">
            This page uses {provider.displayName} colors to make the active
            service provider immediately recognizable.
          </p>
        </div>
      </section>
    </div>
  );
};

export default ServiceDetails;
